import { useEffect, useRef } from 'react'
import { Annotation, Compartment, EditorSelection, EditorState, Prec } from '@codemirror/state'
import type { Extension, Transaction } from '@codemirror/state'
import {
  EditorView,
  crosshairCursor,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import {
  HighlightStyle,
  bracketMatching,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { java } from '@codemirror/lang-java'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'
import { javascript } from '@codemirror/lang-javascript'
import { tags as t } from '@lezer/highlight'
import { C, monoStack } from '../theme'
import { ALLOW_EXTERNAL_PASTE } from '../config/testMode'
import type { EditorMonitor } from '../antiCheat'
import type { LanguageCode } from '../types/domain'

/** 이 에디터에서 복사한 텍스트를 기억해 둘 개수 (클립보드 매니저로 이전 항목을 붙여넣는 경우 대비) */
const CLIPBOARD_HISTORY = 20

/** 키 입력 직후 이 시간 안의 변경만 그 키(에디터 명령)의 결과로 본다 — detector KEYSTROKE_GRACE_MS와 동일 */
const KEY_GRACE_MS = 80

/** 키 1번이 여러 글자를 만들 수 있는 키 — 자동 들여쓰기(Enter)·들여쓰기(Tab)·단축키 명령 */
const COMMAND_KEYS = new Set(['Enter', 'Tab', 'Backspace', 'Delete'])

/** 클립보드를 거치면 개행이 CRLF로 바뀌는 환경(Windows)이 있어 비교 전에 맞춰준다 */
const normalizeEol = (s: string) => s.replace(/\r\n/g, '\n')

/** 프로그램이 넣은 변경(언어 전환·초기화·초안 복원) 표시 — 탐지기와 onChange로 흘려보내지 않는다 */
const External = Annotation.define<boolean>()

export interface CursorInfo {
  line: number
  col: number
  /** 선택된 글자 수 (0이면 선택 없음) */
  selected: number
  lines: number
}

const LANGUAGE_EXT: Record<LanguageCode, () => Extension> = {
  java11: () => java(),
  python3: () => python(),
  cpp17: () => cpp(),
  nodejs: () => javascript(),
}

// 신택스 색상 — 기존 하이라이터(VSCode Dark+ 톤)를 그대로 옮겼다
const highlightStyle = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: '#569cd6' },
  { tag: [t.bool, t.null, t.self, t.atom], color: '#569cd6' },
  { tag: [t.typeName, t.className, t.namespace, t.standard(t.variableName)], color: '#4ec9b0' },
  { tag: [t.string, t.special(t.string), t.character], color: '#ce9178' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#6a9955' },
  { tag: [t.number, t.integer, t.float], color: '#b5cea8' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#dcdcaa' },
  { tag: [t.processingInstruction, t.meta, t.macroName], color: '#c586c0' },
  { tag: t.propertyName, color: '#9cdcfe' },
  { tag: t.invalid, color: C.red },
])

const editorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      fontSize: '13px',
      color: C.text,
      backgroundColor: C.bg,
    },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': { fontFamily: monoStack, lineHeight: '20px' },
    '.cm-content': { padding: '12px 0', caretColor: C.text },
    '.cm-line': { padding: '0 12px' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: C.text, borderLeftWidth: '2px' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection':
      { backgroundColor: 'rgba(56, 139, 253, 0.35)' },
    '.cm-gutters': {
      backgroundColor: C.surfaceAlt,
      color: C.muted,
      border: 'none',
      borderRight: `1px solid ${C.borderLight}`,
      fontVariantNumeric: 'tabular-nums',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 12px', minWidth: '24px' },
    '.cm-activeLine': { backgroundColor: 'rgba(110, 118, 129, 0.10)' },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(110, 118, 129, 0.18)', color: C.text },
    '&.cm-focused .cm-matchingBracket': {
      backgroundColor: 'rgba(63, 185, 80, 0.22)',
      outline: `1px solid ${C.accentDim}`,
    },
    '&.cm-focused .cm-nonmatchingBracket': { backgroundColor: C.redBg },
  },
  { dark: true },
)

/** CodeMirror가 복사/잘라내기 때 클립보드에 넣는 텍스트 — 선택이 없으면 줄 단위 복사 (view copiedRange와 동일) */
function copiedText(state: EditorState): string {
  const parts = state.selection.ranges.filter(r => !r.empty).map(r => state.sliceDoc(r.from, r.to))
  if (parts.length) return parts.join(state.lineBreak)
  const lines: string[] = []
  let upto = -1
  for (const { from } of state.selection.ranges) {
    const line = state.doc.lineAt(from)
    if (line.number > upto) lines.push(line.text)
    upto = line.number
  }
  return lines.join(state.lineBreak)
}

function insertedChars(tr: Transaction): number {
  let n = 0
  tr.changes.iterChanges((_fa, _ta, _fb, _tb, ins) => {
    n += ins.length
  })
  return n
}

function cursorInfo(state: EditorState): CursorInfo {
  const main = state.selection.main
  const line = state.doc.lineAt(main.head)
  return {
    line: line.number,
    col: main.head - line.from + 1,
    selected: state.selection.ranges.reduce((s, r) => s + (r.to - r.from), 0),
    lines: state.doc.lines,
  }
}

/**
 * 코드 에디터 — CodeMirror 6.
 *
 * 부정행위 방지(A3) 연결:
 * - **이 에디터에서 복사한 코드는 다시 붙여넣을 수 있다** — 외부 클립보드에서 온 붙여넣기와
 *   드롭만 차단하고 onPasteBlocked로 알린다
 * - 키 입력/내용 변경을 monitor로 흘려보낸다. 자동 들여쓰기·괄호 닫기·줄 이동·주석 토글·undo처럼
 *   키 1번이 여러 글자를 만드는 에디터 명령은 editorCommand로 미리 알려 '대량 삽입' 오탐을 막는다
 * - 언어별 EditorState를 따로 보관해 언어를 오가도 각 언어의 undo 기록이 유지된다
 */
export function CodeEditor({
  code,
  onChange,
  lang,
  onPasteBlocked,
  onCursor,
  monitor,
}: {
  code: string
  onChange: (code: string) => void
  lang: LanguageCode
  onPasteBlocked?: () => void
  onCursor?: (info: CursorInfo) => void
  monitor?: EditorMonitor
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const langRef = useRef(lang)
  const statesRef = useRef(new Map<LanguageCode, EditorState>())
  const languageConf = useRef(new Compartment())

  // 콜백은 ref로 들고 있어야 에디터를 한 번만 만들 수 있다
  const cb = useRef({ onChange, onPasteBlocked, onCursor, monitor })
  cb.current = { onChange, onPasteBlocked, onCursor, monitor }

  // 이 에디터에서 복사/잘라낸 텍스트 — 붙여넣기 허용 판정의 기준.
  // 페이지 인스턴스 메모리에만 있으므로 다른 탭·다른 문제에서 복사한 코드는 허용되지 않는다.
  const copiedHere = useRef<string[]>([])
  const lastKey = useRef({ at: 0, command: false })

  const makeState = (doc: string, l: LanguageCode): EditorState => {
    const rememberCopy = (text: string) => {
      const v = normalizeEol(text)
      if (!v || copiedHere.current.includes(v)) return
      copiedHere.current.push(v)
      if (copiedHere.current.length > CLIPBOARD_HISTORY) copiedHere.current.shift()
    }

    const guard = EditorView.domEventHandlers({
      keydown(e) {
        const ctrlOrMeta = e.ctrlKey || e.metaKey
        cb.current.monitor?.keyStroke({
          key: e.key,
          ctrlOrMeta,
          composing: e.isComposing,
          repeat: e.repeat,
        })
        lastKey.current = {
          at: Date.now(),
          command: ctrlOrMeta || e.altKey || COMMAND_KEYS.has(e.key),
        }
        return false
      },
      paste(e) {
        const text = e.clipboardData?.getData('text/plain') ?? ''
        if (copiedHere.current.includes(normalizeEol(text))) {
          // 줄 단위 복사분은 CodeMirror가 개행을 붙여 줄 앞에 넣으므로 1자 여유를 준다
          cb.current.monitor?.internalPaste(text + '\n')
          return false
        }
        // 테스트 모드(staging)에서는 차단만 풀고 신호는 그대로 남긴다 — config/testMode.ts 참고
        cb.current.monitor?.pasteBlocked(text)
        if (ALLOW_EXTERNAL_PASTE) return false
        e.preventDefault()
        cb.current.onPasteBlocked?.()
        return true
      },
      // 붙여넣기를 막아도 드래그&드롭으로는 들어올 수 있어 같이 막는다 (에디터 내부 드래그 이동 포함)
      drop(e) {
        cb.current.monitor?.dropBlocked(e.dataTransfer?.getData('text/plain') ?? '')
        if (ALLOW_EXTERNAL_PASTE) return false
        e.preventDefault()
        cb.current.onPasteBlocked?.()
        return true
      },
      copy(_e, view) {
        const text = copiedText(view.state)
        rememberCopy(text)
        cb.current.monitor?.copiedOut(text, false)
        return false
      },
      cut(_e, view) {
        const text = copiedText(view.state)
        rememberCopy(text)
        cb.current.monitor?.copiedOut(text, true)
        return false
      },
    })

    const listener = EditorView.updateListener.of(update => {
      if (update.docChanged || update.selectionSet) cb.current.onCursor?.(cursorInfo(update.state))
      if (!update.docChanged) return
      let userChanged = false
      for (const tr of update.transactions) {
        if (!tr.docChanged || tr.annotation(External)) continue
        userChanged = true
        const mon = cb.current.monitor
        if (!mon) continue
        const recent = Date.now() - lastKey.current.at <= KEY_GRACE_MS
        const chars = insertedChars(tr)
        if (tr.isUserEvent('input.paste') || tr.isUserEvent('input.drop')) {
          // 붙여넣기 판정은 paste 핸들러가 이미 했다
        } else if (recent && (tr.isUserEvent('undo') || tr.isUserEvent('redo'))) {
          mon.editorCommand(chars, false)
        } else if (recent && (lastKey.current.command || chars <= 2)) {
          // Enter 자동 들여쓰기, Tab, 줄 이동·복제, 주석 토글, 괄호 자동 닫기 '()'
          mon.editorCommand(chars, true)
        }
        mon.codeChanged(tr.newDoc.toString())
      }
      if (userChanged) cb.current.onChange(update.state.doc.toString())
    })

    return EditorState.create({
      doc,
      extensions: [
        Prec.highest(guard),
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        indentUnit.of('    '),
        EditorState.tabSize.of(4),
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        syntaxHighlighting(highlightStyle),
        editorTheme,
        languageConf.current.of(LANGUAGE_EXT[l]()),
        EditorView.contentAttributes.of({ spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' }),
        listener,
      ],
    })
  }

  // 마운트 시 1회 생성
  useEffect(() => {
    const view = new EditorView({ state: makeState(code, lang), parent: hostRef.current! })
    viewRef.current = view
    cb.current.onCursor?.(cursorInfo(view.state))
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 언어 전환 — 언어별 상태(undo 기록 포함)를 보관했다가 되돌아오면 복원
  useEffect(() => {
    const view = viewRef.current
    if (!view || langRef.current === lang) return
    statesRef.current.set(langRef.current, view.state)
    langRef.current = lang
    const saved = statesRef.current.get(lang)
    view.setState(saved && saved.doc.toString() === code ? saved : makeState(code, lang))
    cb.current.onCursor?.(cursorInfo(view.state))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  // 외부에서 코드를 바꾼 경우(초기화·복원) 동기화 — undo 기록에 남겨 Ctrl+Z로 되돌릴 수 있다
  useEffect(() => {
    const view = viewRef.current
    if (!view || langRef.current !== lang) return
    const current = view.state.doc.toString()
    if (current === code) return
    view.dispatch({
      changes: { from: 0, to: current.length, insert: code },
      selection: EditorSelection.cursor(Math.min(view.state.selection.main.head, code.length)),
      annotations: External.of(true),
    })
  }, [code, lang])

  return (
    <div
      ref={hostRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        background: C.bg,
        border: `1px solid ${C.border}`,
      }}
    />
  )
}

import { useRef } from 'react'
import type { ClipboardEvent, DragEvent, KeyboardEvent } from 'react'
import { C, monoStack } from '../theme'
import { highlight } from '../utils/highlight'
import type { EditorMonitor } from '../antiCheat'
import type { LanguageCode } from '../types/domain'

/** 이 에디터에서 복사한 텍스트를 기억해 둘 개수 (클립보드 매니저로 이전 항목을 붙여넣는 경우 대비) */
const CLIPBOARD_HISTORY = 20

/** 클립보드를 거치면 개행이 CRLF로 바뀌는 환경(Windows)이 있어 비교 전에 맞춰준다 */
const normalizeEol = (s: string) => s.replace(/\r\n/g, '\n')

/**
 * 경량 코드 에디터 — 투명 textarea 위에 하이라이트된 pre를 겹친 구조.
 *
 * 부정행위 방지(A3):
 * - **이 에디터에서 복사한 코드는 다시 붙여넣을 수 있다** — 본인이 쓴 코드의 재사용은 정상
 *   행위다. 외부 클립보드에서 온 붙여넣기와 드롭만 차단하고 onPasteBlocked로 알린다
 * - 차단을 우회한 입력까지 잡으려고 키 입력/내용 변경을 monitor로 흘려보낸다
 *   (차단은 뚫릴 수 있지만, '키 없이 늘어난 글자'는 남는다 — antiCheat/detector.ts 참고)
 */
export function CodeEditor({
  code,
  onChange,
  lang,
  onPasteBlocked,
  monitor,
}: {
  code: string
  onChange: (code: string) => void
  lang: LanguageCode
  onPasteBlocked?: () => void
  monitor?: EditorMonitor
}) {
  const lines = Math.max(code.split('\n').length, 18)
  const highlighted = highlight(code, lang)

  // 이 에디터에서 복사/잘라낸 텍스트 — 붙여넣기 허용 판정의 기준.
  // 페이지 인스턴스 메모리에만 있으므로 다른 탭·다른 문제에서 복사한 코드는 허용되지 않는다.
  const copiedHere = useRef<string[]>([])

  const rememberCopy = (text: string) => {
    const v = normalizeEol(text)
    if (!v || copiedHere.current.includes(v)) return
    copiedHere.current.push(v)
    if (copiedHere.current.length > CLIPBOARD_HISTORY) copiedHere.current.shift()
  }

  const emitChange = (next: string) => {
    monitor?.codeChanged(next)
    onChange(next)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    monitor?.keyStroke({
      key: e.key,
      ctrlOrMeta: e.ctrlKey || e.metaKey,
      composing: e.nativeEvent.isComposing,
      repeat: e.repeat,
    })
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const newCode = code.slice(0, start) + '    ' + code.slice(end)
      emitChange(newCode)
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4
      })
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text')
    // 이 에디터에서 복사한 코드면 통과 — preventDefault를 안 해야 브라우저가 그대로 삽입한다.
    // monitor에 먼저 알려 뒤따르는 onChange가 '대량 삽입'으로 잡히지 않게 한다.
    if (copiedHere.current.includes(normalizeEol(text))) {
      monitor?.internalPaste(text)
      return
    }
    e.preventDefault()
    monitor?.pasteBlocked(text)
    onPasteBlocked?.()
  }

  // 붙여넣기를 막아도 드래그&드롭으로는 들어올 수 있어 같이 막는다
  const handleDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    monitor?.dropBlocked(e.dataTransfer.getData('text'))
    onPasteBlocked?.()
  }

  const handleCopy = (e: ClipboardEvent<HTMLTextAreaElement>, cut: boolean) => {
    // textarea 내부 선택은 window.getSelection()에 잡히지 않는다 — selectionStart/End로 읽어야 정확
    const el = e.currentTarget
    const selected = el.value.slice(el.selectionStart, el.selectionEnd)
    if (!selected) return
    rememberCopy(selected)
    monitor?.copiedOut(selected, cut)
  }

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        background: '#fafafa',
        fontFamily: monoStack,
        fontSize: 13,
        lineHeight: '20px',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      <div
        style={{
          userSelect: 'none',
          padding: '12px 10px',
          background: '#f0f0f0',
          color: '#999',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          borderRight: `1px solid ${C.borderLight}`,
          minWidth: 44,
          whiteSpace: 'pre',
          fontFamily: monoStack,
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: lines }, (_, i) => i + 1).join('\n')}
      </div>
      <div style={{ position: 'relative', flex: 1, overflow: 'auto' }}>
        <pre
          style={{
            margin: 0,
            padding: 12,
            fontFamily: monoStack,
            fontSize: 13,
            lineHeight: '20px',
            whiteSpace: 'pre',
            color: '#000',
            minHeight: '100%',
            minWidth: '100%',
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
          dangerouslySetInnerHTML={{ __html: highlighted + ' ' }}
        />
        <textarea
          value={code}
          onChange={e => emitChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onCopy={e => handleCopy(e, false)}
          onCut={e => handleCopy(e, true)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            padding: 12,
            margin: 0,
            fontFamily: monoStack,
            fontSize: 13,
            lineHeight: '20px',
            border: 'none',
            outline: 'none',
            resize: 'none',
            background: 'transparent',
            color: 'transparent',
            caretColor: '#000',
            whiteSpace: 'pre',
            boxSizing: 'border-box',
            overflow: 'hidden',
            tabSize: 4,
          }}
        />
      </div>
    </div>
  )
}

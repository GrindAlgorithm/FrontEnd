import type { ClipboardEvent, KeyboardEvent } from 'react'
import { C, monoStack } from '../theme'
import { highlight } from '../utils/highlight'
import type { LanguageCode } from '../types/domain'

/**
 * 경량 코드 에디터 — 투명 textarea 위에 하이라이트된 pre를 겹친 구조.
 * 붙여넣기는 부정행위 방지 정책(A3 복붙 금지)에 따라 차단하고 onPasteBlocked로 알린다.
 */
export function CodeEditor({
  code,
  onChange,
  lang,
  onPasteBlocked,
}: {
  code: string
  onChange: (code: string) => void
  lang: LanguageCode
  onPasteBlocked?: () => void
}) {
  const lines = Math.max(code.split('\n').length, 18)
  const highlighted = highlight(code, lang)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const newCode = code.slice(0, start) + '    ' + code.slice(end)
      onChange(newCode)
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4
      })
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    onPasteBlocked?.()
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
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
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

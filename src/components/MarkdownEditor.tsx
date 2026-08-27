import { useState, type CSSProperties } from 'react'
import { C, fontStack } from '../theme'
import { Markdown } from './Markdown'

/**
 * 공용 마크다운 에디터 (요건 3·4 — 공지 작성/토론 작성이 함께 사용).
 * 작성/미리보기 탭 + textarea. 렌더링 문법은 Markdown.tsx 의 서브셋과 1:1.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = '내용을 입력하세요',
  minHeight = 220,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  minHeight?: number
}) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')

  return (
    <div style={{ border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
        <button type="button" onClick={() => setTab('write')} style={tabStyle(tab === 'write')}>
          작성
        </button>
        <button type="button" onClick={() => setTab('preview')} style={tabStyle(tab === 'preview')}>
          미리보기
        </button>
        <span style={{ marginLeft: 'auto', padding: '0 12px', fontSize: 12, color: C.muted }}>
          마크다운: # 제목 · **굵게** · `코드` · ``` 블록 · - 목록 · &gt; 인용 · [링크](url)
        </span>
      </div>

      {tab === 'write' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            display: 'block',
            width: '100%',
            minHeight,
            padding: 12,
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            fontFamily: fontStack,
            fontSize: 14,
            lineHeight: 1.7,
            background: C.bg,
            color: C.text,
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div style={{ minHeight, padding: 12, boxSizing: 'border-box' }}>
          {value.trim() === '' ? (
            <span style={{ fontSize: 14, color: C.muted }}>미리볼 내용이 없습니다</span>
          ) : (
            <Markdown source={value} />
          )}
        </div>
      )}
    </div>
  )
}

function tabStyle(active: boolean): CSSProperties {
  return {
    padding: '8px 16px',
    border: 'none',
    borderBottom: active ? `2px solid ${C.accent}` : '2px solid transparent',
    background: 'transparent',
    fontFamily: fontStack,
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    color: active ? C.text : C.muted,
    cursor: 'pointer',
  }
}

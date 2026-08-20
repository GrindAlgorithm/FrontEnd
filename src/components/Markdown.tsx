import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { C, monoStack } from '../theme'

/**
 * 의존성 없는 마크다운 서브셋 렌더러 (요건 3·4 — 공지 본문/토론 글).
 * highlight.ts 와 같은 방침으로 자체 구현 — HTML 문자열을 만들지 않고
 * React 엘리먼트를 직접 생성하므로 XSS 여지가 없다.
 *
 * 지원 문법 (에디터의 안내 문구와 맞출 것):
 *   # ## ### 제목 · **굵게** · *기울임* · `인라인 코드` · ``` 코드 블록 ```
 *   - 목록 · 1. 번호 목록 · > 인용 · [텍스트](http/https 링크) · 빈 줄 = 문단
 */
export function Markdown({ source }: { source: string }) {
  return <div style={{ fontSize: 14, lineHeight: 1.7, color: C.text }}>{renderBlocks(source)}</div>
}

function renderBlocks(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const out: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    // ``` 코드 블록 — 닫는 펜스가 없으면 끝까지
    if (line.trimStart().startsWith('```')) {
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        code.push(lines[i])
        i++
      }
      i++ // 닫는 ```
      out.push(
        <pre key={key++} style={codeBlockStyle}>
          <code>{code.join('\n')}</code>
        </pre>,
      )
      continue
    }

    // 제목
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      const style: CSSProperties = {
        fontSize: level === 1 ? 22 : level === 2 ? 18 : 16,
        fontWeight: 700,
        margin: '16px 0 8px',
      }
      out.push(
        <div key={key++} role="heading" aria-level={level} style={style}>
          {renderInline(heading[2])}
        </div>,
      )
      i++
      continue
    }

    // 목록 (- / 1.) — 연속 줄을 하나의 리스트로
    const bullet = /^\s*[-*]\s+/.test(line)
    const ordered = /^\s*\d+\.\s+/.test(line)
    if (bullet || ordered) {
      const pattern = bullet ? /^\s*[-*]\s+/ : /^\s*\d+\.\s+/
      const items: string[] = []
      while (i < lines.length && pattern.test(lines[i])) {
        items.push(lines[i].replace(pattern, ''))
        i++
      }
      const listStyle: CSSProperties = { margin: '8px 0', paddingLeft: 24 }
      const children = items.map((item, idx) => <li key={idx}>{renderInline(item)}</li>)
      out.push(
        bullet
          ? <ul key={key++} style={listStyle}>{children}</ul>
          : <ol key={key++} style={listStyle}>{children}</ol>,
      )
      continue
    }

    // 인용
    if (line.trimStart().startsWith('>')) {
      const quoted: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('>')) {
        quoted.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      out.push(
        <blockquote key={key++} style={quoteStyle}>
          {quoted.map((q, idx) => (
            <Fragment key={idx}>
              {idx > 0 && <br />}
              {renderInline(q)}
            </Fragment>
          ))}
        </blockquote>,
      )
      continue
    }

    // 문단 — 빈 줄 전까지 묶고, 줄바꿈은 <br> 유지
    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trimStart().startsWith('```') &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trimStart().startsWith('>')
    ) {
      para.push(lines[i])
      i++
    }
    out.push(
      <p key={key++} style={{ margin: '8px 0' }}>
        {para.map((p, idx) => (
          <Fragment key={idx}>
            {idx > 0 && <br />}
            {renderInline(p)}
          </Fragment>
        ))}
      </p>,
    )
  }
  return out
}

/** 인라인: `코드` → **굵게** → *기울임* → [링크](url) 순서로 분해 */
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  // 코드 스팬을 먼저 떼어내 내부가 굵게/링크로 재해석되지 않게 한다
  const parts = text.split(/(`[^`]+`)/)
  parts.forEach((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      out.push(
        <code key={idx} style={codeSpanStyle}>
          {part.slice(1, -1)}
        </code>,
      )
    } else {
      out.push(<Fragment key={idx}>{renderEmphasis(part)}</Fragment>)
    }
  })
  return out
}

function renderEmphasis(text: string): ReactNode[] {
  const out: ReactNode[] = []
  // **굵게** | *기울임* | [텍스트](url)
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('**')) {
      out.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      out.push(<em key={key++}>{token.slice(1, -1)}</em>)
    } else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token)
      const href = link?.[2] ?? ''
      // http/https 만 허용 — javascript: 등 위험 스킴 차단
      if (link && /^https?:\/\//i.test(href)) {
        out.push(
          <a key={key++} href={href} target="_blank" rel="noreferrer" style={{ color: C.blue }}>
            {link[1]}
          </a>,
        )
      } else {
        out.push(token)
      }
    }
    last = m.index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const codeBlockStyle: CSSProperties = {
  background: C.bg,
  border: `1px solid ${C.borderLight}`,
  borderRadius: 8,
  padding: '10px 12px',
  margin: '8px 0',
  fontFamily: monoStack,
  fontSize: 13,
  overflowX: 'auto',
  whiteSpace: 'pre',
}

const codeSpanStyle: CSSProperties = {
  background: C.bg,
  border: `1px solid ${C.borderLight}`,
  borderRadius: 4,
  padding: '1px 5px',
  fontFamily: monoStack,
  fontSize: '0.9em',
}

const quoteStyle: CSSProperties = {
  borderLeft: `3px solid ${C.border}`,
  margin: '8px 0',
  padding: '4px 12px',
  color: C.muted,
}

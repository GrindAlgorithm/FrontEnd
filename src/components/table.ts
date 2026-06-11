import type { CSSProperties } from 'react'
import { C } from '../theme'

// 와이어프레임 공통 표 스타일 — 진한 상단 보더 + 옅은 행 구분선

export const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
}

export const theadRowStyle: CSSProperties = {
  borderTop: `2px solid ${C.text}`,
  borderBottom: `1px solid ${C.border}`,
}

export const bodyRowStyle: CSSProperties = {
  borderBottom: `1px solid ${C.borderLight}`,
}

export function th(extra?: CSSProperties): CSSProperties {
  return { padding: '10px 8px', textAlign: 'left', fontWeight: 600, ...extra }
}

export function td(extra?: CSSProperties): CSSProperties {
  return { padding: '10px 8px', ...extra }
}

export const numCell: CSSProperties = {
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
}

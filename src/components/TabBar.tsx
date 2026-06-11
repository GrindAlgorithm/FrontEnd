import type { ReactNode } from 'react'
import { C, fontStack } from '../theme'

export interface TabItem {
  id: string
  label: string
  /** 라벨 옆 추가 표기 (배지·카운트) */
  extra?: ReactNode
}

/** 밑줄 강조형 탭 바 — 문제/랭킹/상세 화면 공통 */
export function TabBar({
  tabs,
  active,
  onChange,
  fontSize = 13,
  marginBottom = 20,
}: {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  fontSize?: number
  marginBottom?: number
}) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom, borderBottom: `1px solid ${C.border}` }}>
      {tabs.map(t => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: fontSize >= 14 ? '8px 16px' : '8px 14px',
              fontSize,
              cursor: 'pointer',
              color: isActive ? C.text : C.muted,
              fontWeight: isActive ? 600 : 400,
              borderBottom: isActive ? `2px solid ${C.blue}` : '2px solid transparent',
              marginBottom: -1,
              fontFamily: fontStack,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{t.label}</span>
            {t.extra}
          </button>
        )
      })}
    </div>
  )
}

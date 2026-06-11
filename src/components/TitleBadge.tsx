import { titleColorMap } from '../theme'
import type { UserTitle } from '../types/domain'

/** 칭호 뱃지 — 닉네임 옆/프로필 헤더에 표시 */
export function TitleBadge({ title, size = 'sm' }: { title: UserTitle; size?: 'sm' | 'md' }) {
  const color = titleColorMap[title.colorKey]
  const padding = size === 'sm' ? '3px 8px' : '5px 10px'
  const fontSize = size === 'sm' ? 11 : 12
  const dot = size === 'sm' ? 7 : 8
  return (
    <span
      style={{
        border: `1px solid ${color}`,
        padding,
        fontSize,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: '#fff',
        color,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: dot,
          height: dot,
          background: color,
          transform: 'rotate(45deg)',
          display: 'inline-block',
        }}
      />
      <span>{title.name}</span>
    </span>
  )
}

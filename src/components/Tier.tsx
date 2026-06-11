import { tierMap } from '../theme'
import type { TierName, TierRank } from '../types/domain'

/** 티어 뱃지 — 마름모 + "골드 IV" 형태 */
export function Tier({ tier }: { tier: TierRank }) {
  const t = tierMap[tier.name]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color: t.color,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          background: t.color,
          transform: 'rotate(45deg)',
          display: 'inline-block',
        }}
      />
      <span>
        {t.label} {tier.level}
      </span>
    </span>
  )
}

/** 작은 티어 점 — 토론 작성자 옆 표기 등 */
export function TierDot({ name, size = 6 }: { name: TierName; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        background: tierMap[name].color,
        transform: 'rotate(45deg)',
        display: 'inline-block',
      }}
    />
  )
}

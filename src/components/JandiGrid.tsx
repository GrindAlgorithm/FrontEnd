import type { CSSProperties } from 'react'
import { JANDI_COLORS } from '../theme'

/** 잔디(활동) 그리드 — 열=주, 행=요일 */
export function JandiGrid({
  weeks,
  style,
  legend = false,
}: {
  weeks: number[][]
  style?: CSSProperties
  legend?: boolean
}) {
  if (weeks.length === 0) return null
  const width = weeks.length * 14 - 3
  return (
    <div>
      <svg
        viewBox={`0 0 ${width} 95`}
        // maxWidth: 시즌 초반처럼 주 수가 적을 때 100% 폭으로 늘어나 셀이 거대해지지 않도록 셀 크기를 최대 ~24px로 제한
        style={{ width: '100%', maxWidth: weeks.length * 24, height: 'auto', display: 'block', ...style }}
      >
        {weeks.map((week, wi) => (
          <g key={wi}>
            {week.map((level, di) => (
              <rect
                key={di}
                x={wi * 14}
                y={di * 14}
                width={11}
                height={11}
                rx={2}
                fill={JANDI_COLORS[level] ?? JANDI_COLORS[0]}
              />
            ))}
          </g>
        ))}
      </svg>
      {legend && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 4,
            marginTop: 10,
            fontSize: 11,
            color: '#6c757d',
          }}
        >
          <span style={{ marginRight: 4 }}>적음</span>
          {JANDI_COLORS.map((c, i) => (
            <span
              key={i}
              style={{ width: 11, height: 11, background: c, borderRadius: 2, display: 'inline-block' }}
            />
          ))}
          <span style={{ marginLeft: 4 }}>많음</span>
        </div>
      )}
    </div>
  )
}

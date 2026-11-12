import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { C, monoStack } from '../theme'
import type { RankHistory, RankHistoryPoint } from '../types/domain'

/**
 * 시즌 순위 추이 (§2.15 rankHistory).
 * 순위는 하루 단위 마감값이라 다음 날까지 유지된다 → 계단형 선. 1위가 위로 오도록 세로축을 뒤집는다.
 * 단일 시리즈라 범례 없이 제목이 이름을 대신하고, 마지막 점만 직접 라벨을 단다.
 */

const HEIGHT = 168
const PAD = { top: 14, right: 44, bottom: 24, left: 34 }

const DAY_MS = 86_400_000
const toDay = (iso: string) => Date.parse(`${iso}T00:00:00`)
const md = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`

/** 순위 눈금 — 1위 포함, 최대 4개 정수 */
function rankTicks(min: number, max: number): number[] {
  if (max - min <= 3) return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const step = Math.ceil((max - min) / 3)
  const ticks: number[] = []
  for (let r = min; r < max; r += step) ticks.push(r)
  ticks.push(max)
  return ticks
}

export function RankHistoryChart({ history }: { history: RankHistory }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pts = history.points
  const last = pts[pts.length - 1]
  const first = pts[0]

  // 점이 하나뿐이면(스냅샷이 아직 없음) 선을 그릴 수 없다 — 오늘 순위만 알린다
  if (pts.length < 2) {
    return (
      <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
        오늘 <b style={{ color: C.text, fontFamily: monoStack }}>{last.rank}위</b> · 순위는 매일 자정에 기록돼 내일부터 추이가 보입니다.
      </p>
    )
  }

  const minRank = 1
  const maxRank = Math.max(...pts.map(p => p.rank), 2)
  const x0 = toDay(first.date)
  const span = Math.max(DAY_MS, toDay(last.date) - x0)
  const plotW = width - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const x = (iso: string) => PAD.left + ((toDay(iso) - x0) / span) * plotW
  const y = (rank: number) => PAD.top + ((rank - minRank) / (maxRank - minRank)) * plotH

  // 계단: 다음 날짜까지 수평 → 그 날짜에서 수직
  let d = `M${x(pts[0].date)},${y(pts[0].rank)}`
  for (let i = 1; i < pts.length; i++) {
    d += ` H${x(pts[i].date)} V${y(pts[i].rank)}`
  }

  const ticks = rankTicks(minRank, maxRank)
  const xLabels = [first, pts[Math.floor((pts.length - 1) / 2)], last].filter(
    (p, i, arr) => arr.findIndex(q => q.date === p.date) === i,
  )

  const nearest = (clientX: number) => {
    const rect = wrapRef.current!.getBoundingClientRect()
    const px = clientX - rect.left
    let best = 0
    for (let i = 1; i < pts.length; i++) {
      if (Math.abs(x(pts[i].date) - px) < Math.abs(x(pts[best].date) - px)) best = i
    }
    return best
  }

  const shown: RankHistoryPoint | null = active == null ? null : pts[active]
  const change = first.rank - last.rank // +면 상승

  return (
    <div>
      <div ref={wrapRef} style={{ position: 'relative' }}>
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`${history.seasonName} 순위 추이: ${md(first.date)} ${first.rank}위에서 ${md(last.date)} ${last.rank}위`}
          tabIndex={0}
          style={{ display: 'block', touchAction: 'pan-y', outlineColor: C.accent, outlineOffset: 2 }}
          onPointerMove={e => setActive(nearest(e.clientX))}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(pts.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft') setActive(i => Math.max(0, (i ?? pts.length - 1) - 1))
            if (e.key === 'ArrowRight') setActive(i => Math.min(pts.length - 1, (i ?? 0) + 1))
          }}
        >
          {/* 순위 눈금 — 은은한 가로선 */}
          {ticks.map(t => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={C.borderLight} strokeWidth={1} />
              <text
                x={PAD.left - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                fontSize={10}
                fill={C.muted}
                fontFamily={monoStack}
              >
                {t}위
              </text>
            </g>
          ))}
          {xLabels.map((p, i) => (
            <text
              key={p.date}
              x={x(p.date)}
              y={HEIGHT - 6}
              textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'}
              fontSize={10}
              fill={C.muted}
              fontFamily={monoStack}
            >
              {i === xLabels.length - 1 ? '오늘' : md(p.date)}
            </text>
          ))}

          {/* 크로스헤어 */}
          {shown && (
            <line
              x1={x(shown.date)}
              x2={x(shown.date)}
              y1={PAD.top - 6}
              y2={HEIGHT - PAD.bottom}
              stroke={C.muted}
              strokeWidth={1}
              strokeDasharray="2 3"
            />
          )}

          <path d={d} fill="none" stroke={C.accent} strokeWidth={2} strokeLinejoin="round" />

          {/* 오늘 점 + 직접 라벨 (값은 텍스트 색) */}
          <circle cx={x(last.date)} cy={y(last.rank)} r={4.5} fill={C.accent} stroke={C.bg} strokeWidth={2} />
          <text
            x={x(last.date) + 9}
            y={y(last.rank)}
            dy="0.32em"
            fontSize={12}
            fontWeight={700}
            fill={C.text}
            fontFamily={monoStack}
          >
            {last.rank}위
          </text>

          {shown && shown !== last && (
            <circle cx={x(shown.date)} cy={y(shown.rank)} r={4.5} fill={C.accent} stroke={C.bg} strokeWidth={2} />
          )}
        </svg>

        {shown && (
          <div
            role="status"
            style={{
              position: 'absolute',
              top: 0,
              left: Math.min(Math.max(x(shown.date) - 64, 0), width - 128),
              width: 128,
              pointerEvents: 'none',
              background: C.surfaceAlt,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: '6px 8px',
              fontSize: 11,
              lineHeight: 1.5,
              color: C.muted,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <div>{shown === last ? '오늘 (실시간)' : `${md(shown.date)} 마감`}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                <span style={{ display: 'inline-block', width: 10, height: 2, background: C.accent, verticalAlign: 'middle', marginRight: 5 }} />
                순위
              </span>
              <b style={{ color: C.text, fontFamily: monoStack }}>{shown.rank}위</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>점수</span>
              <b style={{ color: C.text, fontFamily: monoStack }}>{shown.score.toLocaleString()}</b>
            </div>
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: C.muted, margin: '6px 0 0' }}>
        {md(first.date)} 이후{' '}
        {change === 0 ? '순위 변동 없음' : (
          <b style={{ color: change > 0 ? C.green : C.red, fontWeight: 600 }}>
            {change > 0 ? `▲ ${change}계단 상승` : `▼ ${-change}계단 하락`}
          </b>
        )}{' '}
        · 순위는 매일 자정 마감 기준
      </p>

      {/* 스크린리더용 표 */}
      <table style={srOnly}>
        <caption>{history.seasonName} 날짜별 순위</caption>
        <thead>
          <tr><th>날짜</th><th>순위</th><th>점수</th></tr>
        </thead>
        <tbody>
          {pts.map(p => (
            <tr key={p.date}><td>{p.date}</td><td>{p.rank}</td><td>{p.score}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
}

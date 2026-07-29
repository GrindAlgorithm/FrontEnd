import { useEffect, useRef, useState } from 'react'
import { C, fontStack, monoStack } from '../theme'
import type { IntegrityLevel, SolveEvent, SolveIntegritySummary } from '../types/domain'

/**
 * IDE 툴바의 무결성 상태 배지 + 기록 패널.
 *
 * 무엇이 기록되는지 유저에게 그대로 보여준다 — 몰래 수집하지 않는 편이
 * 억제 효과도 크고, 오탐이 났을 때 유저가 바로 알아챌 수 있다.
 */

const LEVEL_STYLE: Record<IntegrityLevel, { color: string; label: string; dot: string }> = {
  clean: { color: C.green, label: '정상', dot: '●' },
  caution: { color: C.gold, label: '주의', dot: '▲' },
  risk: { color: C.red, label: '위험', dot: '■' },
}

const SEVERITY_COLOR = {
  info: C.muted,
  warn: C.gold,
  critical: C.red,
} as const

function clockOf(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function durationText(ms: number): string {
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}초`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 ${sec % 60}초`
  return `${Math.floor(min / 60)}시간 ${min % 60}분`
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11 }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span
        style={{
          fontFamily: monoStack,
          fontWeight: 600,
          color: warn ? C.red : C.text,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  )
}

export function IntegrityIndicator({
  summary,
  events,
  onOpen,
}: {
  summary: SolveIntegritySummary
  events: SolveEvent[]
  /** 패널을 열 때 최신 요약을 받아오기 위한 콜백 */
  onOpen?: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const style = LEVEL_STYLE[summary.level]
  const flagged = events.filter(e => e.severity !== 'info').length

  // 패널 밖 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const toggle = () => {
    if (!open) onOpen?.()
    setOpen(v => !v)
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', fontFamily: fontStack }}>
      <button
        onClick={toggle}
        title="풀이 무결성 기록 보기"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: open ? '#fff' : 'transparent',
          border: `1px solid ${open ? C.border : 'transparent'}`,
          padding: '3px 8px',
          fontSize: 11,
          fontFamily: fontStack,
          cursor: 'pointer',
          color: C.muted,
        }}
      >
        <span style={{ color: style.color, fontSize: 9 }}>{style.dot}</span>
        <span style={{ fontWeight: 600, color: style.color }}>{style.label}</span>
        {flagged > 0 && (
          <span style={{ fontFamily: monoStack, color: C.muted }}>· {flagged}건</span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            width: 320,
            maxHeight: 420,
            overflow: 'auto',
            background: '#fff',
            border: `1px solid ${C.border}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            zIndex: 20,
          }}
        >
          <div
            style={{
              padding: '9px 12px',
              borderBottom: `1px solid ${C.borderLight}`,
              background: C.bg,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>풀이 무결성 기록</span>
            <span style={{ color: style.color, fontFamily: monoStack, fontSize: 11 }}>
              {summary.riskScore} / 100
            </span>
          </div>

          {/* 위험도 게이지 */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.borderLight}` }}>
            <div style={{ height: 4, background: C.borderLight, marginBottom: 10 }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, summary.riskScore)}%`,
                  background: style.color,
                  transition: 'width 200ms',
                }}
              />
            </div>
            <div style={{ display: 'grid', gap: 5 }}>
              <Metric
                label="직접 입력한 비율"
                value={`${Math.round(summary.authorshipRatio * 100)}%`}
                warn={summary.authorshipRatio < 0.6 && summary.finalCodeChars > 200}
              />
              <Metric
                label="외부 삽입 문자"
                value={`${summary.insertedChars.toLocaleString()}자`}
                warn={summary.insertedChars > 0}
              />
              {summary.internalPasteChars > 0 && (
                <Metric
                  label="내부 복사 재사용"
                  value={`${summary.internalPasteChars.toLocaleString()}자 (허용)`}
                />
              )}
              <Metric
                label="창 이탈"
                value={
                  summary.blurCount === 0
                    ? '없음'
                    : `${summary.blurCount}회 · ${durationText(summary.blurredMs)}`
                }
              />
              <Metric label="집중 시간" value={durationText(summary.activeMs)} />
            </div>
          </div>

          {/* 이벤트 타임라인 */}
          <div style={{ padding: '8px 12px' }}>
            {events.length === 0 ? (
              <div style={{ fontSize: 11, color: C.muted, padding: '10px 0', textAlign: 'center' }}>
                기록된 이상 신호가 없습니다.
              </div>
            ) : (
              events.map((e, i) => (
                <div
                  key={`${e.at}-${i}`}
                  style={{
                    display: 'flex',
                    gap: 8,
                    padding: '5px 0',
                    fontSize: 11,
                    borderBottom: i === events.length - 1 ? 'none' : `1px solid ${C.borderLight}`,
                  }}
                >
                  <span
                    style={{ fontFamily: monoStack, color: C.muted, flexShrink: 0, fontSize: 10 }}
                  >
                    {clockOf(e.at)}
                  </span>
                  <span
                    style={{
                      color: SEVERITY_COLOR[e.severity],
                      fontWeight: e.severity === 'info' ? 400 : 600,
                      lineHeight: 1.4,
                    }}
                  >
                    {e.message}
                  </span>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              padding: '8px 12px',
              borderTop: `1px solid ${C.borderLight}`,
              background: C.bg,
              fontSize: 10,
              color: C.muted,
              lineHeight: 1.6,
            }}
          >
            이 기록은 제출과 함께 저장되어 부정행위 심사에 참고됩니다. 코드 내용은 전송되지 않고
            문자 수만 기록됩니다.
          </div>
        </div>
      )}
    </div>
  )
}

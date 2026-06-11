import { C, fontStack, tierMap } from '../theme'
import type { DecayWarning } from '../types/domain'

function tierText(t: DecayWarning['fromTier']): string {
  return `${tierMap[t.name].label} ${t.level}`
}

/**
 * 티어 하락(decay) 경고 배너.
 * variant 'home': 구체적 하락 예고 + "지금 풀기" 액션
 * variant 'profile': 일반 경고 문구만
 */
export function DecayBanner({
  decay,
  variant,
  onAction,
}: {
  decay: DecayWarning
  variant: 'home' | 'profile'
  onAction?: () => void
}) {
  return (
    <div
      style={{
        border: `1px solid ${C.red}`,
        background: '#fff5f5',
        padding: '10px 14px',
        marginBottom: 24,
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={{ color: C.red, fontSize: 16, fontWeight: 700 }}>⚠</span>
      {variant === 'home' ? (
        <>
          <span style={{ flex: 1 }}>
            <strong>{decay.inactiveDays}일간 활동 없음</strong> — {decay.daysUntilDrop}일 뒤 시즌
            티어가 <strong>{tierText(decay.fromTier)} → {tierText(decay.toTier)}</strong>으로
            하락합니다
          </span>
          {onAction && (
            <button
              onClick={onAction}
              style={{
                background: C.red,
                color: '#fff',
                border: 'none',
                padding: '5px 14px',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: fontStack,
              }}
            >
              지금 풀기 →
            </button>
          )}
        </>
      ) : (
        <span>
          <strong>{decay.inactiveDays}일간 활동 없음</strong> —{' '}
          {decay.inactiveDays + decay.daysUntilDrop}일 이상 미활동 시 시즌 티어가 하락합니다
        </span>
      )}
    </div>
  )
}

import { C, fontStack } from '../theme'

export function LoadingView({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: C.muted }}>
      {label}
    </div>
  )
}

export function ErrorView({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13 }}>
      <div style={{ color: C.red, marginBottom: 12 }}>{error.message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: '#fff',
            border: `1px solid ${C.border}`,
            padding: '6px 16px',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: fontStack,
          }}
        >
          다시 시도
        </button>
      )}
    </div>
  )
}

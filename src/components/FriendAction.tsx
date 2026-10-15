import { useEffect, useState, type CSSProperties } from 'react'
import { api } from '../api'
import { C, monoStack } from '../theme'
import type { FriendRelation } from '../types/domain'

export interface FriendState {
  relation: FriendRelation
  requestId: number | null
}

const btnBase: CSSProperties = {
  background: 'transparent',
  padding: '4px 10px',
  fontSize: 12,
  fontFamily: monoStack,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

export function friendBtn(color: string, disabled = false): CSSProperties {
  return {
    ...btnBase,
    border: `1px solid ${disabled ? C.border : color}`,
    color: disabled ? C.muted : color,
    cursor: disabled ? 'default' : 'pointer',
  }
}

/**
 * 관계에 따라 바뀌는 친구 버튼 — 검색 결과·프로필 공통.
 * none → 친구 신청 / outgoing → 신청 취소 / incoming → 수락·거절 / friends → 친구 끊기(2단계 확인)
 */
export function FriendAction({
  handle,
  state,
  onChange,
}: {
  handle: string
  state: FriendState
  onChange: (next: FriendState) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  // 끊기 확인 상태는 4초 뒤 자동 해제
  useEffect(() => {
    if (!confirmRemove) return
    const t = setTimeout(() => setConfirmRemove(false), 4000)
    return () => clearTimeout(t)
  }, [confirmRemove])

  const run = async (fn: () => Promise<FriendState>) => {
    setBusy(true)
    setError(null)
    try {
      onChange(await fn())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
      setConfirmRemove(false)
    }
  }

  const send = () =>
    run(async () => {
      const req = await api.sendFriendRequest(handle)
      return { relation: 'outgoing', requestId: req.id }
    })
  const cancelOrDecline = () =>
    run(async () => {
      await api.deleteFriendRequest(state.requestId!)
      return { relation: 'none', requestId: null }
    })
  const accept = () =>
    run(async () => {
      await api.acceptFriendRequest(state.requestId!)
      return { relation: 'friends', requestId: null }
    })
  const remove = () =>
    run(async () => {
      await api.removeFriend(handle)
      return { relation: 'none', requestId: null }
    })

  let body: JSX.Element | null = null
  switch (state.relation) {
    case 'self':
      return null
    case 'none':
      body = (
        <button onClick={send} disabled={busy} style={friendBtn(C.accent, busy)}>
          + 친구 신청
        </button>
      )
      break
    case 'outgoing':
      body = (
        <>
          <span style={{ fontSize: 12, color: C.muted, fontFamily: monoStack }}>수락 대기</span>
          <button onClick={cancelOrDecline} disabled={busy} style={friendBtn(C.muted, busy)}>
            신청 취소
          </button>
        </>
      )
      break
    case 'incoming':
      body = (
        <>
          <button onClick={accept} disabled={busy} style={friendBtn(C.accent, busy)}>
            수락
          </button>
          <button onClick={cancelOrDecline} disabled={busy} style={friendBtn(C.muted, busy)}>
            거절
          </button>
        </>
      )
      break
    case 'friends':
      body = confirmRemove ? (
        <>
          <span style={{ fontSize: 12, color: C.muted }}>정말 끊을까요?</span>
          <button onClick={remove} disabled={busy} style={friendBtn(C.red, busy)}>
            끊기
          </button>
          <button onClick={() => setConfirmRemove(false)} style={friendBtn(C.muted)}>
            유지
          </button>
        </>
      ) : (
        <>
          <span style={{ fontSize: 12, color: C.green, fontFamily: monoStack }}>✓ 친구</span>
          <button onClick={() => setConfirmRemove(true)} style={friendBtn(C.muted)}>
            친구 끊기
          </button>
        </>
      )
      break
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{body}</span>
      {error && (
        <span role="alert" style={{ fontSize: 11, color: C.red, maxWidth: 260, textAlign: 'right' }}>
          {error}
        </span>
      )}
    </span>
  )
}

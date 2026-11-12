import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, fontStack, monoStack, titleColorMap } from '../theme'
import { formatRelative } from '../utils/format'
import { useNotifications, type AppNotification } from '../notifications/useNotifications'
import type { MeResponse } from '../types/domain'

/** 종류 표식 — 터미널 톤에 맞춘 한 글자 기호 + 의미 색 (색만으로 구분하지 않게 기호가 종류를 말한다) */
function marker(n: AppNotification): { glyph: string; color: string; label: string } {
  switch (n.kind) {
    case 'friend_request':
      return { glyph: '+', color: C.accent, label: '친구 신청' }
    case 'submission':
      return n.submissionStatus === 'accepted'
        ? { glyph: '✓', color: C.green, label: '채점 결과' }
        : { glyph: '✗', color: C.red, label: '채점 결과' }
    case 'title':
      return { glyph: '◆', color: n.titleColor ? titleColorMap[n.titleColor] : C.gold, label: '칭호' }
    case 'decay':
      return { glyph: '▼', color: C.amber, label: '티어 하락 예고' }
    case 'notice':
      return { glyph: '#', color: C.muted, label: '공지' }
  }
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 20.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function NotificationBell({ me }: { me: MeResponse }) {
  const { items, unreadCount, markRead } = useNotifications(me)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()

  // 바깥 클릭·Esc 로 닫기
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (n: AppNotification) => {
    markRead([n.id])
    setOpen(false)
    navigate(n.to)
  }

  const badge = unreadCount > 9 ? '9+' : String(unreadCount)

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'flex' }}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        aria-label={unreadCount > 0 ? `알림 ${unreadCount}개 안 읽음` : '알림'}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: 6,
          border: `1px solid ${open ? C.border : 'transparent'}`,
          background: open ? C.surfaceAlt : 'transparent',
          color: unreadCount > 0 ? C.text : C.muted,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 1,
              right: 0,
              minWidth: 15,
              height: 15,
              padding: '0 4px',
              borderRadius: 8,
              background: C.accent,
              color: C.bg,
              fontSize: 10,
              fontWeight: 700,
              fontFamily: monoStack,
              lineHeight: '15px',
              textAlign: 'center',
              boxShadow: `0 0 0 2px ${C.surface}`,
            }}
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="알림"
          style={{
            position: 'absolute',
            top: 38,
            right: -8,
            width: 'min(360px, calc(100vw - 32px))',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            zIndex: 50,
            overflow: 'hidden',
            fontFamily: fontStack,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
              <span style={{ color: C.accent, fontFamily: monoStack }}>{'// '}</span>알림
              {unreadCount > 0 && (
                <span style={{ color: C.muted, fontWeight: 400, fontSize: 12 }}> · 안 읽음 {unreadCount}</span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => markRead(items.filter(n => !n.read).map(n => n.id))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  fontSize: 12,
                  color: C.accent,
                  cursor: 'pointer',
                  fontFamily: fontStack,
                }}
              >
                모두 읽음
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p style={{ margin: 0, padding: '28px 14px', fontSize: 12, color: C.muted, textAlign: 'center' }}>
              새 알림이 없습니다. 친구 신청·채점 결과·칭호 획득이 여기에 모입니다.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 420, overflowY: 'auto' }}>
              {items.map(n => {
                const m = marker(n)
                return (
                  <li key={n.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                    <button
                      onClick={() => go(n)}
                      className="notif-item"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '18px 1fr auto',
                        gap: 10,
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 14px',
                        background: n.read ? 'transparent' : C.accentBg,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: fontStack,
                        color: C.text,
                      }}
                    >
                      <span
                        aria-label={m.label}
                        style={{ fontFamily: monoStack, fontWeight: 700, color: m.color, fontSize: 13, lineHeight: '18px' }}
                      >
                        {m.glyph}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: 13,
                            lineHeight: '18px',
                            fontWeight: n.read ? 400 : 600,
                            color: n.read ? C.muted : C.text,
                          }}
                        >
                          {n.text}
                        </span>
                        {n.detail && (
                          <span
                            style={{
                              display: 'block',
                              fontSize: 11,
                              color: C.muted,
                              marginTop: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {n.detail}
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap', lineHeight: '18px' }}>
                        {formatRelative(n.at)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

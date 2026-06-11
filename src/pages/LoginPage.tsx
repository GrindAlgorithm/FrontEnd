import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import { IS_MOCK } from '../api'
import { useAuth } from '../context/AuthContext'
import { C, fontStack } from '../theme'

/**
 * 로그인 — 소셜(GitHub/Google OAuth2) + 자체 이메일 로그인.
 * 실제 모드: OAuth는 Spring Security 표준 경로(/oauth2/authorization/{provider})로 리다이렉트.
 * 목 모드: 즉시 로그인 처리.
 */
export function LoginPage() {
  const { me, booting, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!booting && me) return <Navigate to={from} replace />

  const handleOAuth = async (provider: 'github' | 'google') => {
    if (IS_MOCK) {
      setPending(true)
      try {
        await login(`${provider}@mock.dev`, 'oauth')
        navigate(from, { replace: true })
      } finally {
        setPending(false)
      }
      return
    }
    // 서버가 OAuth 핸드셰이크 후 프론트로 리다이렉트 (연동 문서 §인증)
    window.location.href = `/oauth2/authorization/${provider}`
  }

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다')
    } finally {
      setPending(false)
    }
  }

  const inputStyle = {
    width: '100%',
    border: `1px solid ${C.border}`,
    padding: '9px 12px',
    fontSize: 13,
    fontFamily: fontStack,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ maxWidth: 360, margin: '48px auto 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 24, letterSpacing: -0.5 }}>
          Grind<span style={{ color: C.blue }}>Algorithm</span>
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: '8px 0 0' }}>
          시즌제 랭킹 기반 알고리즘 문제 풀이
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => handleOAuth('github')}
          disabled={pending}
          style={{
            width: '100%',
            background: '#24292f',
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 600,
            fontFamily: fontStack,
          }}
        >
          GitHub로 계속하기
        </button>
        <button
          onClick={() => handleOAuth('google')}
          disabled={pending}
          style={{
            width: '100%',
            background: '#fff',
            color: C.text,
            border: `1px solid ${C.border}`,
            padding: '10px 16px',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 600,
            fontFamily: fontStack,
          }}
        >
          Google로 계속하기
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '20px 0',
          color: C.muted,
          fontSize: 11,
        }}
      >
        <div style={{ flex: 1, height: 1, background: C.borderLight }} />
        또는
        <div style={{ flex: 1, height: 1, background: C.borderLight }} />
      </div>

      <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          style={inputStyle}
        />
        {error && <div style={{ fontSize: 12, color: C.red }}>{error}</div>}
        <button
          type="submit"
          disabled={pending}
          style={{
            width: '100%',
            background: C.blue,
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            fontSize: 13,
            cursor: pending ? 'wait' : 'pointer',
            fontWeight: 600,
            fontFamily: fontStack,
            marginTop: 4,
          }}
        >
          {pending ? '로그인 중…' : '이메일로 로그인'}
        </button>
      </form>

      <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
        처음이라면 소셜 로그인으로 가입이 자동 진행됩니다.
        <br />
        이메일 가입(인증 포함)은 준비 중입니다.
      </p>
    </div>
  )
}

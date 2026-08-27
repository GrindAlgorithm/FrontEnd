import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import { IS_MOCK } from '../api'
import { useAuth } from '../context/AuthContext'
import { C, fontStack } from '../theme'

/**
 * 로그인/회원가입 — 자체 이메일 인증(세션 쿠키) + 소셜(OAuth2, 백엔드 준비 시).
 * mode 로 로그인/회원가입 폼을 토글한다. 회원가입은 즉시 가입(POST /auth/signup).
 */
export function LoginPage() {
  const { me, booting, login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/home'

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [handle, setHandle] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!booting && me) return <Navigate to={from} replace />

  const isSignup = mode === 'signup'

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      if (isSignup) {
        await signup(email, password, handle)
      } else {
        await login(email, password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isSignup
            ? '회원가입에 실패했습니다'
            : '로그인에 실패했습니다',
      )
    } finally {
      setPending(false)
    }
  }

  const switchMode = (next: 'login' | 'signup') => {
    setMode(next)
    setError(null)
  }

  const inputStyle = {
    width: '100%',
    background: C.bg,
    border: `1px solid ${C.border}`,
    color: C.text,
    padding: '9px 12px',
    fontSize: 13,
    fontFamily: fontStack,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <div
      style={{
        maxWidth: 360,
        margin: '48px auto 0',
        background: C.surface,
        border: `1px solid ${C.border}`,
        padding: '32px 28px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 24, letterSpacing: -0.5 }}>
          Grind<span style={{ color: C.accent }}>Algorithm</span>
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
            background: 'transparent',
            color: C.text,
            border: `1px solid ${C.border}`,
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
            background: 'transparent',
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
        {isSignup ? '이메일로 회원가입' : '또는'}
        <div style={{ flex: 1, height: 1, background: C.borderLight }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          style={inputStyle}
        />
        {isSignup && (
          <input
            type="text"
            placeholder="닉네임 (영문/숫자/밑줄, 2~20자)"
            value={handle}
            onChange={e => setHandle(e.target.value)}
            autoComplete="username"
            style={inputStyle}
          />
        )}
        <input
          type="password"
          placeholder={isSignup ? '비밀번호 (8자 이상)' : '비밀번호'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          style={inputStyle}
        />
        {error && <div style={{ fontSize: 12, color: C.red }}>{error}</div>}
        <button
          type="submit"
          disabled={pending}
          style={{
            width: '100%',
            background: 'transparent',
            color: C.accent,
            border: `1px solid ${C.accent}`,
            padding: '10px 16px',
            fontSize: 13,
            cursor: pending ? 'wait' : 'pointer',
            fontWeight: 600,
            fontFamily: fontStack,
            marginTop: 4,
          }}
        >
          {pending
            ? isSignup
              ? '가입 중…'
              : '로그인 중…'
            : isSignup
              ? '회원가입'
              : '이메일로 로그인'}
        </button>
      </form>

      <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 20 }}>
        {isSignup ? (
          <>
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: C.accent,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: fontStack,
                fontSize: 12,
              }}
            >
              로그인
            </button>
          </>
        ) : (
          <>
            처음이신가요?{' '}
            <button
              type="button"
              onClick={() => switchMode('signup')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: C.accent,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: fontStack,
                fontSize: 12,
              }}
            >
              회원가입
            </button>
          </>
        )}
      </p>
    </div>
  )
}

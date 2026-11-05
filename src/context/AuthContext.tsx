import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { api, ApiError, UNAUTHORIZED_EVENT } from '../api'
import type { MeResponse } from '../types/domain'

interface AuthState {
  me: MeResponse | null
  /** 최초 세션 확인이 끝나기 전 true — 이 동안엔 로그인 페이지로 보내지 않는다 */
  booting: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, handle: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null)
  const [booting, setBooting] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // 이벤트 핸들러에서 최신 값을 읽기 위한 ref (핸들러 재구독 없이)
  const meRef = useRef(me)
  meRef.current = me
  const locationRef = useRef(location)
  locationRef.current = location

  const refresh = useCallback(async () => {
    try {
      setMe(await api.getMe())
    } catch (err) {
      // 401 = 계약(§1.4), 403 = 백엔드 Spring Security 기본 설정(미인증 시 Http403ForbiddenEntryPoint)
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setMe(null)
      } else {
        throw err
      }
    }
  }, [])

  useEffect(() => {
    refresh()
      .catch(() => setMe(null))
      .finally(() => setBooting(false))
  }, [refresh])

  // 세션 만료: 로그인 상태였는데 API 가 401 → 로그아웃 처리 후 로그인 페이지로 (원래 경로 보존)
  useEffect(() => {
    const onUnauthorized = () => {
      if (!meRef.current) return // 원래 비로그인 — 공개 페이지의 401 은 각 화면이 처리
      meRef.current = null
      setMe(null)
      const { pathname, search } = locationRef.current
      if (pathname === '/login') return
      navigate('/login', { replace: true, state: { from: pathname + search, expired: true } })
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [navigate])

  // 탭에 돌아왔을 때 세션 재확인 — API 호출이 없는 화면에서도 만료를 감지한다
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && meRef.current) {
        refresh().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    setMe(await api.login({ email, password }))
  }, [])

  const signup = useCallback(async (email: string, password: string, handle: string) => {
    setMe(await api.signup({ email, password, handle }))
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setMe(null)
  }, [])

  const value = useMemo(
    () => ({ me, booting, login, signup, logout, refresh }),
    [me, booting, login, signup, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용 가능')
  return ctx
}

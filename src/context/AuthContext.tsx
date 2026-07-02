import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, ApiError } from '../api'
import type { MeResponse } from '../types/domain'

interface AuthState {
  me: MeResponse | null
  /** 최초 세션 확인이 끝나기 전 true — 이 동안엔 로그인 페이지로 보내지 않는다 */
  booting: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null)
  const [booting, setBooting] = useState(true)

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

  const login = useCallback(async (email: string, password: string) => {
    setMe(await api.login({ email, password }))
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    setMe(null)
  }, [])

  const value = useMemo(
    () => ({ me, booting, login, logout, refresh }),
    [me, booting, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용 가능')
  return ctx
}

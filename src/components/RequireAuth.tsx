import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingView } from './Feedback'

/** 로그인 필수 구간 가드 — 미인증이면 /login으로 (원래 경로는 state.from에 보존) */
export function RequireAuth() {
  const { me, booting } = useAuth()
  const location = useLocation()

  if (booting) return <LoadingView label="세션 확인 중…" />
  if (!me) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

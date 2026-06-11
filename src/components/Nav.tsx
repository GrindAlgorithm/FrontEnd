import { Link, useLocation, useNavigate } from 'react-router-dom'
import { C, fontStack } from '../theme'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS: { to: string; label: string; isActive: (path: string) => boolean }[] = [
  { to: '/', label: '홈', isActive: p => p === '/' },
  { to: '/problems', label: '문제', isActive: p => p.startsWith('/problems') },
  {
    to: '/ranking',
    label: '랭킹',
    // 와이어프레임 기준: 시즌·프로필 화면은 랭킹 섹션에 속한다
    isActive: p => p.startsWith('/ranking') || p.startsWith('/season') || p.startsWith('/users'),
  },
]

export function Nav() {
  const { pathname } = useLocation()
  const { me, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header style={{ borderBottom: `1px solid ${C.borderLight}`, background: '#fff' }}>
      <div
        className="container"
        style={{ height: 52, gap: 24, display: 'flex', alignItems: 'center' }}
      >
        <Link to="/" style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.5 }}>
          Grind<span style={{ color: C.blue }}>Algorithm</span>
        </Link>
        <nav style={{ display: 'flex', gap: 20, flex: 1 }}>
          {NAV_LINKS.map(l => {
            const active = l.isActive(pathname)
            return (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  fontSize: 14,
                  color: active ? C.text : C.muted,
                  fontWeight: active ? 600 : 400,
                  padding: '4px 2px',
                  borderBottom: active ? `2px solid ${C.blue}` : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, alignItems: 'center' }}>
          {me ? (
            <>
              <Link to={`/users/${me.handle}`} style={{ color: C.blue, fontWeight: 600 }}>
                {me.handle}
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  fontSize: 13,
                  color: C.muted,
                  cursor: 'pointer',
                  fontFamily: fontStack,
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: C.muted }}>
                로그인
              </Link>
              <Link to="/login" style={{ color: C.blue }}>
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

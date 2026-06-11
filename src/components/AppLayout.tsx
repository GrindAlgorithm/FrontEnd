import { Outlet } from 'react-router-dom'
import { C, fontStack } from '../theme'
import { Nav } from './Nav'

/** 공통 레이아웃 — fullWidth는 IDE처럼 컨테이너 없이 전체 폭을 쓰는 화면용 */
export function AppLayout({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <div style={{ fontFamily: fontStack, background: '#fff', color: C.text, minHeight: '100vh' }}>
      <Nav />
      {fullWidth ? (
        <Outlet />
      ) : (
        <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
          <Outlet />
        </main>
      )}
    </div>
  )
}

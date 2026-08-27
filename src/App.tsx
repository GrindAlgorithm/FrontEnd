import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { RequireAuth } from './components/RequireAuth'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { ProblemsPage } from './pages/ProblemsPage'
import { ProblemDetailPage } from './pages/ProblemDetailPage'
import { DiscussionPage } from './pages/DiscussionPage'
import { DiscussionPostPage } from './pages/DiscussionPostPage'
import { NoticePage } from './pages/NoticePage'
import { IDEPage } from './pages/IDEPage'
import { RankingPage } from './pages/RankingPage'
import { SeasonPage } from './pages/SeasonPage'
import { ProfilePage } from './pages/ProfilePage'
import { LoginPage } from './pages/LoginPage'
import { AdminPage } from './pages/AdminPage'

export default function App() {
  return (
    <Routes>
      {/* 일반 화면: 컨테이너 레이아웃 */}
      <Route element={<AppLayout />}>
        <Route path="/login" element={<LoginPage />} />

        {/* 공개 — 비로그인 열람 허용(백준식). 개인화 영역은 각 페이지가 me=null 방어 */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problems/:problemId" element={<ProblemDetailPage />} />
        <Route path="/problems/:problemId/discussion" element={<DiscussionPage />} />
        <Route path="/problems/:problemId/discussion/:postId" element={<DiscussionPostPage />} />
        <Route path="/notices/:noticeId" element={<NoticePage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/season" element={<SeasonPage />} />
        <Route path="/users/:handle" element={<ProfilePage />} />

        {/* 로그인 필요 — 관리자(페이지 내부 role 가드 + 백엔드 403) */}
        <Route element={<RequireAuth />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      {/* 전체 폭 레이아웃: 랜딩(공개) + IDE(로그인 필요) */}
      <Route element={<AppLayout fullWidth />}>
        {/* 랜딩 (요건 26) — 비로그인 공개. 로그인 상태면 페이지 내부에서 /home으로 리다이렉트 */}
        <Route path="/" element={<LandingPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/problems/:problemId/solve" element={<IDEPage />} />
        </Route>
      </Route>

      {/* 알 수 없는 경로 → 랜딩 (로그인 상태면 랜딩이 /home으로 넘긴다) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

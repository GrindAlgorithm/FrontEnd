import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { RequireAuth } from './components/RequireAuth'
import { HomePage } from './pages/HomePage'
import { ProblemsPage } from './pages/ProblemsPage'
import { ProblemDetailPage } from './pages/ProblemDetailPage'
import { DiscussionPage } from './pages/DiscussionPage'
import { IDEPage } from './pages/IDEPage'
import { RankingPage } from './pages/RankingPage'
import { SeasonPage } from './pages/SeasonPage'
import { ProfilePage } from './pages/ProfilePage'
import { LoginPage } from './pages/LoginPage'

export default function App() {
  return (
    <Routes>
      {/* 일반 화면: 컨테이너 레이아웃 */}
      <Route element={<AppLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/problems/:problemId" element={<ProblemDetailPage />} />
          <Route path="/problems/:problemId/discussion" element={<DiscussionPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/season" element={<SeasonPage />} />
          <Route path="/users/:handle" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* IDE: 전체 폭 레이아웃 */}
      <Route element={<AppLayout fullWidth />}>
        <Route element={<RequireAuth />}>
          <Route path="/problems/:problemId/solve" element={<IDEPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

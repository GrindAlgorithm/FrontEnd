import { http } from './http'
import type { ApiClient } from './client'

/**
 * 실제 백엔드(Spring Boot) 호출 구현.
 * 경로/메서드/파라미터는 docs/BACKEND_INTEGRATION.md 와 1:1 — 여기 바꾸면 문서도 갱신.
 */
export const realApi: ApiClient = {
  getMe: () => http.get('/me'),
  login: req => http.post('/auth/login', req),
  logout: () => http.post('/auth/logout'),

  getDashboard: () => http.get('/dashboard'),

  getSeasons: () => http.get('/seasons'),
  getSeasonProblems: seasonId => http.get(`/seasons/${seasonId}/problems`),
  getCurrentSeasonDetail: () => http.get('/seasons/current'),
  getProblem: problemId => http.get(`/problems/${encodeURIComponent(problemId)}`),

  openProblem: problemId => http.post(`/problems/${encodeURIComponent(problemId)}/open`),
  runCode: req => http.post('/runs', req),
  submit: req => http.post('/submissions', req),
  getSubmission: submissionId => http.get(`/submissions/${submissionId}`),
  listSubmissions: params => {
    const q = new URLSearchParams()
    if (params?.problemId) q.set('problemId', params.problemId)
    if (params?.mine) q.set('mine', 'true')
    const qs = q.toString()
    return http.get(`/submissions${qs ? `?${qs}` : ''}`)
  },

  getRanking: scope => http.get(`/rankings?scope=${scope}`),

  getUserProfile: handle => http.get(`/users/${encodeURIComponent(handle)}`),
  updateMyTitle: titleId => http.put('/me/title', { titleId }),

  getDiscussions: problemId =>
    http.get(`/problems/${encodeURIComponent(problemId)}/discussions`),
}

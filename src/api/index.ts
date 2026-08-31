import type { ApiClient } from './client'
import { realApi } from './real'
import { mockApi } from './mock'

// VITE_USE_MOCK: 'false'=전부 실서버 / 'hybrid'=백엔드 구현분만 실서버 / 그 외(미설정 포함)=목
const mode = import.meta.env.VITE_USE_MOCK

/** 목 모드 여부 — OAuth 리다이렉트처럼 fetch 밖의 분기에 사용. hybrid는 인증이 실서버라 false */
export const IS_MOCK = mode !== 'false' && mode !== 'hybrid'

/**
 * 하이브리드: 백엔드에 이미 구현된 엔드포인트만 실서버, 나머지는 목.
 * 백엔드가 엔드포인트를 추가할 때마다 여기에 한 줄씩 옮긴다.
 */
const hybridApi: ApiClient = {
  ...mockApi,
  // 인증 — DB 기반 로그인/회원가입/세션 (백엔드 구현 완료)
  getMe: realApi.getMe,
  login: realApi.login,
  signup: realApi.signup,
  logout: realApi.logout,
  getDashboard: realApi.getDashboard,
  getSeasons: realApi.getSeasons,
  getSeason: realApi.getSeason,
  getSeasonProblems: realApi.getSeasonProblems,
  // 시즌 화면 통합 응답 — 진행률/리워드/지난 시즌 (백엔드 §2.5-c 구현 완료)
  getCurrentSeasonDetail: realApi.getCurrentSeasonDetail,
  getProblem: realApi.getProblem,
  openProblem: realApi.openProblem,
  // 지원 언어 (요건 24 — language 테이블)
  getLanguages: realApi.getLanguages,
  // 코드 실행 — judge0.client=real 전환(요건 1)과 함께 실서버 연결.
  // ⚠ 호스트가 cgroup v1 미지원이면 Judge0 가 Internal Error 를 내므로 stub 시절처럼 목이 낫다.
  runCode: realApi.runCode,
  submit: realApi.submit,
  getSubmission: realApi.getSubmission,
  listSubmissions: realApi.listSubmissions,
  getRanking: realApi.getRanking,
  // 유저 프로필/칭호 (§2.15·§2.16 — 칭호 발급 전이라 titles 는 빈 배열)
  getUserProfile: realApi.getUserProfile,
  updateMyTitle: realApi.updateMyTitle,
  // 부정행위 신호 배치 — 백엔드 수신·적재(§2.17) 구현 완료
  reportSolveEvents: realApi.reportSolveEvents,
  // 토론 조회/작성/상세 (요건 4 구현 완료 — 정답자 한정)
  getDiscussions: realApi.getDiscussions,
  getDiscussionPost: realApi.getDiscussionPost,
  createDiscussionPost: realApi.createDiscussionPost,
  // 공지 상세 (요건 3 — 마크다운 body)
  getNotice: realApi.getNotice,
  // 관리자 공지 CRUD (ADMIN 전용)
  adminListNotices: realApi.adminListNotices,
  adminCreateNotice: realApi.adminCreateNotice,
  adminUpdateNotice: realApi.adminUpdateNotice,
  adminDeleteNotice: realApi.adminDeleteNotice,
}

export const api: ApiClient =
  mode === 'false' ? realApi : mode === 'hybrid' ? hybridApi : mockApi

export { ApiError } from './http'
export type { ApiClient } from './client'

if (mode !== 'false') {
  // eslint-disable-next-line no-console
  console.info(
    mode === 'hybrid'
      ? '[GrindAlgorithm] 하이브리드 모드 — 대시보드/시즌/문제/IDE(실행·제출)/채점현황/랭킹/프로필/무결성/토론/공지/언어목록은 백엔드(:8080), 나머지는 목'
      : '[GrindAlgorithm] 목 API 모드로 실행 중 — .env의 VITE_USE_MOCK=hybrid|false 로 백엔드 연동',
  )
}

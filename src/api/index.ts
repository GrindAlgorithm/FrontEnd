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
  getProblem: realApi.getProblem,
  openProblem: realApi.openProblem,
  // runCode: 목 유지 — 로컬 Judge0(isolate)가 cgroup v1 부재로 채점 불가라
  // 백엔드 judge0.client=stub 이 stdin을 그대로 echo 한다. 실행 결과가 의미를 갖지 못해 목으로 되돌림.
  submit: realApi.submit,
  getSubmission: realApi.getSubmission,
  listSubmissions: realApi.listSubmissions,
  getRanking: realApi.getRanking,
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
      ? '[GrindAlgorithm] 하이브리드 모드 — 대시보드/시즌/문제목록/문제상세/문제풀기(IDE)/제출/채점현황/랭킹은 백엔드(:8080), 코드 실행과 나머지는 목'
      : '[GrindAlgorithm] 목 API 모드로 실행 중 — .env의 VITE_USE_MOCK=hybrid|false 로 백엔드 연동',
  )
}

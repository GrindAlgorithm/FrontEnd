import type { ApiClient } from './client'
import { realApi } from './real'
import { mockApi } from './mock'

// VITE_USE_MOCK: 'false'=전부 실서버 / 'hybrid'=백엔드 구현분만 실서버 / 그 외(미설정 포함)=목
const mode = import.meta.env.VITE_USE_MOCK

/** 목 모드 여부 — OAuth 리다이렉트처럼 fetch 밖의 분기에 사용 (hybrid는 인증이 목이므로 true) */
export const IS_MOCK = mode !== 'false'

/**
 * 하이브리드: 백엔드에 이미 구현된 엔드포인트만 실서버, 나머지는 목.
 * 백엔드가 엔드포인트를 추가할 때마다 여기에 한 줄씩 옮긴다.
 */
const hybridApi: ApiClient = {
  ...mockApi,
  getDashboard: realApi.getDashboard,
  getSeasons: realApi.getSeasons,
  getSeasonProblems: realApi.getSeasonProblems,
  getProblem: realApi.getProblem,
  openProblem: realApi.openProblem,
  runCode: realApi.runCode,
  submit: realApi.submit,
  getSubmission: realApi.getSubmission,
  listSubmissions: realApi.listSubmissions,
}

export const api: ApiClient =
  mode === 'false' ? realApi : mode === 'hybrid' ? hybridApi : mockApi

export { ApiError } from './http'
export type { ApiClient } from './client'

if (mode !== 'false') {
  // eslint-disable-next-line no-console
  console.info(
    mode === 'hybrid'
      ? '[GrindAlgorithm] 하이브리드 모드 — 대시보드/시즌/문제목록/문제상세/문제풀기(IDE)/실행/제출/채점현황은 백엔드(:8080), 나머지는 목'
      : '[GrindAlgorithm] 목 API 모드로 실행 중 — .env의 VITE_USE_MOCK=hybrid|false 로 백엔드 연동',
  )
}

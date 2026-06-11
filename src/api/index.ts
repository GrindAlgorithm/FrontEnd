import type { ApiClient } from './client'
import { realApi } from './real'
import { mockApi } from './mock'

// 'false'일 때만 실제 백엔드 호출 — 그 외(미설정 포함)는 목 모드
const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

/** 목 모드 여부 — OAuth 리다이렉트처럼 fetch 밖의 분기에 사용 */
export const IS_MOCK = useMock

export const api: ApiClient = useMock ? mockApi : realApi

export { ApiError } from './http'
export type { ApiClient } from './client'

if (useMock) {
  // eslint-disable-next-line no-console
  console.info('[GrindAlgorithm] 목 API 모드로 실행 중 — .env의 VITE_USE_MOCK=false 로 백엔드 연동')
}

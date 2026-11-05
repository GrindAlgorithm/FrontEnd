import type { ApiEnvelope, ApiErrorBody } from '../types/domain'

const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/** 페이지 이탈 시 beacon 전송 등 fetch 밖에서 절대 경로가 필요할 때 */
export const API_BASE = BASE

/** 백엔드 ResultCodeEnum.SUCCESS — 이 외의 resultCode는 전부 실패 */
const RESULT_CODE_SUCCESS = '0000'

/** 백엔드 공통 봉투(util/ResponseResult.java) 여부 판별 */
function isEnvelope(data: unknown): data is ApiEnvelope<unknown> {
  return typeof data === 'object' && data !== null && 'resultCode' in data && 'result' in data
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** 세션 만료 감지 이벤트 — AuthProvider 가 구독해 로그인 페이지로 보낸다 */
export const UNAUTHORIZED_EVENT = 'grind:unauthorized'

/** 로그인/가입/로그아웃 자체의 401 은 '세션 만료'가 아니라 자격 증명 실패라 제외 */
const AUTH_ACTION_PATHS = ['/auth/login', '/auth/signup', '/auth/logout']

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include', // 세션 쿠키(JSESSIONID) 인증 — 연동 문서 §인증 참고
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let code = 'UNKNOWN'
    let message = `요청 실패 (HTTP ${res.status})`
    try {
      const data = (await res.json()) as ApiErrorBody
      code = data.error.code
      message = data.error.message
    } catch {
      // 에러 봉투가 없는 응답 (게이트웨이 에러 등)
    }
    if (res.status === 401 && !AUTH_ACTION_PATHS.some(p => path.startsWith(p))) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { path } }))
    }
    throw new ApiError(res.status, code, message)
  }
  if (res.status === 204) return undefined as T
  const data: unknown = await res.json()
  // 백엔드는 성공/실패 모두 HTTP 200 + ResponseResult 봉투로 내려준다.
  // resultCode '0000'이면 result만 벗겨서 반환, 그 외('9999' 등)는 실패로 던진다.
  if (isEnvelope(data)) {
    if (data.resultCode !== RESULT_CODE_SUCCESS) {
      throw new ApiError(res.status, data.resultCode, `요청 실패 (resultCode ${data.resultCode})`)
    }
    return data.result as T
  }
  return data as T
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

/**
 * 페이지 이탈(pagehide) 시점의 단방향 전송.
 * 이때 띄운 fetch는 브라우저가 취소하므로 sendBeacon을 쓴다 — 응답은 받을 수 없다.
 * 세션 쿠키는 same-origin이라 자동 첨부되고, Content-Type은 Blob 타입으로만 지정 가능.
 */
export function postBeacon(path: string, body: unknown): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return false
  try {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' })
    return navigator.sendBeacon(BASE + path, blob)
  } catch {
    return false
  }
}

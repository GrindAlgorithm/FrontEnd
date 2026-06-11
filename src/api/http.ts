import type { ApiErrorBody } from '../types/domain'

const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

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
    throw new ApiError(res.status, code, message)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

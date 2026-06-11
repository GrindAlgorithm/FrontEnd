/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'false'일 때만 실제 API 호출, 그 외엔 목 모드 */
  readonly VITE_USE_MOCK?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

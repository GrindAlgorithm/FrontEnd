import { useCallback, useEffect, useState } from 'react'

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  reload: () => void
  /** 폴링 등으로 받은 최신 값을 직접 반영할 때 */
  setData: (next: T) => void
}

/** 화면 단위 데이터 로딩 훅 — deps 변경 시 재요청, 언마운트 시 결과 폐기 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[]): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher().then(
      result => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      },
      (err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      },
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey])

  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  return { data, loading, error, reload, setData }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { api, IS_MOCK } from '../api'
import { postBeacon } from '../api/http'
import { CheatDetector, EMPTY_SUMMARY } from './detector'
import type { EditorMonitor } from './detector'
import type { SolveEvent, SolveEventBatch, SolveIntegritySummary } from '../types/domain'

/** 배치 전송 주기 — 이벤트가 없으면 요청도 없다 */
const FLUSH_INTERVAL_MS = 15_000
/** DevTools 감시 주기 */
const DEVTOOLS_POLL_MS = 2_000
/** 화면 타임라인에 보관할 최근 이벤트 수 (전송 큐와 별개) */
const MAX_TIMELINE = 40

export interface AntiCheatHandle {
  /** 최신순 이벤트 타임라인 (화면 표시용) */
  events: SolveEvent[]
  summary: SolveIntegritySummary
  /** CodeEditor에 그대로 넘기는 감시 인터페이스 */
  monitor: EditorMonitor
  /** 언어 전환·초기화처럼 프로그램이 코드를 바꿀 때 호출 (오탐 방지) */
  resetBaseline: (code: string) => void
  /** summary만 최신화 (패널 열 때) */
  refresh: () => void
  /** 제출 직전 등 즉시 전송 */
  flush: () => Promise<void>
}

/**
 * IDE 부정행위 신호 수집 훅 (스펙 A3).
 *
 * 창 포커스·DevTools 감시는 여기서, 에디터 입력 감시는 monitor를 CodeEditor에 꽂아서 한다.
 * 수집분은 15초마다 / 제출 직전 / 페이지 이탈 시 서버로 배치 전송한다.
 *
 * solveSessionId가 null이면(본문 로딩 전) 수집은 하되 전송하지 않는다 — 훅 호출 순서를
 * 지키려고 IDEPage 상단에서 무조건 호출하기 때문.
 */
export function useAntiCheat(params: {
  solveSessionId: string | null
  problemId: string
  initialCode: string
}): AntiCheatHandle {
  const { solveSessionId, problemId, initialCode } = params

  const detectorRef = useRef<CheatDetector | null>(null)
  if (detectorRef.current === null) {
    detectorRef.current = new CheatDetector({ initialCode })
  }
  const detector = detectorRef.current

  const [events, setEvents] = useState<SolveEvent[]>([])
  const [summary, setSummary] = useState<SolveIntegritySummary>(EMPTY_SUMMARY)

  // 이벤트 → 화면 반영
  useEffect(() => {
    detector.onEvent = event => {
      setEvents(prev => [event, ...prev].slice(0, MAX_TIMELINE))
      setSummary(detector.snapshot())
    }
    return () => {
      detector.onEvent = undefined
    }
  }, [detector])

  // 창 이탈/복귀 — blur만으로는 탭 전환을 놓치는 브라우저가 있어 visibilitychange도 함께 본다
  useEffect(() => {
    const onBlur = () => detector.windowBlurred()
    const onFocus = () => detector.windowFocused()
    const onVisibility = () =>
      document.hidden ? detector.windowBlurred() : detector.windowFocused()

    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [detector])

  // DevTools 감시 (도킹된 경우만 잡힌다 — detector.checkDevtools 주석 참고)
  useEffect(() => {
    const tick = () =>
      detector.checkDevtools(
        { width: window.outerWidth, height: window.outerHeight },
        { width: window.innerWidth, height: window.innerHeight },
      )
    tick()
    const id = window.setInterval(tick, DEVTOOLS_POLL_MS)
    return () => window.clearInterval(id)
  }, [detector])

  const flush = useCallback(async () => {
    const snapshot = detector.snapshot()
    setSummary(snapshot)
    if (!solveSessionId) return
    const drained = detector.drain()
    if (drained.length === 0) return
    const batch: SolveEventBatch = {
      solveSessionId,
      problemId,
      events: drained,
      summary: snapshot,
    }
    try {
      await api.reportSolveEvents(batch)
    } catch {
      // 신호 전송 실패로 풀이를 막지 않는다 — 큐에 되돌리고 다음 주기에 재시도
      detector.restore(drained)
    }
  }, [detector, solveSessionId, problemId])

  // 주기 전송
  useEffect(() => {
    const id = window.setInterval(() => void flush(), FLUSH_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [flush])

  // 페이지 이탈 — 이 시점의 fetch는 취소되므로 beacon으로 마지막 배치를 보낸다
  useEffect(() => {
    if (!solveSessionId) return
    const onPageHide = () => {
      const drained = detector.drain()
      if (drained.length === 0) return
      const batch: SolveEventBatch = {
        solveSessionId,
        problemId,
        events: drained,
        summary: detector.snapshot(),
      }
      if (IS_MOCK) {
        // eslint-disable-next-line no-console
        console.info('[antiCheat] 페이지 이탈 — 목 모드라 전송 생략', batch)
        return
      }
      if (!postBeacon(`/solve-sessions/${encodeURIComponent(solveSessionId)}/events`, batch)) {
        detector.restore(drained)
      }
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [detector, solveSessionId, problemId])

  // 언마운트(다른 화면으로 이동) 시 남은 신호 전송
  useEffect(() => {
    return () => {
      void flush()
    }
  }, [flush])

  const resetBaseline = useCallback((code: string) => detector.resetBaseline(code), [detector])
  const refresh = useCallback(() => setSummary(detector.snapshot()), [detector])

  return { events, summary, monitor: detector, resetBaseline, refresh, flush }
}

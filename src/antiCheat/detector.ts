import type {
  IntegrityLevel,
  SolveEvent,
  SolveEventDetail,
  SolveEventSeverity,
  SolveEventType,
  SolveIntegritySummary,
} from '../types/domain'

/**
 * 클라이언트 부정행위 탐지 엔진 (스펙 A3).
 *
 * ⚠ 한계 — 브라우저 안에서 도는 코드는 전부 우회할 수 있다(확장 프로그램, DevTools로
 * React state 직접 조작, 자동화 드라이버 등). 여기서 나오는 riskScore는 '증거'가 아니라
 * '힌트'이며, 최종 판정은 서버가 코드 유사도·풀이시간 이상치와 함께 내려야 한다.
 * 이 점수만으로 유저를 제재하면 안 된다.
 *
 * DOM도 React도 모르는 순수 로직 — 이벤트 주입은 useAntiCheat 훅이 담당한다.
 */

/**
 * 탐지 임계값 — 운영 기준(A3) 확정 전까지의 잠정값.
 * 오탐이 잦으면 로직이 아니라 여기 숫자만 손보면 된다.
 */
export const THRESHOLDS = {
  /** 한 번의 변경으로 이만큼 이상 늘면 '대량 삽입'. 자동 들여쓰기(4칸)·IME 확정보다 크게 잡음 */
  BULK_INSERT_CHARS: 12,
  /** 키를 누른 뒤 이 시간 안에 들어온 변경은 그 키의 결과로 인정 */
  KEYSTROKE_GRACE_MS: 80,
  /** 내부 복사분 붙여넣기 예고가 유효한 시간 — 이 안에 들어온 변경만 정상 삽입으로 인정 */
  INTERNAL_PASTE_GRACE_MS: 300,
  /** 사람의 지속 타이핑 상한(초당 문자). 숙련자도 코드는 ~10cps라 18은 넉넉한 선 */
  MAX_HUMAN_CPS: 18,
  /** 속도 판정 표본 수 */
  SPEED_WINDOW: 24,
  /** 리듬 판정 표본 수 — 매크로 오판은 비싸므로 속도 판정보다 표본을 넉넉히 본다 */
  RHYTHM_WINDOW: 30,
  /** 키 간격 변동계수가 이보다 낮으면 매크로 의심. 사람은 보통 0.4~0.9 */
  RHYTHM_MIN_CV: 0.12,
  /** 이보다 긴 키 간격은 '생각하는 시간'이라 리듬 표본에서 제외 */
  RHYTHM_MAX_INTERVAL_MS: 400,
  /** 이보다 짧은 창 이탈은 무시(알림 확인 수준) */
  BLUR_IGNORE_MS: 1500,
  /** 창 복귀 후 이 시간 안의 대량 삽입은 복합 신호로 승격 */
  RETURN_WINDOW_MS: 5000,
  /** outer-inner 크기 차가 이보다 크면 DevTools 도킹 의심 */
  DEVTOOLS_GAP_PX: 170,
  /** 같은 유형 이벤트 최소 간격 (연속 발행 억제) */
  EVENT_THROTTLE_MS: 10_000,
  /** 자필률 페널티를 적용하기 시작하는 최소 입력량 — 코드가 짧으면 비율이 불안정하다 */
  AUTHORSHIP_MIN_CHARS: 200,
} as const

/**
 * 이벤트별 위험 가중치 (누적 → riskScore).
 * 차단을 뚫고 들어온 삽입은 1건만으로 'caution'(20점)에 닿게 잡는다 —
 * 붙여넣기 시도(3점)와 달리 실제로 코드가 들어온 것이라 무게가 다르다.
 */
const RISK_WEIGHT: Record<SolveEventType, number> = {
  paste_blocked: 3,
  internal_paste: 0, // 본인이 방금 쓴 코드의 재사용 — 정상 행위라 감점 없음
  drop_blocked: 4,
  bulk_insert: 20,
  return_bulk_insert: 30,
  typing_speed: 8,
  typing_rhythm: 10,
  focus_lost: 0, // 자리 비움 자체는 무죄 — 복합 신호(return_bulk_insert)로만 반영
  devtools_suspected: 5,
  code_copied: 2,
}

/** 연속 발행을 억제할 유형 — 상태가 지속되는 신호들 */
const THROTTLED = new Set<SolveEventType>(['typing_speed', 'typing_rhythm', 'devtools_suspected'])

/** 타임라인 큐 상한 — 전송 실패가 이어져도 메모리가 늘지 않게 */
const MAX_QUEUE = 200

export function riskLevel(score: number): IntegrityLevel {
  if (score >= 45) return 'risk'
  if (score >= 20) return 'caution'
  return 'clean'
}

export const EMPTY_SUMMARY: SolveIntegritySummary = {
  riskScore: 0,
  level: 'clean',
  typedChars: 0,
  insertedChars: 0,
  internalPasteChars: 0,
  finalCodeChars: 0,
  authorshipRatio: 1,
  activeMs: 0,
  blurredMs: 0,
  blurCount: 0,
  eventCounts: {},
}

export interface KeyStroke {
  key: string
  /** Ctrl/⌘ 조합 — 붙여넣기 등 명령키라 입력 표본에서 제외 */
  ctrlOrMeta: boolean
  /** IME 조합 중 */
  composing: boolean
  /** 키를 누르고 있어 생긴 OS 자동 반복 */
  repeat: boolean
}

/** CodeEditor ↔ 탐지 엔진 연결 인터페이스 (CheatDetector가 그대로 구현한다) */
export interface EditorMonitor {
  keyStroke(k: KeyStroke): void
  codeChanged(next: string): void
  pasteBlocked(text: string): void
  /** CodeEditor가 내부 복사분으로 판정해 허용한 붙여넣기 — 뒤따르는 삽입을 정상 처리하라는 예고 */
  internalPaste(text: string): void
  dropBlocked(text: string): void
  copiedOut(text: string, cut: boolean): void
}

/** 공통 접두/접미를 잘라낸 변경 구간 — O(n)이라 타이핑마다 돌려도 부담 없다 */
function diffRange(prev: string, next: string): { start: number; inserted: string } {
  const max = Math.min(prev.length, next.length)
  let start = 0
  while (start < max && prev.charCodeAt(start) === next.charCodeAt(start)) start++
  let endPrev = prev.length
  let endNext = next.length
  while (
    endPrev > start &&
    endNext > start &&
    prev.charCodeAt(endPrev - 1) === next.charCodeAt(endNext - 1)
  ) {
    endPrev--
    endNext--
  }
  return { start, inserted: next.slice(start, endNext) }
}

/** 문자를 만들어내는 키인지 — Shift/화살표/F키 등은 입력 표본에서 뺀다 */
function producesInput(key: string): boolean {
  return key.length === 1 || key === 'Enter' || key === 'Tab'
}

export class CheatDetector implements EditorMonitor {
  /** 이벤트 발생 시 호출 (훅이 화면 갱신용으로 꽂는다) */
  onEvent?: (event: SolveEvent) => void

  private readonly now: () => number
  private readonly startedAt: number

  private code: string
  private lastKeyAt = 0
  /** 직전 키가 만들어낼 수 있는 최대 문자 수 (Tab=4칸, 그 외 1자) */
  private expectedChars = 0
  private composing = false

  private keyTimes: number[] = [] // 속도 표본
  private keyIntervals: number[] = [] // 리듬 표본

  private blurStartedAt: number | null = null
  private lastFocusRegainAt = 0
  private devtoolsOpen = false

  private typedChars = 0
  private insertedChars = 0
  private internalPasteChars = 0
  /** 내부 복사분 붙여넣기 예고 — 곧 들어올 삽입의 상한과 예고 시각 */
  private pendingInternalChars = 0
  private pendingInternalAt = 0
  private blurredMs = 0
  private blurCount = 0
  private riskPoints = 0

  private counts: Partial<Record<SolveEventType, number>> = {}
  private lastEventAt = new Map<SolveEventType, number>()
  private queue: SolveEvent[] = []

  constructor(options: { initialCode?: string; now?: () => number } = {}) {
    this.now = options.now ?? (() => Date.now())
    this.startedAt = this.now()
    this.code = options.initialCode ?? ''
  }

  // ── 입력 감시 ──────────────────────────────────────────────

  keyStroke(k: KeyStroke): void {
    this.composing = k.composing
    if (k.composing || k.ctrlOrMeta || !producesInput(k.key)) return

    const t = this.now()
    // 키를 꾹 눌러 생기는 OS 자동 반복은 간격이 완벽히 균일해서 속도·리듬 판정을 오염시킨다
    // ('-----' 구분선 같은 흔한 입력이 매크로로 오인됨). 삽입 판정에 쓰는 값만 갱신하고 표본에선 뺀다.
    if (k.repeat) {
      this.lastKeyAt = t
      this.expectedChars = k.key === 'Tab' ? 4 : 1
      return
    }
    if (this.lastKeyAt > 0) {
      const gap = t - this.lastKeyAt
      if (gap > 0 && gap <= THRESHOLDS.RHYTHM_MAX_INTERVAL_MS) {
        this.keyIntervals.push(gap)
        if (this.keyIntervals.length > THRESHOLDS.RHYTHM_WINDOW * 2) {
          this.keyIntervals = this.keyIntervals.slice(-THRESHOLDS.RHYTHM_WINDOW)
        }
      }
    }
    this.lastKeyAt = t
    this.expectedChars = k.key === 'Tab' ? 4 : 1 // CodeEditor가 Tab을 스페이스 4칸으로 바꾼다

    this.keyTimes.push(t)
    if (this.keyTimes.length > THRESHOLDS.SPEED_WINDOW * 2) {
      this.keyTimes = this.keyTimes.slice(-THRESHOLDS.SPEED_WINDOW)
    }
    this.checkSpeed(t)
    this.checkRhythm()
  }

  /**
   * 에디터 내용 변경. 직전 키 입력으로 설명되지 않는 증가분이 곧 '외부에서 들어온 코드'다.
   * 붙여넣기를 막아도 드래그&드롭·미들클릭·자동화 도구로는 들어올 수 있어서,
   * 차단(paste_blocked)이 아니라 이 diff가 실제 방어선 역할을 한다.
   */
  codeChanged(next: string): void {
    const prev = this.code
    this.code = next
    if (next === prev) return

    const { start, inserted } = diffRange(prev, next)
    if (inserted.length === 0) return // 삭제만 일어난 변경

    const t = this.now()

    // CodeEditor가 허용한 내부 복사분 붙여넣기 — 본인이 방금 쓴 코드의 복제라
    // typed/inserted 어느 쪽에도 세지 않는다. 자필률은 '코드가 어디서 왔나'를 재는 값이라
    // 이미 출처가 확인된 코드를 다시 붙인 것으로 흔들리면 안 된다.
    if (
      this.pendingInternalChars > 0 &&
      t - this.pendingInternalAt <= THRESHOLDS.INTERNAL_PASTE_GRACE_MS &&
      inserted.length <= this.pendingInternalChars
    ) {
      this.internalPasteChars += inserted.length
      this.pendingInternalChars = 0
      return
    }

    const byKeystroke =
      t - this.lastKeyAt <= THRESHOLDS.KEYSTROKE_GRACE_MS && inserted.length <= this.expectedChars

    if (byKeystroke || this.composing) {
      this.typedChars += inserted.length
      this.expectedChars = 0 // 같은 키로 두 번 설명되지 않게
      return
    }

    this.insertedChars += inserted.length
    if (inserted.length < THRESHOLDS.BULK_INSERT_CHARS) return // IME 확정 등 소량은 집계만

    const line = next.slice(0, start).split('\n').length
    const afterReturn =
      this.lastFocusRegainAt > 0 && t - this.lastFocusRegainAt <= THRESHOLDS.RETURN_WINDOW_MS

    if (afterReturn) {
      this.push(
        'return_bulk_insert',
        'critical',
        `창 복귀 직후 ${inserted.length}자가 삽입됨 (${line}번째 줄)`,
        { chars: inserted.length, line },
      )
    } else {
      this.push(
        'bulk_insert',
        inserted.length >= 200 ? 'critical' : 'warn',
        `${line}번째 줄에 ${inserted.length}자가 한 번에 삽입됨`,
        { chars: inserted.length, line },
      )
    }
  }

  pasteBlocked(text: string): void {
    const chars = text.length
    this.push('paste_blocked', chars >= 40 ? 'warn' : 'info', `외부 붙여넣기 차단 (${chars}자)`, {
      chars,
    })
  }

  /**
   * IDE 안에서 복사한 코드의 재붙여넣기 — 허용된 경로다.
   * 뒤따라올 codeChanged를 정상 삽입으로 처리하도록 예고해 둔다.
   */
  internalPaste(text: string): void {
    const chars = text.length
    this.pendingInternalChars = chars
    this.pendingInternalAt = this.now()
    this.push('internal_paste', 'info', `내부 복사분 붙여넣기 (${chars}자)`, { chars })
  }

  dropBlocked(text: string): void {
    const chars = text.length
    this.push('drop_blocked', 'warn', `드래그&드롭 삽입 차단 (${chars}자)`, { chars })
  }

  copiedOut(text: string, cut: boolean): void {
    const chars = text.length
    if (chars === 0) return
    this.push('code_copied', 'info', `에디터 코드 ${cut ? '잘라내기' : '복사'} (${chars}자)`, {
      chars,
    })
  }

  // ── 창 상태 감시 ───────────────────────────────────────────

  windowBlurred(): void {
    if (this.blurStartedAt != null) return // blur + visibilitychange 중복 방지
    this.blurStartedAt = this.now()
  }

  windowFocused(): void {
    if (this.blurStartedAt == null) return
    const t = this.now()
    const durationMs = t - this.blurStartedAt
    this.blurStartedAt = null
    if (durationMs < THRESHOLDS.BLUR_IGNORE_MS) return

    this.blurredMs += durationMs
    this.blurCount += 1
    this.lastFocusRegainAt = t
    const sec = Math.round(durationMs / 1000)
    this.push('focus_lost', durationMs >= 60_000 ? 'warn' : 'info', `창 이탈 ${sec}초`, {
      durationMs,
    })
  }

  /**
   * DevTools 열림 추정. 도킹된 경우의 뷰포트 축소만 잡을 수 있어
   * 분리 창은 못 잡고, 확장 프로그램 툴바 등으로 오탐도 난다 → severity는 info 고정.
   */
  checkDevtools(outer: { width: number; height: number }, inner: { width: number; height: number }): void {
    const open =
      outer.height - inner.height > THRESHOLDS.DEVTOOLS_GAP_PX ||
      outer.width - inner.width > THRESHOLDS.DEVTOOLS_GAP_PX
    if (open && !this.devtoolsOpen) {
      this.push('devtools_suspected', 'info', '개발자 도구 열림 의심')
    }
    this.devtoolsOpen = open
  }

  // ── 판정 ───────────────────────────────────────────────────

  private checkSpeed(t: number): void {
    const n = THRESHOLDS.SPEED_WINDOW
    if (this.keyTimes.length < n) return
    const span = t - this.keyTimes[this.keyTimes.length - n]
    if (span <= 0) return
    const cps = ((n - 1) * 1000) / span
    if (cps <= THRESHOLDS.MAX_HUMAN_CPS) return
    this.push('typing_speed', 'warn', `비정상 입력 속도 (초당 ${cps.toFixed(1)}자)`, {
      cps: Number(cps.toFixed(1)),
    })
  }

  private checkRhythm(): void {
    const n = THRESHOLDS.RHYTHM_WINDOW
    if (this.keyIntervals.length < n) return
    const w = this.keyIntervals.slice(-n)
    const mean = w.reduce((a, b) => a + b, 0) / n
    if (mean <= 0) return
    const variance = w.reduce((a, b) => a + (b - mean) ** 2, 0) / n
    const cv = Math.sqrt(variance) / mean
    if (cv >= THRESHOLDS.RHYTHM_MIN_CV) return
    this.push('typing_rhythm', 'warn', `기계적으로 균일한 입력 간격 (편차 ${cv.toFixed(3)})`, {
      cv: Number(cv.toFixed(3)),
    })
  }

  /** 키보드로 친 비율 — 낮을수록 '어디선가 들어온' 코드 */
  private authorshipRatio(): number {
    const total = this.typedChars + this.insertedChars
    return total === 0 ? 1 : this.typedChars / total
  }

  private riskScore(): number {
    const total = this.typedChars + this.insertedChars
    // 자필률 페널티: 0.8 이상이면 0점, 0.2 이하면 30점 (입력량이 충분할 때만)
    const ratio = this.authorshipRatio()
    const penalty =
      total < THRESHOLDS.AUTHORSHIP_MIN_CHARS
        ? 0
        : Math.round(Math.min(Math.max((0.8 - ratio) / 0.6, 0), 1) * 30)
    return Math.min(100, this.riskPoints + penalty)
  }

  snapshot(): SolveIntegritySummary {
    const t = this.now()
    const pendingBlur = this.blurStartedAt != null ? t - this.blurStartedAt : 0
    const blurredMs = this.blurredMs + pendingBlur
    const score = this.riskScore()
    return {
      riskScore: score,
      level: riskLevel(score),
      typedChars: this.typedChars,
      insertedChars: this.insertedChars,
      internalPasteChars: this.internalPasteChars,
      finalCodeChars: this.code.length,
      authorshipRatio: Number(this.authorshipRatio().toFixed(3)),
      activeMs: Math.max(0, t - this.startedAt - blurredMs),
      blurredMs,
      blurCount: this.blurCount,
      eventCounts: { ...this.counts },
    }
  }

  // ── 전송 큐 ────────────────────────────────────────────────

  /** 전송용으로 큐를 비워 가져간다 */
  drain(): SolveEvent[] {
    const out = this.queue
    this.queue = []
    return out
  }

  /** 전송 실패분을 되돌려 다음 주기에 재시도 */
  restore(events: SolveEvent[]): void {
    if (events.length === 0) return
    this.queue = [...events, ...this.queue].slice(-MAX_QUEUE)
  }

  /**
   * 탐지 기준선 재설정 — 언어 전환·초기화처럼 프로그램이 코드를 통째로 바꾼 경우.
   * 이걸 안 부르면 다음 타이핑의 diff가 교체분 전체로 잡혀 오탐이 난다.
   */
  resetBaseline(code: string): void {
    this.code = code
    this.expectedChars = 0
  }

  private push(
    type: SolveEventType,
    severity: SolveEventSeverity,
    message: string,
    detail?: SolveEventDetail,
  ): void {
    const t = this.now()
    if (THRESHOLDS.EVENT_THROTTLE_MS > 0 && THROTTLED.has(type)) {
      const last = this.lastEventAt.get(type) ?? 0
      if (t - last < THRESHOLDS.EVENT_THROTTLE_MS) return
    }
    this.lastEventAt.set(type, t)
    this.counts[type] = (this.counts[type] ?? 0) + 1
    this.riskPoints += RISK_WEIGHT[type]

    const event: SolveEvent = {
      type,
      severity,
      at: new Date(t).toISOString(),
      message,
      ...(detail ? { detail } : {}),
    }
    this.queue.push(event)
    if (this.queue.length > MAX_QUEUE) this.queue.shift()
    this.onEvent?.(event)
  }
}

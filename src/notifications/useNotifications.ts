import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import type { MeResponse, SubmissionStatus, TierRank, TitleColorKey } from '../types/domain'

/**
 * 알림 센터 — 전용 알림 API 없이 기존 응답을 모아 프론트에서 만든다.
 *
 * 출처(로그인 유저 기준):
 * - 받은 친구 신청          GET /friends            (incoming)
 * - 채점 완료               GET /submissions?mine   (최근 24시간, 결과가 난 것)
 * - 칭호 획득               GET /users/{me}         (owned — 획득 시각이 응답에 없어 처음 본 시각을 기록)
 * - 티어 하락 예고          GET /dashboard          (decay)
 * - 새 공지                 GET /dashboard          (notices)
 *
 * 읽음 상태는 브라우저(localStorage)에 유저별로 둔다 — 다른 기기와는 공유되지 않는다.
 * 처음 쓰는 브라우저에서는 이미 있던 항목을 모두 읽음으로 시작한다(과거 알림이 한꺼번에 쏟아지지 않게).
 * 단, 받은 친구 신청과 하락 예고는 지금 대응할 일이라 처음에도 안 읽음으로 둔다.
 */

export type NotificationKind = 'friend_request' | 'submission' | 'title' | 'decay' | 'notice'

export interface AppNotification {
  id: string
  kind: NotificationKind
  text: string
  /** 보조 문구(문제 이름, 공지 태그 등) */
  detail?: string
  to: string
  at: string // ISO — 정렬·상대 시각 표시용
  read: boolean
  /** 종류별 표시 정보 */
  submissionStatus?: SubmissionStatus
  titleColor?: TitleColorKey
  toTier?: TierRank
}

const POLL_MS = 60_000
const SUBMISSION_WINDOW_MS = 24 * 3_600_000
const NOTICE_WINDOW_MS = 14 * 24 * 3_600_000
const MAX_ITEMS = 30
const MAX_READ_IDS = 300

interface Stored {
  readIds: string[]
  /** 칭호 id → 처음 본 시각 (응답에 획득 시각이 없어서) */
  titleSeenAt: Record<string, string>
}

const storageKey = (handle: string) => `grind.notifications.${handle}`

function loadStored(handle: string): Stored | null {
  try {
    const raw = localStorage.getItem(storageKey(handle))
    return raw ? (JSON.parse(raw) as Stored) : null
  } catch {
    return null
  }
}

function saveStored(handle: string, s: Stored): void {
  try {
    localStorage.setItem(
      storageKey(handle),
      JSON.stringify({ ...s, readIds: s.readIds.slice(-MAX_READ_IDS) }),
    )
  } catch {
    // 저장 불가(사생활 보호 모드 등) — 이번 세션 동안만 메모리에서 유지된다
  }
}

const TIER_KO: Record<string, string> = {
  bronze: '브론즈',
  silver: '실버',
  gold: '골드',
  platinum: '플래티넘',
  diamond: '다이아',
}

const STATUS_TEXT: Partial<Record<SubmissionStatus, string>> = {
  accepted: '맞았습니다',
  wrong_answer: '틀렸습니다',
  time_limit: '시간 초과',
  memory_limit: '메모리 초과',
  runtime_error: '런타임 에러',
  compile_error: '컴파일 에러',
}

/** 실패한 출처는 빈 목록으로 — 한 API 실패가 알림 전체를 막지 않게 */
async function settle<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p
  } catch {
    return null
  }
}

async function collect(
  me: MeResponse,
  stored: Stored,
  now: number,
  firstRun: boolean,
): Promise<Omit<AppNotification, 'read'>[]> {
  const [friends, submissions, profile, dashboard] = await Promise.all([
    settle(api.getFriends()),
    settle(api.listSubmissions({ mine: true })),
    settle(api.getUserProfile(me.handle)),
    settle(api.getDashboard()),
  ])
  const items: Omit<AppNotification, 'read'>[] = []

  for (const r of friends?.incoming ?? []) {
    items.push({
      id: `fr-${r.id}`,
      kind: 'friend_request',
      text: `${r.user.handle} 님이 친구 신청을 보냈습니다`,
      to: '/friends',
      at: r.createdAt,
    })
  }

  for (const s of submissions ?? []) {
    const label = STATUS_TEXT[s.status]
    if (!label || now - Date.parse(s.submittedAt) > SUBMISSION_WINDOW_MS) continue
    items.push({
      id: `sb-${s.submissionId}`,
      kind: 'submission',
      text: `채점 완료 · ${label}`,
      detail: `${s.problem.displayNo}. ${s.problem.title}`,
      to: `/problems/${s.problem.problemId}`,
      at: s.submittedAt,
      submissionStatus: s.status,
    })
  }

  for (const t of profile?.titles ?? []) {
    if (!t.owned) continue
    // 처음 쓰는 브라우저에서 이미 가진 칭호는 '방금' 받은 게 아니다 — 가입 시각으로 두어 목록 아래로 보낸다
    const seen = (stored.titleSeenAt[t.id] ??= firstRun ? me.joinedAt : new Date(now).toISOString())
    items.push({
      id: `tt-${t.id}`,
      kind: 'title',
      text: `칭호 획득 · ${t.name}`,
      detail: t.description,
      to: `/users/${me.handle}`,
      at: seen,
      titleColor: t.colorKey,
    })
  }

  const decay = dashboard?.decay
  if (decay) {
    // 같은 예고(같은 날 같은 하락)는 한 번만 — 날이 바뀌면 새 알림
    const day = new Date(now).toLocaleDateString('sv-SE')
    items.push({
      id: `dc-${decay.toTier.name}-${decay.toTier.level}-${day}`,
      kind: 'decay',
      text: `${decay.daysUntilDrop}일 뒤 티어가 내려갑니다`,
      detail: `${TIER_KO[decay.fromTier.name]} ${decay.fromTier.level} → ${TIER_KO[decay.toTier.name]} ${decay.toTier.level} · ${decay.inactiveDays}일째 정답 없음`,
      to: '/home',
      at: new Date(now).toISOString(),
      toTier: decay.toTier,
    })
  }

  for (const n of dashboard?.notices ?? []) {
    if (now - Date.parse(n.publishedAt) > NOTICE_WINDOW_MS) continue
    items.push({
      id: `nt-${n.id}`,
      kind: 'notice',
      text: n.title,
      detail: n.tag,
      to: `/notices/${n.id}`,
      at: n.publishedAt,
    })
  }

  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, MAX_ITEMS)
}

export function useNotifications(me: MeResponse | null) {
  const [items, setItems] = useState<AppNotification[]>([])
  const storedRef = useRef<Stored | null>(null)
  const handle = me?.handle ?? null

  const refresh = useCallback(async () => {
    if (!me) return
    const now = Date.now()
    const existing = loadStored(me.handle)
    const stored: Stored = existing ?? { readIds: [], titleSeenAt: {} }
    const raw = await collect(me, stored, now, !existing)
    if (!existing) {
      // 첫 사용: 대응할 일(친구 신청·하락 예고)만 남기고 나머지는 읽음으로 시작
      stored.readIds = raw.filter(n => n.kind !== 'friend_request' && n.kind !== 'decay').map(n => n.id)
    }
    storedRef.current = stored
    saveStored(me.handle, stored)
    const read = new Set(stored.readIds)
    setItems(raw.map(n => ({ ...n, read: read.has(n.id) })))
  }, [me])

  useEffect(() => {
    setItems([])
    if (!handle) return
    void refresh()
    const timer = window.setInterval(() => void refresh(), POLL_MS)
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [handle, refresh])

  const markRead = useCallback(
    (ids: string[]) => {
      if (!handle || ids.length === 0) return
      const stored = storedRef.current ?? loadStored(handle) ?? { readIds: [], titleSeenAt: {} }
      const set = new Set(stored.readIds)
      ids.forEach(id => set.add(id))
      stored.readIds = [...set]
      storedRef.current = stored
      saveStored(handle, stored)
      setItems(prev => prev.map(n => (ids.includes(n.id) ? { ...n, read: true } : n)))
    },
    [handle],
  )

  const unreadCount = items.filter(n => !n.read).length
  return { items, unreadCount, markRead, refresh }
}

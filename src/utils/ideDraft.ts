import type { LanguageCode } from '../types/domain'

/**
 * IDE 마지막 상태(초안) 저장 — 문제·사용자별 localStorage.
 *
 * 저장 대상: 마지막 선택 언어, 언어별 코드, 테스트 입력.
 * 키에 사용자 handle을 넣어 같은 브라우저를 쓰는 다른 계정과 섞이지 않게 한다.
 * localStorage는 사용자가 직접 고칠 수 있으므로 복원 시 반드시 antiCheat.draftRestored로 기록을 남긴다.
 */
export interface IdeDraft {
  lang: LanguageCode
  codes: Partial<Record<LanguageCode, string>>
  input: string
  /** ISO 8601 */
  savedAt: string
}

const VERSION = 1
/** 보관 상한 — 넘으면 오래된 초안부터 지운다 */
const MAX_DRAFTS = 50
const PREFIX = `ide.draft.v${VERSION}.`

const keyOf = (user: string, problemId: string) => `${PREFIX}${user}.${problemId}`

export function loadDraft(user: string, problemId: string): IdeDraft | null {
  try {
    const raw = localStorage.getItem(keyOf(user, problemId))
    if (!raw) return null
    const d = JSON.parse(raw) as IdeDraft
    if (!d || typeof d.lang !== 'string' || typeof d.codes !== 'object') return null
    return { lang: d.lang, codes: d.codes ?? {}, input: d.input ?? '', savedAt: d.savedAt ?? '' }
  } catch {
    return null
  }
}

export function saveDraft(user: string, problemId: string, draft: IdeDraft): boolean {
  try {
    localStorage.setItem(keyOf(user, problemId), JSON.stringify(draft))
    pruneDrafts()
    return true
  } catch {
    // 용량 초과·사생활 보호 모드 — 저장 실패가 풀이를 막지 않게 한다
    return false
  }
}

export function clearDraft(user: string, problemId: string) {
  try {
    localStorage.removeItem(keyOf(user, problemId))
  } catch {
    /* noop */
  }
}

function pruneDrafts() {
  const entries: { key: string; at: string }[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(PREFIX)) continue
    try {
      entries.push({ key, at: (JSON.parse(localStorage.getItem(key) ?? '{}') as IdeDraft).savedAt ?? '' })
    } catch {
      entries.push({ key, at: '' })
    }
  }
  if (entries.length <= MAX_DRAFTS) return
  entries.sort((a, b) => a.at.localeCompare(b.at))
  for (const e of entries.slice(0, entries.length - MAX_DRAFTS)) localStorage.removeItem(e.key)
}

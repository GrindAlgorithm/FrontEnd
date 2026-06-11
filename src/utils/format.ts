/** ISO 시각 → 한국어 상대 시간 ("방금", "5분 전", "어제" …). 미래 시각은 "M월 D일"로. */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime()
  const diff = now - t
  if (diff < 0) {
    const d = new Date(iso)
    return `${d.getMonth() + 1}월 ${d.getDate()}일`
  }
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}시간 전`
  const day = Math.floor(hour / 24)
  if (day === 1) return '어제'
  if (day < 7) return `${day}일 전`
  const week = Math.floor(day / 7)
  if (week < 5) return `${week}주 전`
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** ISO date → "M/D" (시즌 기간 표기용) */
export function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** ActivityDay[] → 잔디 그리드용 주(week) 단위 2차원 배열 (열=주, 행=요일) */
export function toJandiWeeks(days: { level: number }[]): number[][] {
  const weeks: number[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7).map(d => d.level))
  }
  return weeks
}

import type { SubmissionStatus, TierName, TitleColorKey } from './types/domain'

// ── 디자인 토큰: 세션 E 개편 — 다크 터미널 테마 (docs/DESIGN.md 참고) ──
// 규칙: 그라데이션·box-shadow·border-radius 금지. 위계는 배경 대비와 1px 보더로만.
export const C = {
  // 액센트 — phosphor green 단일 액센트
  accent: '#3fb950',
  accentDim: '#2ea043',
  accentBg: 'rgba(63, 185, 80, 0.12)',

  // 표면 — 어두운 쪽이 아래층 (bg < surface < surfaceAlt)
  bg: '#0d1117',
  surface: '#161b22',
  surfaceAlt: '#1c2128',
  border: '#30363d',
  borderLight: '#21262d',

  // 텍스트
  text: '#e6edf3',
  muted: '#8b949e',

  // 시맨틱
  green: '#3fb950',
  greenBg: 'rgba(63, 185, 80, 0.12)',
  red: '#f85149',
  redBg: 'rgba(248, 81, 73, 0.12)',
  amber: '#d29922',
  amberBg: 'rgba(210, 153, 34, 0.12)',

  // 티어 — 다크 배경 대비 보정값
  bronze: '#d1824a',
  silver: '#9daebe',
  gold: '#f0b429',
  platinum: '#27e2a4',
  diamond: '#4cc2ff',

  // 레거시 별칭 — accent 로 이관 완료 후에도 임시 유지 (신규 코드는 accent 사용)
  blue: '#3fb950',
  blueDark: '#2ea043',
} as const

export const fontStack =
  '"Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
// 한글이 섞이는 모노 맥락(로고·라벨)은 D2Coding → Pretendard 로 폴백된다
export const monoStack =
  '"JetBrains Mono", "D2Coding", ui-monospace, SFMono-Regular, Menlo, "Cascadia Mono", monospace'

export const tierMap: Record<TierName, { color: string; label: string }> = {
  bronze: { color: C.bronze, label: '브론즈' },
  silver: { color: C.silver, label: '실버' },
  gold: { color: C.gold, label: '골드' },
  platinum: { color: C.platinum, label: '플래티넘' },
  diamond: { color: C.diamond, label: '다이아' },
}

// 칭호/리워드 색상 키 → 실제 색상
export const titleColorMap: Record<TitleColorKey, string> = {
  bronze: C.bronze,
  silver: C.silver,
  gold: C.gold,
  platinum: C.platinum,
  diamond: C.diamond,
  green: C.green,
  blue: C.accent,
}

// 잔디(활동 그래프) 단계 색상 — GitHub 다크 잔디 톤
export const JANDI_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'] as const

// 채점 결과 → 표시 텍스트
export const SUBMISSION_STATUS_TEXT: Record<SubmissionStatus, string> = {
  queued: '대기 중',
  judging: '채점 중',
  accepted: '맞았습니다!!',
  wrong_answer: '틀렸습니다',
  time_limit: '시간 초과',
  memory_limit: '메모리 초과',
  runtime_error: '런타임 에러',
  compile_error: '컴파일 에러',
}

export function submissionStatusText(status: SubmissionStatus, progress?: number | null): string {
  if (status === 'judging' && progress != null) return `채점 중 (${progress}%)`
  return SUBMISSION_STATUS_TEXT[status]
}

export function submissionStatusColor(status: SubmissionStatus): string {
  if (status === 'accepted') return C.green
  if (status === 'queued' || status === 'judging') return C.muted
  return C.red
}

// 토론 카테고리 색상
export const DISCUSSION_TAG_COLOR = {
  code_review: C.diamond,
  solution: C.green,
} as const

export const DISCUSSION_TAG_LABEL = {
  code_review: '코드리뷰',
  solution: '풀이공유',
} as const

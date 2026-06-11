import type { SubmissionStatus, TierName, TitleColorKey } from './types/domain'

// ── 디자인 토큰: 와이어프레임(algo_kr_overview.jsx)에서 그대로 이관 ──
export const C = {
  blue: '#0d6efd',
  blueDark: '#0a58ca',
  border: '#dee2e6',
  borderLight: '#e9ecef',
  bg: '#f8f9fa',
  text: '#212529',
  muted: '#6c757d',
  green: '#198754',
  red: '#dc3545',
  bronze: '#ad5600',
  silver: '#435f7a',
  gold: '#ec9a00',
  platinum: '#27e2a4',
  diamond: '#00b4fc',
} as const

export const fontStack =
  '"Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
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
  blue: C.blue,
}

// 잔디(활동 그래프) 단계 색상 — GitHub 잔디 톤
export const JANDI_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'] as const

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
  code_review: C.blue,
  solution: C.green,
} as const

export const DISCUSSION_TAG_LABEL = {
  code_review: '코드리뷰',
  solution: '풀이공유',
} as const

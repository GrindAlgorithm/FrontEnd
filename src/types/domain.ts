// ─────────────────────────────────────────────────────────────
// 도메인 타입 = 백엔드 API 응답 계약
// docs/BACKEND_INTEGRATION.md 의 JSON 스키마와 1:1 대응한다.
// 필드를 바꾸면 반드시 문서도 함께 갱신할 것.
// ─────────────────────────────────────────────────────────────

export type TierName = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
export type TierLevel = 'I' | 'II' | 'III' | 'IV' | 'V'

export interface TierRank {
  name: TierName
  level: TierLevel
}

/** 문제에 대한 내 진행 상태 */
export type ProblemStatus = 'cleared' | 'wip' | 'untried'

export type SubmissionStatus =
  | 'queued'
  | 'judging'
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit'
  | 'memory_limit'
  | 'runtime_error'
  | 'compile_error'

/** 제출 언어 코드 — Judge0 language_id 매핑은 연동 문서 참고 */
export type LanguageCode = 'java11' | 'python3' | 'cpp17' | 'nodejs'

export type TitleColorKey = TierName | 'green' | 'blue'

// ── 인증/내 정보 ──────────────────────────────────────────────

export interface MeResponse {
  handle: string
  joinedAt: string // ISO 8601
  seasonTier: TierRank | null // 시즌 미참여(미배치) 시 null
  seasonScore: number
  seasonRank: number | null
  selectedTitleId: string | null
}

// ── 홈 대시보드 ──────────────────────────────────────────────

export interface DecayWarning {
  inactiveDays: number // 연속 미활동 일수
  daysUntilDrop: number // 하락까지 남은 일수
  fromTier: TierRank
  toTier: TierRank
}

export type RecommendReason =
  | 'tier_up' // 티어업 후보 (파랑 강조)
  | 'weak_area' // 약한 분야 (빨강 강조)
  | 'continue' // 이어 풀기
  | 'similar_level' // 비슷한 난이도
  | 'category_pick' // 분야 추천

export interface TodayPick {
  problemId: string
  displayNo: string
  title: string
  tier: TierRank
  reason: string // 표시 문구 (예: "약한 분야 · DP")
  reasonType: RecommendReason
}

export interface NearbyRankingEntry {
  rank: number
  handle: string
  tier: TierRank
  weeklyDelta: number // 7일 순위 변동 (+면 상승)
  isMe: boolean
}

export interface SeasonProgress {
  seasonId: number
  name: string
  startDate: string // ISO date
  endDate: string
  dDay: number
  progressRatio: number // 0~1
  solvedCount: number // 시즌 문제 클리어 수
  totalCount: number // 시즌 문제 전체 수
  nextProblemId: string | null // "다음 시즌 문제 풀기" 대상
}

export interface WeeklyStats {
  solvedCount: number
  scoreGained: number
  streakDays: number
  accuracyRate: number // % (0~100)
}

export interface Notice {
  id: number
  tag: string // "공지" | "업데이트" 등
  title: string
  publishedAt: string // ISO 8601
  highlight: boolean
}

export interface ActivityDay {
  date: string // ISO date (YYYY-MM-DD)
  count: number // 그날 푼 문제 수
  level: 0 | 1 | 2 | 3 | 4 // 잔디 강도
}

export interface ActivityCalendar {
  days: ActivityDay[] // 과거 → 오늘 순
  activeDays: number
  avgPerDay: number
}

export interface DashboardResponse {
  decay: DecayWarning | null
  todayPicks: TodayPick[]
  nearbyRanking: NearbyRankingEntry[] // 내 순위 ±2
  season: SeasonProgress
  weekly: WeeklyStats
  notices: Notice[]
  seasonActivity: ActivityCalendar // 시즌 시작 ~ 오늘 (최대 12주)
}

// ── 시즌/문제 ────────────────────────────────────────────────

export type SeasonStatus = 'current' | 'past' | 'beta'

export interface SeasonSummary {
  id: number
  name: string // "Season 2"
  startDate: string
  endDate: string
  status: SeasonStatus
  dDay: number | null // current일 때만
}

export interface ProblemSummary {
  problemId: string // URL 키 (예: "S2-08", "21609")
  displayNo: string // 표시용 번호
  title: string
  tags: string[]
  tier: TierRank
  acceptanceRate: number // % (0~100)
  points: number // 시즌 점수 (난이도별 고정 — A1 확정)
  myStatus: ProblemStatus
}

export interface ProblemDetail {
  problemId: string
  displayNo: string
  title: string
  tier: TierRank
  tags: string[]
  expectedComplexity: string | null // "O(N⁴) 이내"
  timeLimitSec: number
  memoryLimitMb: number
  stats: {
    submissionCount: number
    acceptedCount: number
    solverCount: number
    acceptanceRate: number
  }
  points: number | null // 일반(비시즌) 문제는 null
  seasonId: number | null
  discussionCount: number
  my: {
    status: ProblemStatus
    attemptCount: number
    lastTriedAt: string | null
  }
}

// ── IDE / 실행 / 제출 ────────────────────────────────────────

export interface ProblemBody {
  description: string
  inputSpec: string
  outputSpec: string
  samples: { input: string; output: string }[]
}

/**
 * 문제 열기 = 본문 노출 시점 기록 (부정행위 방지 B2).
 * 본문은 이 응답으로만 내려온다 — GET /problems/{id} 에는 본문이 없다.
 */
export interface OpenProblemResponse {
  solveSessionId: string
  openedAt: string
  problem: ProblemDetail
  body: ProblemBody
}

export interface RunRequest {
  problemId: string
  solveSessionId: string
  language: LanguageCode
  sourceCode: string
  stdin: string
}

export interface RunResult {
  status: 'ok' | 'compile_error' | 'runtime_error' | 'time_limit'
  stdout: string
  stderr: string | null
  timeMs: number | null
  memoryKb: number | null
  exitCode: number | null
}

export interface SubmitRequest {
  problemId: string
  solveSessionId: string
  language: LanguageCode
  sourceCode: string
}

export interface SubmitResponse {
  submissionId: number
}

export interface SubmissionSummary {
  submissionId: number
  user: { handle: string }
  problem: { problemId: string; displayNo: string; title: string }
  status: SubmissionStatus
  progress: number | null // judging일 때 0~100
  timeMs: number | null
  memoryKb: number | null
  language: LanguageCode
  codeBytes: number
  submittedAt: string
}

// ── 랭킹 ─────────────────────────────────────────────────────

export type RankingScope = 'season' | 'overall' | 'friends'

export interface RankingEntry {
  rank: number
  handle: string
  tier: TierRank
  score: number
  solvedCount: number
  lastActiveAt: string
}

export interface RankingResponse {
  season: SeasonSummary
  entries: RankingEntry[]
  myEntry: RankingEntry | null
}

// ── 유저 프로필 / 칭호 ───────────────────────────────────────

export interface UserTitle {
  id: string
  name: string
  description: string
  colorKey: TitleColorKey
  owned: boolean
  fromSeason: number | null // null = 시즌 무관(연속 활동 등)
  expired: boolean // 시즌 종료로 획득 불가
}

export interface UserStats {
  solvedCount: number
  submissionCount: number
  accuracyRate: number
  avgAttempts: number
  streakDays: number
  longestStreakDays: number
}

export interface RecentSolvedItem {
  problemId: string
  displayNo: string
  title: string
  tier: TierRank
  solvedAt: string
}

export interface RecentSubmissionItem {
  submissionId: number
  problemId: string
  displayNo: string
  title: string
  status: SubmissionStatus
  submittedAt: string
}

export interface UserProfileResponse {
  handle: string
  joinedAt: string
  isMe: boolean
  seasonTier: TierRank | null
  seasonScore: number
  seasonRank: number | null
  decay: DecayWarning | null // 본인 프로필에만 내려옴
  stats: UserStats
  titles: UserTitle[] // 보유 + 미보유 전체 (본인) / 보유만 (타인)
  selectedTitleId: string | null
  activity: ActivityCalendar // 최근 52주
  recentSolved: RecentSolvedItem[]
  recentSubmissions: RecentSubmissionItem[]
}

// ── 시즌 상세 ────────────────────────────────────────────────

export interface SeasonReward {
  id: string
  name: string
  colorKey: TitleColorKey
  condition: string
  achieved: boolean
  progressText: string // "진행중 (7/15)" | "달성"
}

export interface PastSeasonRow {
  id: number
  name: string
  periodText: string // "4/1 ~ 6/30" | "베타 시즌"
  champion: { handle: string; tier: TierRank }
}

export interface SeasonDetailResponse {
  season: SeasonSummary
  progressRatio: number
  problems: ProblemSummary[]
  rewards: SeasonReward[]
  pastSeasons: PastSeasonRow[]
}

// ── 문제 토론 (정답자 한정) ──────────────────────────────────

export type DiscussionCategory = 'code_review' | 'solution'

export interface DiscussionPost {
  id: number
  category: DiscussionCategory
  title: string
  author: { handle: string; tierName: TierName }
  commentCount: number
  voteCount: number
  createdAt: string
}

export interface DiscussionStats {
  postCount: number
  publicSolutionCount: number
  codeReviewCount: number
}

/** 미해결 유저에게는 통계만, 정답자에게는 글 목록까지 */
export type DiscussionResponse =
  | { accessible: false; stats: DiscussionStats }
  | { accessible: true; firstSolvedAt: string; stats: DiscussionStats; posts: DiscussionPost[] }

// ── 에러 봉투 ────────────────────────────────────────────────

export interface ApiErrorBody {
  error: {
    code: string // "UNAUTHORIZED" | "DISCUSSION_LOCKED" | ...
    message: string
  }
}

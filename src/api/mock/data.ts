import type {
  ActivityCalendar,
  ActivityDay,
  DecayWarning,
  DiscussionPost,
  MeResponse,
  NearbyRankingEntry,
  Notice,
  PastSeasonRow,
  ProblemBody,
  ProblemSummary,
  RankingEntry,
  SeasonReward,
  SeasonSummary,
  SubmissionSummary,
  TierLevel,
  TierName,
  TodayPick,
  UserTitle,
} from '../../types/domain'

// ─────────────────────────────────────────────────────────────
// 목 데이터 — 와이어프레임(algo_kr_overview.jsx)의 데이터를 이관.
// 와이어프레임에서 화면마다 달랐던 '나'(algo_lover / me_dev)는
// algo_lover(시즌 4위, 플래티넘 II) 하나로 통일했다.
// ─────────────────────────────────────────────────────────────

export const now = () => Date.now()
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export const minutesAgo = (n: number) => new Date(now() - n * MIN).toISOString()
export const hoursAgo = (n: number) => new Date(now() - n * HOUR).toISOString()
export const daysAgo = (n: number) => new Date(now() - n * DAY).toISOString()

function tier(name: TierName, level: TierLevel) {
  return { name, level }
}

// 난이도별 고정 점수 (A1 확정: 고정 점수·절댓값) — 실서비스에선 백엔드가 산정
export const TIER_POINTS: Record<TierName, Record<TierLevel, number>> = {
  bronze: { V: 5, IV: 6, III: 7, II: 8, I: 10 },
  silver: { V: 12, IV: 14, III: 16, II: 18, I: 22 },
  gold: { V: 25, IV: 30, III: 35, II: 42, I: 50 },
  platinum: { V: 60, IV: 70, III: 85, II: 100, I: 120 },
  diamond: { V: 150, IV: 180, III: 220, II: 270, I: 330 },
}

export function pointsOf(t: TierName, l: TierLevel): number {
  return TIER_POINTS[t][l]
}

// ── 나 ───────────────────────────────────────────────────────

export const ME: MeResponse = {
  handle: 'algo_lover',
  joinedAt: '2025-12-03T09:00:00+09:00',
  seasonTier: tier('platinum', 'II'),
  seasonScore: 2433,
  seasonRank: 4,
  selectedTitleId: 's1_clear',
}

export const DECAY: DecayWarning = {
  inactiveDays: 5,
  daysUntilDrop: 2,
  fromTier: tier('platinum', 'II'),
  toTier: tier('platinum', 'III'),
}

// ── 시즌/문제 ────────────────────────────────────────────────

export const SEASONS: SeasonSummary[] = [
  {
    id: 2,
    name: 'Season 2',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    status: 'current',
    dDay: 72,
  },
  {
    id: 1,
    name: 'Season 1',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    status: 'past',
    dDay: null,
  },
]

type Raw = [string, string, TierName, TierLevel, string[], number, ProblemSummary['myStatus']]

function toProblems(rows: Raw[]): ProblemSummary[] {
  return rows.map(([problemId, title, t, l, tags, rate, myStatus]) => ({
    problemId,
    displayNo: problemId,
    title,
    tags,
    tier: tier(t, l),
    acceptanceRate: rate,
    points: pointsOf(t, l),
    myStatus,
  }))
}

export const SEASON2_PROBLEMS: ProblemSummary[] = toProblems([
  ['S2-01', '시작 코드: 정렬 변주', 'bronze', 'IV', ['정렬'], 71.2, 'cleared'],
  ['S2-02', '부분합 한 줄', 'bronze', 'III', ['부분합'], 65.5, 'cleared'],
  ['S2-03', '슬라이딩 윈도우', 'silver', 'IV', ['투포인터'], 52.3, 'cleared'],
  ['S2-04', '트리 BFS', 'silver', 'III', ['BFS', '트리'], 48.1, 'cleared'],
  ['S2-05', '우선순위 큐 워밍업', 'silver', 'II', ['자료구조'], 45.2, 'cleared'],
  ['S2-06', '그리디 인터벌', 'silver', 'I', ['그리디'], 42.8, 'cleared'],
  ['S2-07', '다이나믹 그리드', 'gold', 'V', ['DP'], 38.5, 'cleared'],
  ['S2-08', '그래프 가중치 처리', 'gold', 'IV', ['다익스트라'], 33.1, 'wip'],
  ['S2-09', '비트마스크 DP', 'gold', 'III', ['DP', '비트마스크'], 28.4, 'untried'],
  ['S2-10', 'LIS 변형', 'gold', 'II', ['DP'], 25.3, 'untried'],
  ['S2-11', '최단경로 다중 시작점', 'gold', 'I', ['다익스트라'], 22.7, 'untried'],
  ['S2-12', '백트래킹 메이즈', 'platinum', 'V', ['백트래킹'], 18.2, 'untried'],
  ['S2-13', '세그먼트 트리 기본', 'platinum', 'IV', ['세그먼트트리'], 14.5, 'untried'],
  ['S2-14', '이분 매칭', 'platinum', 'III', ['매칭'], 11.2, 'untried'],
  ['S2-15', '시즌 결승: 그래프 컬러링', 'platinum', 'II', ['그래프'], 8.4, 'untried'],
])

export const SEASON1_PROBLEMS: ProblemSummary[] = toProblems([
  ['S1-01', '시즌 도입: 색깔 배열', 'bronze', 'III', ['구현'], 68.1, 'cleared'],
  ['S1-02', '비밀 코드의 깊이', 'silver', 'IV', ['DFS'], 51.5, 'cleared'],
  ['S1-03', '시간 여행자의 일정표', 'silver', 'I', ['정렬', '그리디'], 41.2, 'cleared'],
  ['S1-04', '미로의 분기점', 'gold', 'V', ['BFS'], 36.8, 'cleared'],
  ['S1-05', '네트워크의 약점', 'gold', 'III', ['그래프'], 28.1, 'cleared'],
  ['S1-06', '교차로의 신호', 'gold', 'II', ['시뮬레이션'], 24.3, 'cleared'],
  ['S1-07', '왕국의 분할', 'gold', 'I', ['분할정복'], 21.5, 'cleared'],
  ['S1-08', '소수의 정원', 'platinum', 'V', ['수학'], 17.2, 'cleared'],
  ['S1-09', '암호의 재구성', 'platinum', 'IV', ['문자열'], 13.8, 'untried'],
  ['S1-10', '겹쳐진 별자리', 'platinum', 'III', ['기하'], 10.2, 'untried'],
  ['S1-11', '환상의 격자', 'platinum', 'II', ['DP', '시뮬레이션'], 8.4, 'untried'],
  ['S1-12', '시즌 결승: 운명의 그래프', 'diamond', 'V', ['그래프'], 5.1, 'untried'],
])

export const SEASON_PROBLEMS: Record<number, ProblemSummary[]> = {
  2: SEASON2_PROBLEMS,
  1: SEASON1_PROBLEMS,
}

// 일반(비시즌) 문제 — 홈 추천·채점 현황·프로필에서 참조됨. points는 랭킹 무관이므로 null 취급.
export const GENERAL_PROBLEMS: ProblemSummary[] = [
  { problemId: '21609', displayNo: '21609', title: '상어 중학교', tags: ['시뮬레이션', 'BFS', '구현'], tier: tier('platinum', 'V'), acceptanceRate: 35.6, points: 0, myStatus: 'cleared' },
  { problemId: '1167', displayNo: '1167', title: '트리의 지름', tags: ['트리', 'DFS'], tier: tier('gold', 'II'), acceptanceRate: 32.4, points: 0, myStatus: 'untried' },
  { problemId: '11404', displayNo: '11404', title: '플로이드', tags: ['플로이드–워셜'], tier: tier('gold', 'IV'), acceptanceRate: 41.2, points: 0, myStatus: 'untried' },
  { problemId: '14503', displayNo: '14503', title: '로봇 청소기', tags: ['시뮬레이션'], tier: tier('gold', 'V'), acceptanceRate: 38.9, points: 0, myStatus: 'wip' },
  { problemId: '21610', displayNo: '21610', title: '마법사 상어와 비바라기', tags: ['시뮬레이션'], tier: tier('platinum', 'V'), acceptanceRate: 22.1, points: 0, myStatus: 'untried' },
  { problemId: '17143', displayNo: '17143', title: '낚시왕', tags: ['시뮬레이션'], tier: tier('platinum', 'III'), acceptanceRate: 19.8, points: 0, myStatus: 'untried' },
  { problemId: '1000', displayNo: '1000', title: 'A+B', tags: ['수학', '구현'], tier: tier('bronze', 'V'), acceptanceRate: 39.7, points: 0, myStatus: 'cleared' },
  { problemId: '1753', displayNo: '1753', title: '최단경로', tags: ['다익스트라'], tier: tier('gold', 'IV'), acceptanceRate: 25.3, points: 0, myStatus: 'cleared' },
  { problemId: '11657', displayNo: '11657', title: '타임머신', tags: ['벨만–포드'], tier: tier('gold', 'IV'), acceptanceRate: 23.8, points: 0, myStatus: 'cleared' },
  { problemId: '1149', displayNo: '1149', title: 'RGB거리', tags: ['DP'], tier: tier('silver', 'I'), acceptanceRate: 54.1, points: 0, myStatus: 'cleared' },
  { problemId: '1932', displayNo: '1932', title: '정수 삼각형', tags: ['DP'], tier: tier('silver', 'I'), acceptanceRate: 59.7, points: 0, myStatus: 'cleared' },
]

export function findProblem(problemId: string): ProblemSummary | undefined {
  return (
    SEASON2_PROBLEMS.find(p => p.problemId === problemId) ??
    SEASON1_PROBLEMS.find(p => p.problemId === problemId) ??
    GENERAL_PROBLEMS.find(p => p.problemId === problemId)
  )
}

export function seasonIdOf(problemId: string): number | null {
  if (SEASON2_PROBLEMS.some(p => p.problemId === problemId)) return 2
  if (SEASON1_PROBLEMS.some(p => p.problemId === problemId)) return 1
  return null
}

// ── IDE 본문 (목: 어떤 문제를 열어도 동일 예제 본문) ─────────

export const SAMPLE_INPUT = `5 3
1 1 1 2 3
1 1 1 2 3
2 2 2 0 3
0 -1 -1 3 3
0 0 -1 3 3`

export const MOCK_BODY: ProblemBody = {
  description:
    '상어 중학교에는 교실이 하나 있고, N×N 격자에 블록이 놓여있다. 인접한 같은 색 블록을 묶어 그룹을 만들고, 가장 큰 그룹을 찾아 제거하는 작업을 반복한다.',
  inputSpec: '첫째 줄에 N, M이 주어진다. 둘째 줄부터 N개의 줄에 격자 정보가 주어진다.',
  outputSpec: '획득한 점수의 합을 출력한다.',
  samples: [{ input: SAMPLE_INPUT, output: '50' }],
}

// ── 홈 ───────────────────────────────────────────────────────

export const TODAY_PICKS: TodayPick[] = [
  { problemId: '1167', displayNo: '1167', title: '트리의 지름', tier: tier('gold', 'II'), reason: '티어업 후보', reasonType: 'tier_up' },
  { problemId: '11404', displayNo: '11404', title: '플로이드', tier: tier('gold', 'IV'), reason: '약한 분야 · DP', reasonType: 'weak_area' },
  { problemId: '14503', displayNo: '14503', title: '로봇 청소기', tier: tier('gold', 'V'), reason: '이어 풀기', reasonType: 'continue' },
  { problemId: '21610', displayNo: '21610', title: '마법사 상어와 비바라기', tier: tier('platinum', 'V'), reason: '비슷한 난이도', reasonType: 'similar_level' },
  { problemId: '17143', displayNo: '17143', title: '낚시왕', tier: tier('platinum', 'III'), reason: '시뮬레이션 추천', reasonType: 'category_pick' },
]

// 내 주변 순위(±2) — 랭킹 테이블 2~6위와 일치
export const NEARBY: NearbyRankingEntry[] = [
  { rank: 2, handle: 'park_master', tier: tier('diamond', 'III'), weeklyDelta: -1, isMe: false },
  { rank: 3, handle: 'kim_dev', tier: tier('diamond', 'IV'), weeklyDelta: 1, isMe: false },
  { rank: 4, handle: 'algo_lover', tier: tier('platinum', 'II'), weeklyDelta: 2, isMe: true },
  { rank: 5, handle: 'cs_student', tier: tier('platinum', 'III'), weeklyDelta: -2, isMe: false },
  { rank: 6, handle: 'java_kim', tier: tier('platinum', 'IV'), weeklyDelta: 5, isMe: false },
]

export const NOTICES: Notice[] = [
  { id: 3, tag: '공지', title: 'Season 2 시작 · 시즌 문제 15개 공개', publishedAt: '2026-07-01T00:00:00+09:00', highlight: true },
  { id: 2, tag: '공지', title: '채점 서버 점검 안내 (5/30 02:00~04:00)', publishedAt: daysAgo(4), highlight: false },
  { id: 1, tag: '업데이트', title: 'Java 17 지원 추가', publishedAt: daysAgo(7), highlight: false },
]

// ── 잔디 생성 (와이어프레임의 sin 기반 의사난수 이관) ────────

export function generateActivity(
  weeks: number,
  seedOffset: number,
  thresholds: [number, number, number, number],
  activeDays: number,
  avgPerDay: number,
): ActivityCalendar {
  const days: ActivityDay[] = []
  const total = weeks * 7
  const today = new Date()
  for (let i = 0; i < total; i++) {
    const seed = i + seedOffset
    const r = Math.sin(seed * 12.9898) * 43758.5453
    const v = r - Math.floor(r)
    let level: ActivityDay['level']
    if (v < thresholds[0]) level = 0
    else if (v < thresholds[1]) level = 1
    else if (v < thresholds[2]) level = 2
    else if (v < thresholds[3]) level = 3
    else level = 4
    const d = new Date(today.getTime() - (total - 1 - i) * DAY)
    days.push({
      date: d.toISOString().slice(0, 10),
      count: level === 0 ? 0 : level,
      level,
    })
  }
  return { days, activeDays, avgPerDay }
}

export const SEASON_ACTIVITY = generateActivity(12, 100, [0.35, 0.6, 0.82, 0.94], 58, 1.4)
export const YEAR_ACTIVITY = generateActivity(52, 0, [0.5, 0.75, 0.9, 0.97], 342, 1.2)

// ── 채점 현황 (시드) ─────────────────────────────────────────

export const SEED_SUBMISSIONS: SubmissionSummary[] = [
  { submissionId: 87123412, user: { handle: 'algo_lover' }, problem: { problemId: '21609', displayNo: '21609', title: '상어 중학교' }, status: 'accepted', progress: null, timeMs: 312, memoryKb: 24432, language: 'java11', codeBytes: 4231, submittedAt: minutesAgo(2) },
  { submissionId: 87123411, user: { handle: 'newbie01' }, problem: { problemId: '1000', displayNo: '1000', title: 'A+B' }, status: 'accepted', progress: null, timeMs: 76, memoryKb: 14216, language: 'python3', codeBytes: 87, submittedAt: minutesAgo(3) },
  { submissionId: 87123410, user: { handle: 'cs_student' }, problem: { problemId: '1753', displayNo: '1753', title: '최단경로' }, status: 'time_limit', progress: null, timeMs: 1000, memoryKb: 35221, language: 'python3', codeBytes: 1422, submittedAt: minutesAgo(5) },
  { submissionId: 87123409, user: { handle: 'kim_dev' }, problem: { problemId: '11657', displayNo: '11657', title: '타임머신' }, status: 'wrong_answer', progress: null, timeMs: 192, memoryKb: 18221, language: 'cpp17', codeBytes: 921, submittedAt: minutesAgo(8) },
  { submissionId: 87123408, user: { handle: 'algo_lover' }, problem: { problemId: '21609', displayNo: '21609', title: '상어 중학교' }, status: 'judging', progress: 89, timeMs: null, memoryKb: null, language: 'java11', codeBytes: 4231, submittedAt: minutesAgo(12) },
  { submissionId: 87123407, user: { handle: 'park_test' }, problem: { problemId: '1149', displayNo: '1149', title: 'RGB거리' }, status: 'accepted', progress: null, timeMs: 132, memoryKb: 17221, language: 'cpp17', codeBytes: 612, submittedAt: minutesAgo(14) },
  { submissionId: 87123406, user: { handle: 'java_kim' }, problem: { problemId: '1932', displayNo: '1932', title: '정수 삼각형' }, status: 'runtime_error', progress: null, timeMs: 88, memoryKb: 16221, language: 'java11', codeBytes: 833, submittedAt: minutesAgo(16) },
]

// ── 랭킹 ─────────────────────────────────────────────────────

export const RANKING: RankingEntry[] = [
  { rank: 1, handle: 'algo_god', tier: tier('diamond', 'I'), score: 3201, solvedCount: 412, lastActiveAt: minutesAgo(5) },
  { rank: 2, handle: 'park_master', tier: tier('diamond', 'III'), score: 3098, solvedCount: 388, lastActiveAt: minutesAgo(12) },
  { rank: 3, handle: 'kim_dev', tier: tier('diamond', 'IV'), score: 2912, solvedCount: 351, lastActiveAt: minutesAgo(3) },
  { rank: 4, handle: 'algo_lover', tier: tier('platinum', 'II'), score: 2433, solvedCount: 287, lastActiveAt: hoursAgo(1) },
  { rank: 5, handle: 'cs_student', tier: tier('platinum', 'III'), score: 2298, solvedCount: 263, lastActiveAt: minutesAgo(2) },
  { rank: 6, handle: 'java_kim', tier: tier('platinum', 'IV'), score: 2102, solvedCount: 244, lastActiveAt: minutesAgo(30) },
  { rank: 7, handle: 'newbie01', tier: tier('gold', 'I'), score: 1922, solvedCount: 188, lastActiveAt: hoursAgo(5) },
  { rank: 8, handle: 'park_test', tier: tier('gold', 'II'), score: 1788, solvedCount: 172, lastActiveAt: hoursAgo(8) },
  { rank: 9, handle: 'lee_solver', tier: tier('gold', 'III'), score: 1612, solvedCount: 156, lastActiveAt: daysAgo(1) },
  { rank: 10, handle: 'choi_kim', tier: tier('gold', 'IV'), score: 1421, solvedCount: 142, lastActiveAt: hoursAgo(12) },
]

// 친구 스코프 (목): 홈 '내 주변'과 별개로 팔로우 관계 기준
export const FRIENDS_RANKING: RankingEntry[] = [
  RANKING[3], // algo_lover (나)
  { rank: 312, handle: 'park_dev', tier: tier('platinum', 'I'), score: 1102, solvedCount: 121, lastActiveAt: hoursAgo(2) },
  { rank: 580, handle: 'algo_friend', tier: tier('platinum', 'I'), score: 988, solvedCount: 102, lastActiveAt: hoursAgo(6) },
  { rank: 1456, handle: 'study_kim', tier: tier('silver', 'III'), score: 388, solvedCount: 41, lastActiveAt: daysAgo(2) },
  { rank: 1822, handle: 'newbie_lee', tier: tier('silver', 'IV'), score: 297, solvedCount: 33, lastActiveAt: daysAgo(3) },
]

// ── 칭호 ─────────────────────────────────────────────────────

export const TITLES: UserTitle[] = [
  { id: 's1_clear', name: 'S1 시즌 클리어', description: '시즌 1 문제 전부 클리어', colorKey: 'platinum', owned: true, fromSeason: 1, expired: false },
  { id: 's1_diamond', name: 'S1 다이아', description: '시즌 1 다이아 티어 도달', colorKey: 'diamond', owned: true, fromSeason: 1, expired: false },
  { id: 's1_100', name: 'S1 100문제', description: '시즌 1 중 100문제 풀이', colorKey: 'bronze', owned: true, fromSeason: 1, expired: false },
  { id: 's0_beta', name: 'S0 베타 테스터', description: '베타 시즌 참여자', colorKey: 'blue', owned: true, fromSeason: 0, expired: false },
  { id: 's2_first', name: 'S2 첫 발걸음', description: '시즌 2 문제 1개 클리어', colorKey: 'silver', owned: true, fromSeason: 2, expired: false },
  { id: 'streak_30', name: '30일 연속', description: '30일 연속 활동', colorKey: 'green', owned: true, fromSeason: null, expired: false },
  { id: 's2_champion', name: 'S2 챔피언', description: '시즌 2 종료 시 1위', colorKey: 'gold', owned: false, fromSeason: 2, expired: false },
  { id: 's2_diamond', name: 'S2 다이아', description: '시즌 2 다이아 티어 도달', colorKey: 'diamond', owned: false, fromSeason: 2, expired: false },
  { id: 's2_clear', name: 'S2 시즌 클리어', description: '시즌 2 문제 전부 클리어', colorKey: 'platinum', owned: false, fromSeason: 2, expired: false },
  { id: 's2_100', name: 'S2 100문제', description: '시즌 2 중 100문제 풀이', colorKey: 'bronze', owned: false, fromSeason: 2, expired: false },
  { id: 'streak_100', name: '100일 연속', description: '100일 연속 활동', colorKey: 'green', owned: false, fromSeason: null, expired: false },
  { id: 's1_champion', name: 'S1 챔피언', description: '시즌 1 종료 시 1위 (만료됨)', colorKey: 'gold', owned: false, fromSeason: 1, expired: true },
]

// ── 시즌 리워드/이전 시즌 ────────────────────────────────────

export const SEASON_REWARDS: SeasonReward[] = [
  { id: 's2_champion', name: 'S2 챔피언', colorKey: 'gold', condition: '시즌 종료 시 1위', achieved: false, progressText: '진행중 (4위)' },
  { id: 's2_diamond', name: 'S2 다이아', colorKey: 'diamond', condition: '시즌 다이아 티어 도달', achieved: false, progressText: '진행중 (플래티넘 II)' },
  { id: 's2_clear', name: 'S2 시즌 클리어', colorKey: 'platinum', condition: '시즌 문제 15개 모두 클리어', achieved: false, progressText: '진행중 (7/15)' },
  { id: 's2_first', name: 'S2 첫 발걸음', colorKey: 'silver', condition: '시즌 문제 1개 클리어', achieved: true, progressText: '달성' },
  { id: 's2_100', name: 'S2 100문제', colorKey: 'bronze', condition: '시즌 중 100문제 풀이', achieved: false, progressText: '진행중 (47/100)' },
]

export const PAST_SEASONS: PastSeasonRow[] = [
  { id: 1, name: 'Season 1', periodText: '4/1 ~ 6/30', champion: { handle: 'algo_god', tier: tier('diamond', 'II') } },
  { id: 0, name: 'Season 0', periodText: '베타 시즌', champion: { handle: 'park_master', tier: tier('diamond', 'I') } },
]

// ── 토론 ─────────────────────────────────────────────────────

export const DISCUSSION_POSTS: DiscussionPost[] = [
  { id: 6, category: 'code_review', title: 'O(N²) 풀이 공유합니다 — 시간복잡도 개선 의견 받아요', author: { handle: 'algo_lover', tierName: 'platinum' }, commentCount: 12, voteCount: 24, createdAt: hoursAgo(2) },
  { id: 5, category: 'solution', title: '시뮬레이션 + BFS 조합으로 풀었습니다', author: { handle: 'park_master', tierName: 'diamond' }, commentCount: 8, voteCount: 41, createdAt: hoursAgo(5) },
  { id: 4, category: 'solution', title: 'BFS 시작점 처리 — 다들 어떻게 푸셨나요?', author: { handle: 'newbie01', tierName: 'silver' }, commentCount: 5, voteCount: 3, createdAt: hoursAgo(8) },
  { id: 3, category: 'code_review', title: 'Java로 풀이 — 가독성 개선 부탁드립니다', author: { handle: 'java_kim', tierName: 'gold' }, commentCount: 6, voteCount: 12, createdAt: hoursAgo(12) },
  { id: 2, category: 'solution', title: 'Python 88ms 풀이 — 최적화 팁', author: { handle: 'cs_student', tierName: 'platinum' }, commentCount: 22, voteCount: 67, createdAt: daysAgo(1) },
  { id: 1, category: 'solution', title: '회전 처리 시 4방향 우선순위 어떻게 잡으시나요?', author: { handle: 'kim_dev', tierName: 'platinum' }, commentCount: 3, voteCount: 7, createdAt: daysAgo(2) },
]

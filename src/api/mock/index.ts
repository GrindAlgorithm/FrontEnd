import { ApiError } from '../http'
import type { ApiClient } from '../client'
import type {
  DiscussionResponse,
  MeResponse,
  ProblemDetail,
  SubmissionSummary,
  UserProfileResponse,
} from '../../types/domain'
import {
  DECAY,
  DISCUSSION_POSTS,
  FRIENDS_RANKING,
  ME,
  MOCK_BODY,
  NEARBY,
  NOTICES,
  PAST_SEASONS,
  RANKING,
  SEASONS,
  SEASON2_PROBLEMS,
  SEASON_ACTIVITY,
  SEASON_PROBLEMS,
  SEASON_REWARDS,
  SEED_SUBMISSIONS,
  TITLES,
  TODAY_PICKS,
  YEAR_ACTIVITY,
  findProblem,
  generateActivity,
  hoursAgo,
  minutesAgo,
  seasonIdOf,
} from './data'

// ─────────────────────────────────────────────────────────────
// 목 API — ApiClient 인터페이스를 메모리 상태로 구현.
// 백엔드 완성 후 .env의 VITE_USE_MOCK=false 로 전환하면 제거 대상.
// ─────────────────────────────────────────────────────────────

const LATENCY_MS = 180

function delay(ms: number = LATENCY_MS): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── 메모리 상태 ──
let loggedIn = true // 데모 편의상 로그인된 상태로 시작
const me: MeResponse = { ...ME }

interface PendingSubmission {
  summary: SubmissionSummary
  pollCount: number
  willAccept: boolean
}
const pending = new Map<number, PendingSubmission>()
let nextSubmissionId = 87123420
const createdSubmissions: SubmissionSummary[] = []

function requireAuth(): void {
  if (!loggedIn) throw new ApiError(401, 'UNAUTHORIZED', '로그인이 필요합니다')
}

function problemDetailOf(problemId: string): ProblemDetail {
  const p = findProblem(problemId)
  if (!p) throw new ApiError(404, 'PROBLEM_NOT_FOUND', `문제를 찾을 수 없습니다: ${problemId}`)
  const sid = seasonIdOf(problemId)
  const my =
    p.myStatus === 'wip'
      ? { status: p.myStatus, attemptCount: 2, lastTriedAt: hoursAgo(3) }
      : p.myStatus === 'cleared'
        ? { status: p.myStatus, attemptCount: 3, lastTriedAt: hoursAgo(2) }
        : { status: p.myStatus, attemptCount: 0, lastTriedAt: null }
  return {
    problemId: p.problemId,
    displayNo: p.displayNo,
    title: p.title,
    tier: p.tier,
    tags: p.tags,
    expectedComplexity: 'O(N⁴) 이내',
    timeLimitSec: 1,
    memoryLimitMb: 512,
    stats: {
      submissionCount: 8432,
      acceptedCount: 2791,
      solverCount: 2113,
      acceptanceRate: p.acceptanceRate,
    },
    points: sid != null ? p.points : null,
    seasonId: sid,
    discussionCount: 234,
    my,
  }
}

export const mockApi: ApiClient = {
  // ── 인증 ──
  async getMe() {
    await delay()
    requireAuth()
    return { ...me }
  },

  async login(req) {
    await delay(300)
    if (!req.email || !req.password) {
      throw new ApiError(400, 'INVALID_CREDENTIALS', '이메일과 비밀번호를 입력하세요')
    }
    loggedIn = true
    return { ...me }
  },

  async logout() {
    await delay(100)
    loggedIn = false
  },

  // ── 홈 ──
  async getDashboard() {
    await delay()
    requireAuth()
    const solvedCount = SEASON2_PROBLEMS.filter(p => p.myStatus === 'cleared').length
    const next = SEASON2_PROBLEMS.find(p => p.myStatus !== 'cleared')
    return {
      decay: DECAY,
      todayPicks: TODAY_PICKS,
      nearbyRanking: NEARBY,
      season: {
        seasonId: 2,
        name: 'Season 2',
        startDate: '2026-07-01',
        endDate: '2026-09-30',
        dDay: 72,
        progressRatio: 0.22,
        solvedCount,
        totalCount: SEASON2_PROBLEMS.length,
        nextProblemId: next ? next.problemId : null,
      },
      weekly: { solvedCount: 7, scoreGained: 128, streakDays: 14, accuracyRate: 52.3 },
      notices: NOTICES,
      seasonActivity: SEASON_ACTIVITY,
    }
  },

  // ── 시즌/문제 ──
  async getSeasons() {
    await delay()
    return SEASONS.map(s => ({ ...s }))
  },

  async getSeasonProblems(seasonId) {
    await delay()
    const problems = SEASON_PROBLEMS[seasonId]
    if (!problems) throw new ApiError(404, 'SEASON_NOT_FOUND', `시즌이 없습니다: ${seasonId}`)
    return problems.map(p => ({ ...p }))
  },

  async getCurrentSeasonDetail() {
    await delay()
    const season = SEASONS.find(s => s.status === 'current')!
    return {
      season: { ...season },
      progressRatio: 0.22,
      problems: SEASON2_PROBLEMS.map(p => ({ ...p })),
      rewards: SEASON_REWARDS,
      pastSeasons: PAST_SEASONS,
    }
  },

  async getProblem(problemId) {
    await delay()
    return problemDetailOf(problemId)
  },

  // ── IDE ──
  async openProblem(problemId) {
    await delay(250)
    requireAuth()
    const problem = problemDetailOf(problemId)
    return {
      solveSessionId: `sess-${problemId}-${Date.now()}`,
      openedAt: new Date().toISOString(),
      problem,
      body: MOCK_BODY,
    }
  },

  async runCode(req) {
    await delay(700) // 채점 서버 왕복 흉내
    requireAuth()
    if (!req.stdin.trim()) {
      return { status: 'ok', stdout: '', stderr: null, timeMs: 12, memoryKb: 9216, exitCode: 0 }
    }
    return { status: 'ok', stdout: '50', stderr: null, timeMs: 232, memoryKb: 24432, exitCode: 0 }
  },

  async submit(req) {
    await delay(200)
    requireAuth()
    const p = findProblem(req.problemId)
    if (!p) throw new ApiError(404, 'PROBLEM_NOT_FOUND', `문제를 찾을 수 없습니다: ${req.problemId}`)
    const submissionId = nextSubmissionId++
    const summary: SubmissionSummary = {
      submissionId,
      user: { handle: me.handle },
      problem: { problemId: p.problemId, displayNo: p.displayNo, title: p.title },
      status: 'queued',
      progress: 0,
      timeMs: null,
      memoryKb: null,
      language: req.language,
      codeBytes: new Blob([req.sourceCode]).size,
      submittedAt: new Date().toISOString(),
    }
    // 데모 규칙: 코드를 한 글자라도 고쳤으면 정답, 스타터 그대로면 오답
    const edited = req.sourceCode.includes('여기에 코드를 작성하세요') === false
    pending.set(submissionId, { summary, pollCount: 0, willAccept: edited })
    createdSubmissions.unshift(summary)
    return { submissionId }
  },

  async getSubmission(submissionId) {
    await delay(450) // 폴링 주기 흉내
    const p = pending.get(submissionId)
    if (!p) {
      const seeded = SEED_SUBMISSIONS.find(s => s.submissionId === submissionId)
      if (seeded) return { ...seeded }
      throw new ApiError(404, 'SUBMISSION_NOT_FOUND', `제출이 없습니다: ${submissionId}`)
    }
    p.pollCount += 1
    const s = p.summary
    if (p.pollCount === 1) {
      s.status = 'judging'
      s.progress = 34
    } else if (p.pollCount === 2) {
      s.status = 'judging'
      s.progress = 71
    } else if (s.status === 'judging') {
      // 종결
      if (p.willAccept) {
        s.status = 'accepted'
        s.timeMs = 232
        s.memoryKb = 24432
        // 문제 상태 갱신 → 홈/문제 목록/시즌/토론 화면에 반영
        const prob = findProblem(s.problem.problemId)
        if (prob) prob.myStatus = 'cleared'
      } else {
        s.status = 'wrong_answer'
        s.timeMs = 84
        s.memoryKb = 14216
        const prob = findProblem(s.problem.problemId)
        if (prob && prob.myStatus === 'untried') prob.myStatus = 'wip'
      }
      s.progress = null
    }
    return { ...s }
  },

  async listSubmissions(params) {
    await delay()
    let rows = [...createdSubmissions, ...SEED_SUBMISSIONS]
    if (params?.problemId) rows = rows.filter(s => s.problem.problemId === params.problemId)
    if (params?.mine) rows = rows.filter(s => s.user.handle === me.handle)
    return rows.map(s => ({ ...s }))
  },

  // ── 랭킹 ──
  async getRanking(scope) {
    await delay()
    const season = SEASONS.find(s => s.status === 'current')!
    const entries = scope === 'friends' ? FRIENDS_RANKING : RANKING
    const myEntry = entries.find(e => e.handle === me.handle) ?? RANKING[3]
    return {
      season: { ...season },
      entries: entries.map(e => ({ ...e })),
      myEntry: { ...myEntry },
    }
  },

  // ── 프로필/칭호 ──
  async getUserProfile(handle) {
    await delay()
    if (handle === me.handle) {
      const profile: UserProfileResponse = {
        handle: me.handle,
        joinedAt: me.joinedAt,
        isMe: true,
        seasonTier: me.seasonTier,
        seasonScore: me.seasonScore,
        seasonRank: me.seasonRank,
        decay: DECAY,
        stats: {
          solvedCount: 142,
          submissionCount: 384,
          accuracyRate: 49.8,
          avgAttempts: 2.7,
          streakDays: 14,
          longestStreakDays: 32,
        },
        titles: TITLES,
        selectedTitleId: me.selectedTitleId,
        activity: YEAR_ACTIVITY,
        recentSolved: [
          { problemId: '21609', displayNo: '21609', title: '상어 중학교', tier: { name: 'platinum', level: 'V' }, solvedAt: hoursAgo(2) },
          { problemId: '1753', displayNo: '1753', title: '최단경로', tier: { name: 'gold', level: 'IV' }, solvedAt: hoursAgo(26) },
          { problemId: '11657', displayNo: '11657', title: '타임머신', tier: { name: 'gold', level: 'IV' }, solvedAt: hoursAgo(49) },
          { problemId: '1932', displayNo: '1932', title: '정수 삼각형', tier: { name: 'silver', level: 'I' }, solvedAt: hoursAgo(74) },
        ],
        recentSubmissions: [
          { submissionId: 87123412, problemId: '21609', displayNo: '21609', title: '상어 중학교', status: 'accepted', submittedAt: hoursAgo(2) },
          { submissionId: 87123405, problemId: '21609', displayNo: '21609', title: '상어 중학교', status: 'wrong_answer', submittedAt: hoursAgo(2) },
          { submissionId: 87123390, problemId: '1753', displayNo: '1753', title: '최단경로', status: 'accepted', submittedAt: hoursAgo(26) },
          { submissionId: 87123371, problemId: '11657', displayNo: '11657', title: '타임머신', status: 'time_limit', submittedAt: hoursAgo(49) },
        ],
      }
      return profile
    }
    // 타인 프로필 (목: 랭킹 데이터에서 유추)
    const entry = [...RANKING, ...FRIENDS_RANKING].find(e => e.handle === handle)
    if (!entry) throw new ApiError(404, 'USER_NOT_FOUND', `사용자가 없습니다: ${handle}`)
    return {
      handle,
      joinedAt: '2026-01-15T09:00:00+09:00',
      isMe: false,
      seasonTier: entry.tier,
      seasonScore: entry.score,
      seasonRank: entry.rank,
      decay: null,
      stats: {
        solvedCount: entry.solvedCount,
        submissionCount: entry.solvedCount * 3,
        accuracyRate: 44.2,
        avgAttempts: 2.9,
        streakDays: 6,
        longestStreakDays: 21,
      },
      titles: TITLES.filter(t => t.owned).slice(0, 3),
      selectedTitleId: 's1_clear',
      activity: generateActivity(52, 7, [0.55, 0.78, 0.92, 0.98], 218, 0.8),
      recentSolved: [
        { problemId: '17143', displayNo: '17143', title: '낚시왕', tier: { name: 'platinum', level: 'III' }, solvedAt: hoursAgo(4) },
        { problemId: '1167', displayNo: '1167', title: '트리의 지름', tier: { name: 'gold', level: 'II' }, solvedAt: hoursAgo(30) },
      ],
      recentSubmissions: [
        { submissionId: 87123399, problemId: '17143', displayNo: '17143', title: '낚시왕', status: 'accepted', submittedAt: hoursAgo(4) },
        { submissionId: 87123397, problemId: '17143', displayNo: '17143', title: '낚시왕', status: 'time_limit', submittedAt: hoursAgo(5) },
      ],
    }
  },

  async updateMyTitle(titleId) {
    await delay(120)
    requireAuth()
    me.selectedTitleId = titleId
  },

  // ── 토론 ──
  async getDiscussions(problemId): Promise<DiscussionResponse> {
    await delay()
    requireAuth()
    const p = findProblem(problemId)
    if (!p) throw new ApiError(404, 'PROBLEM_NOT_FOUND', `문제를 찾을 수 없습니다: ${problemId}`)
    const stats = { postCount: 234, publicSolutionCount: 89, codeReviewCount: 156 }
    if (p.myStatus !== 'cleared') {
      return { accessible: false, stats }
    }
    return {
      accessible: true,
      firstSolvedAt: '2025-11-20T14:00:00+09:00',
      stats,
      posts: DISCUSSION_POSTS,
    }
  },
}

// 시드 제출 중 '채점 중 (89%)' 건도 폴링 대상이 될 수 있게 등록
const seededJudging = SEED_SUBMISSIONS.find(s => s.status === 'judging')
if (seededJudging) {
  pending.set(seededJudging.submissionId, {
    summary: { ...seededJudging, submittedAt: minutesAgo(12) },
    pollCount: 2,
    willAccept: true,
  })
}

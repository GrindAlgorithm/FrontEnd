import type {
  DashboardResponse,
  DiscussionCreateRequest,
  DiscussionPostDetail,
  DiscussionResponse,
  LanguageInfo,
  MeResponse,
  NoticeDetail,
  NoticeRequest,
  OpenProblemResponse,
  ProblemDetail,
  ProblemSummary,
  RankingResponse,
  RankingScope,
  RunRequest,
  RunResult,
  SeasonDetailResponse,
  SeasonSummary,
  SignupRequest,
  SolveEventBatch,
  SubmissionSummary,
  SubmitRequest,
  SubmitResponse,
  UserProfileResponse,
} from '../types/domain'

/**
 * 프론트 전 화면이 의존하는 API 클라이언트 계약.
 * 실제 구현(real.ts)과 목 구현(mock/)이 이 인터페이스를 공유한다.
 * 각 메서드 ↔ REST 엔드포인트 매핑은 docs/BACKEND_INTEGRATION.md 참고.
 */
export interface ApiClient {
  // ── 인증 ──
  getMe(): Promise<MeResponse>
  login(req: { email: string; password: string }): Promise<MeResponse>
  signup(req: SignupRequest): Promise<MeResponse>
  logout(): Promise<void>

  // ── 홈 ──
  getDashboard(): Promise<DashboardResponse>

  // ── 시즌/문제 ──
  getSeasons(): Promise<SeasonSummary[]>
  getSeason(seasonId: number): Promise<SeasonSummary>
  getSeasonProblems(seasonId: number): Promise<ProblemSummary[]>
  getCurrentSeasonDetail(): Promise<SeasonDetailResponse>
  getProblem(problemId: string): Promise<ProblemDetail>

  // ── 지원 언어 (요건 24) ──
  getLanguages(): Promise<LanguageInfo[]>

  // ── IDE: 본문 열람(시점 기록)/실행/제출 ──
  openProblem(problemId: string): Promise<OpenProblemResponse>
  runCode(req: RunRequest): Promise<RunResult>
  submit(req: SubmitRequest): Promise<SubmitResponse>
  getSubmission(submissionId: number): Promise<SubmissionSummary>
  listSubmissions(params?: {
    seasonId?: number
    problemId?: string
    mine?: boolean
  }): Promise<SubmissionSummary[]>

  // ── 부정행위 신호 배치 (A3) ──
  /** 실패해도 화면 흐름에 영향을 주지 않는다 — 호출부가 조용히 재시도만 한다 */
  reportSolveEvents(batch: SolveEventBatch): Promise<void>

  // ── 랭킹 ──
  getRanking(scope: RankingScope): Promise<RankingResponse>

  // ── 프로필/칭호 ──
  getUserProfile(handle: string): Promise<UserProfileResponse>
  updateMyTitle(titleId: string | null): Promise<void>

  // ── 토론 ──
  getDiscussions(problemId: string): Promise<DiscussionResponse>
  getDiscussionPost(problemId: string, postId: number): Promise<DiscussionPostDetail>
  createDiscussionPost(problemId: string, req: DiscussionCreateRequest): Promise<DiscussionPostDetail>

  // ── 공지 상세 (본문 포함) ──
  getNotice(id: number): Promise<NoticeDetail>

  // ── 관리자: 공지 CRUD (ADMIN 전용, /admin/notices) ──
  adminListNotices(): Promise<NoticeDetail[]>
  adminCreateNotice(req: NoticeRequest): Promise<NoticeDetail>
  adminUpdateNotice(id: number, req: NoticeRequest): Promise<NoticeDetail>
  adminDeleteNotice(id: number): Promise<void>
}

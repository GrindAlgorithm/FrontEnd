# GrindAlgorithm 프론트 ↔ 백엔드 연동 문서

> 대상: 백엔드(Spring Boot · Java · JPA/Hibernate · MariaDB · Judge0) 개발자
> 작성 기준: 와이어프레임 확정 9화면(`algo_kr_overview.jsx`) + 프로젝트 스펙 PDF(2026-06-11)
> 프론트 스택: **Vite + React 18 + TypeScript SPA** (Next.js 아님 — 스펙 C2 확정)

---

## 0. 한눈에 보기

```
브라우저 ──(세션 쿠키)──> [Vite Dev 5173] ──proxy──> [Spring Boot 8080]
                                                         ├── /api/v1/**        REST JSON
                                                         ├── /oauth2/**        Spring Security OAuth2
                                                         └──> Judge0 (내부망)   ← 클라이언트 직접 노출 금지 (B3)
```

- 프론트 코드의 **단일 계약 출처**:
  - 타입(응답 스키마): `src/types/domain.ts`
  - 엔드포인트(경로/메서드): `src/api/real.ts` + 인터페이스 `src/api/client.ts`
  - 이 문서와 위 파일은 1:1 — 한쪽을 바꾸면 반드시 같이 갱신
- API 모드(`.env`의 `VITE_USE_MOCK`): `true`=전부 목 / `hybrid`=백엔드 구현분(현재
  §2.5 시즌, §2.6 시즌 문제)만 실서버, 나머지 목 / `false`=전부 실서버.
  백엔드 엔드포인트가 추가되면 `src/api/index.ts`의 `hybridApi`에 한 줄씩 옮긴다
- dev 프록시(`vite.config.ts`): `/api`, `/oauth2`, `/login/oauth2` → `http://localhost:8080`

### 화면 ↔ 엔드포인트 매핑

| # | 화면 (라우트) | 사용하는 엔드포인트 |
|---|---|---|
| 1 | 홈 `/` | `GET /me`, `GET /dashboard` |
| 2 | 문제 목록 `/problems` | `GET /seasons`, `GET /seasons/{id}/problems` |
| 2-b | 채점 현황(내부 탭) `/problems?tab=submissions` | `GET /submissions` |
| 3 | 문제 상세 `/problems/{problemId}` | `GET /problems/{problemId}`, (내 제출 탭) `GET /submissions?problemId=&mine=true` |
| 4 | IDE `/problems/{problemId}/solve` | `POST /problems/{problemId}/open`, `POST /runs`, `POST /submissions`, `GET /submissions/{id}` |
| 5 | 문제 토론 `/problems/{problemId}/discussion` | `GET /problems/{problemId}/discussions` |
| 6 | 랭킹 `/ranking` | `GET /rankings?scope=` |
| 7 | 시즌 `/season` | `GET /seasons/current` |
| 8 | 유저 프로필 `/users/{handle}` | `GET /users/{handle}`, `PUT /me/title` |
| 9 | 로그인 `/login` | `POST /auth/login`, OAuth2 리다이렉트 |

---

## 1. 공통 규약

### 1.1 기본

| 항목 | 규약 |
|---|---|
| Base URL | `/api/v1` |
| 직렬화 | JSON, **camelCase** 필드 |
| 시각 | ISO 8601 문자열 (`2026-07-01T00:00:00+09:00`). 상대 시간("5분 전") 변환은 프론트 책임 |
| 날짜 | `YYYY-MM-DD` |
| 단위 | 시간 `ms`, 메모리 `KB`(채점 결과)/`MB`(제한), 코드 크기 `Byte`, 비율 `% 0~100 숫자` |
| 빈 값 | 필드 생략 대신 `null` 사용 (프론트 타입이 `| null`로 모델링됨) |

### 1.2 인증 — 세션 쿠키

- 프론트의 모든 요청은 `credentials: 'include'` 로 나간다 → **세션 쿠키(JSESSIONID) 기반**을 가정
- dev에서는 Vite 프록시로 same-origin이라 CORS 불필요. 분리 배포 시
  `Access-Control-Allow-Origin: <front origin>` + `Allow-Credentials: true` 필요
- 미인증 상태에서 보호 API 호출 시 **`401` + 에러 봉투** → 프론트가 `/login`으로 보냄
- JWT로 가는 경우: `Authorization` 헤더 부착 지점이 `src/api/http.ts` 한 곳이라 전환 비용 낮음 (협의)

### 1.3 OAuth2 (GitHub + Google) — Key Decision

Spring Security OAuth2 Client 표준 경로를 그대로 사용한다:

```
[프론트] 로그인 버튼 → window.location.href = /oauth2/authorization/github   (전체 리다이렉트)
[백엔드] GitHub 인증 → /login/oauth2/code/github 콜백 → 세션 생성
[백엔드] 성공 후 프론트 루트("/")로 302 리다이렉트
[프론트] 부팅 시 GET /me 로 세션 확인 → 로그인 상태 복원
```

- 신규 유저는 OAuth 성공 시 **자동 가입** (스펙: "가입 마찰↓")
- 자체 이메일 로그인은 `POST /auth/login` (아래 §2.2). 이메일 **가입+인증 플로우는 프론트 미구현** — 스펙상 🟡(회의 필요)이라 로그인 폼만 만들어 둠

### 1.4 응답/에러 봉투

**공통 응답 봉투 (백엔드 실제 구현 — `util/ResponseResult.java`):**
백엔드는 성공/실패 모두 HTTP 200 + 아래 봉투로 내려준다. 본 문서 §2의 JSON 예시는
전부 `result` 안에 들어가는 페이로드 기준이다.

```json
{ "resultCode": "0000", "result": { "...페이로드..." }, "response": { "...미사용..." } }
```

- `resultCode`: `"0000"` 성공, `"9999"` 실패 (`ResultCodeEnum`)
- 프론트 `src/api/http.ts`가 봉투를 벗겨 `result`만 반환하고, `resultCode !== "0000"`이면
  `ApiError(code=resultCode)`를 던진다 — 화면 코드는 봉투를 모른다
- 봉투 없는 응답(스프링 시큐리티 401/403, 게이트웨이 에러 등)은 그대로 통과/에러 처리

**에러 봉투(계약상 목표)** — 4xx/5xx 응답 본문:

```json
{ "error": { "code": "DISCUSSION_LOCKED", "message": "문제를 풀어야 토론에 참여할 수 있습니다" } }
```

> ⚠ 현 백엔드는 미인증 시 401 대신 **403**(Spring Security 기본 EntryPoint)을 반환한다.
> 프론트는 401/403 모두 비로그인으로 처리하도록 대응해 둠 (`AuthContext`).

| HTTP | code (예) | 사용처 |
|---|---|---|
| 400 | `INVALID_CREDENTIALS`, `VALIDATION_FAILED` | 입력 오류 |
| 401 | `UNAUTHORIZED` | 세션 없음/만료 → 프론트가 로그인 화면으로 |
| 403 | `DISCUSSION_LOCKED` | 미해결 유저의 토론 접근(단, 토론은 200+`accessible:false` 방식 권장 — §2.14) |
| 404 | `PROBLEM_NOT_FOUND`, `SEASON_NOT_FOUND`, `USER_NOT_FOUND`, `SUBMISSION_NOT_FOUND` | 리소스 없음 |
| 409 | `ALREADY_JUDGING` (제안) | 동일 문제 중복 제출 제한 정책 시 |
| 429 | `RATE_LIMITED` (제안) | 실행/제출 남용 방지 |

`message`는 **유저에게 그대로 노출 가능한 한국어**로.

### 1.5 식별자

| 식별자 | 타입 | 비고 |
|---|---|---|
| `problemId` | string | URL 키. 시즌 문제 `"S2-08"`, 일반 문제 `"21609"` 형태. 내부 PK와 분리 권장 (`displayNo`와 현재 동일값) |
| `handle` | string | 유저 닉네임이자 URL 키 (`/users/{handle}`) |
| `submissionId` | number | 채점 번호 (화면 노출) |
| `seasonId` | number | 0=베타, 1, 2, … |
| `titleId` | string | 칭호 키 (`"s1_clear"` 등) |
| `solveSessionId` | string | 본문 열람 세션 (§2.8) |

### 1.6 공용 타입 (응답에서 반복 사용)

```ts
// 티어 — 영구 티어 없음(B1 확정). 항상 "시즌 티어"
TierRank = { name: 'bronze'|'silver'|'gold'|'platinum'|'diamond', level: 'I'|'II'|'III'|'IV'|'V' }
// ⚠ 스펙 A1에 "챌린저(100명 한정)" 언급 — 확정 시 name에 'challenger' 추가 필요 (프론트 대응 필요, §5)

ProblemStatus(내 진행) = 'cleared' | 'wip' | 'untried'

SubmissionStatus = 'queued' | 'judging' | 'accepted' | 'wrong_answer'
                 | 'time_limit' | 'memory_limit' | 'runtime_error' | 'compile_error'
// 표시 문구("맞았습니다!!", "시간 초과" 등)는 프론트가 매핑 — 백엔드는 enum만

LanguageCode = 'java11' | 'python3' | 'cpp17' | 'nodejs'   // Judge0 매핑은 §3
```

---

## 2. 엔드포인트 명세

### 2.1 `GET /me` — 내 정보 (세션 확인)

앱 부팅 시 항상 호출. 401이면 비로그인 처리.

**200**
```json
{
  "handle": "algo_lover",
  "joinedAt": "2025-12-03T09:00:00+09:00",
  "seasonTier": { "name": "platinum", "level": "II" },
  "seasonScore": 2433,
  "seasonRank": 4,
  "selectedTitleId": "s1_clear"
}
```
- `seasonTier: null` 허용 — 시즌 미배치(첫 문제 풀기 전) 유저
- `seasonRank: null` 허용 — 동일

### 2.2 `POST /auth/login` — 자체 이메일 로그인

**요청** `{ "email": "a@b.c", "password": "..." }`
**200** — `GET /me`와 동일 본문 (세션 쿠키 발급)
**400** `INVALID_CREDENTIALS`

### 2.3 `POST /auth/logout`

**204** — 세션 무효화. 본문 없음.

### 2.4 `GET /dashboard` — 홈 화면 통합 응답

홈에 필요한 데이터를 한 번에 내려준다 (요청 1회로 화면 완성).

**200**
```json
{
  "decay": {
    "inactiveDays": 5,
    "daysUntilDrop": 2,
    "fromTier": { "name": "platinum", "level": "II" },
    "toTier": { "name": "platinum", "level": "III" }
  },
  "todayPicks": [
    {
      "problemId": "1167", "displayNo": "1167", "title": "트리의 지름",
      "tier": { "name": "gold", "level": "II" },
      "reason": "티어업 후보", "reasonType": "tier_up"
    }
  ],
  "nearbyRanking": [
    { "rank": 3, "handle": "kim_dev", "tier": { "name": "diamond", "level": "IV" }, "weeklyDelta": 1, "isMe": false },
    { "rank": 4, "handle": "algo_lover", "tier": { "name": "platinum", "level": "II" }, "weeklyDelta": 2, "isMe": true }
  ],
  "season": {
    "seasonId": 2, "name": "Season 2",
    "startDate": "2026-07-01", "endDate": "2026-09-30",
    "dDay": 72, "progressRatio": 0.22,
    "solvedCount": 7, "totalCount": 15,
    "nextProblemId": "S2-08"
  },
  "weekly": { "solvedCount": 7, "scoreGained": 128, "streakDays": 14, "accuracyRate": 52.3 },
  "notices": [
    { "id": 3, "tag": "공지", "title": "Season 2 시작 · 시즌 문제 15개 공개", "publishedAt": "2026-07-01T00:00:00+09:00", "highlight": true }
  ],
  "seasonActivity": {
    "days": [ { "date": "2026-06-10", "count": 2, "level": 2 } ],
    "activeDays": 58, "avgPerDay": 1.4
  }
}
```

필드 노트:
- `decay` — **하락 공식(A1)·트리거가 미확정(추후 개발)**. 구현 전엔 `null` 고정으로 내려도 프론트는 배너를 숨긴다
- `todayPicks[].reasonType` — `'tier_up' | 'weak_area' | 'continue' | 'similar_level' | 'category_pick'`.
  색상 강조용(파랑/빨강). 추천 로직 자체는 Deferred — MVP는 규칙 기반/더미 허용, `reason`은 자유 문구
- `nearbyRanking` — 내 순위 ±2 (총 5행 내외), `isMe` 플래그 필수
- `season.nextProblemId` — "다음 시즌 문제 풀기" 버튼이 IDE로 직행하는 대상. 전부 클리어 시 `null`
- `seasonActivity.days` — **과거→오늘 순서**, 시즌 시작일부터(최대 12주). `level` 0~4는 백엔드가 산정(잔디 강도)
- `notices` — MVP는 별도 공지 CRUD 없이 시드 데이터 허용 (어드민 Deferred B4)

### 2.5 `GET /seasons` — 시즌 목록 (문제 화면 탭)

**200**
```json
[
  { "id": 2, "name": "Season 2", "startDate": "2026-07-01", "endDate": "2026-09-30", "status": "current", "dDay": 72 },
  { "id": 1, "name": "Season 1", "startDate": "2026-04-01", "endDate": "2026-06-30", "status": "past", "dDay": null }
]
```
- `status`: `'current' | 'past' | 'beta'` — 시즌 구조는 S0=베타 / 과거시즌(연습용 영구 보관) / 현재시즌(랭킹 반영)
- 정렬: 최신(현재) 시즌 먼저

### 2.6 `GET /seasons/{seasonId}/problems` — 시즌 문제 목록

**200**
```json
[
  {
    "problemId": "S2-08", "displayNo": "S2-08", "title": "그래프 가중치 처리",
    "tags": ["다익스트라"],
    "tier": { "name": "gold", "level": "IV" },
    "acceptanceRate": 33.1,
    "points": 30,
    "myStatus": "wip"
  }
]
```
- `points` — **난이도별 고정 점수(A1 확정: 절댓값)**. 산정 주체는 백엔드. 프론트는 표시만 하며,
  과거 시즌이면 취소선 처리(점수 무효)는 프론트가 시즌 `status`로 판단
- 현재 점수표(와이어프레임 기준, 백엔드 측 단일 관리 권장):

| 티어 | V | IV | III | II | I |
|---|---|---|---|---|---|
| bronze | 5 | 6 | 7 | 8 | 10 |
| silver | 12 | 14 | 16 | 18 | 22 |
| gold | 25 | 30 | 35 | 42 | 50 |
| platinum | 60 | 70 | 85 | 100 | 120 |
| diamond | 150 | 180 | 220 | 270 | 330 |

- `myStatus` — 로그인 유저 기준 (`cleared`/`wip`/`untried`). 미로그인 허용 시 전부 `untried`

### 2.7 `GET /problems/{problemId}` — 문제 상세 (⚠ 본문 없음)

**부정행위 방지(B2) 핵심 규칙: 이 응답에 본문·예제를 절대 포함하지 않는다.**
본문은 오직 `POST /problems/{id}/open`(IDE 진입)으로만.

**200**
```json
{
  "problemId": "S2-08", "displayNo": "S2-08", "title": "그래프 가중치 처리",
  "tier": { "name": "gold", "level": "IV" },
  "tags": ["다익스트라"],
  "expectedComplexity": "O(N⁴) 이내",
  "timeLimitSec": 1,
  "memoryLimitMb": 512,
  "stats": { "submissionCount": 8432, "acceptedCount": 2791, "solverCount": 2113, "acceptanceRate": 33.1 },
  "points": 30,
  "seasonId": 2,
  "discussionCount": 234,
  "my": { "status": "wip", "attemptCount": 2, "lastTriedAt": "2026-06-11T06:00:00+09:00" }
}
```
- `expectedComplexity` — 노출 허용된 메타(스펙: "메타 + 알고리즘 분류 + 예상 시간복잡도만 노출"). 없으면 `null`
- `points` — 일반(비시즌) 문제면 `null`, `seasonId`도 `null`
- `my.lastTriedAt` — 시도 없으면 `null`

### 2.8 `POST /problems/{problemId}/open` — IDE 진입 = 본문 열람 (★)

**본문 열람 시각 = 풀이 시작 시각**으로 서버에 기록한다(B2 확정).
풀이시간 이상치 분석 등 부정행위 시그널의 기준점.

**요청** 본문 없음
**200**
```json
{
  "solveSessionId": "uuid-or-key",
  "openedAt": "2026-06-11T12:00:00+09:00",
  "problem": { "...": "GET /problems/{id} 와 동일 구조" },
  "body": {
    "description": "상어 중학교에는 ...",
    "inputSpec": "첫째 줄에 N, M이 주어진다...",
    "outputSpec": "획득한 점수의 합을 출력한다.",
    "samples": [ { "input": "5 3\n1 1 1 2 3\n...", "output": "50" } ]
  }
}
```
- `solveSessionId` — 이후 `POST /runs`/`POST /submissions`에 동봉되어 "어느 열람 세션에서 나온 제출인지" 연결
- 같은 유저가 재진입하면: 새 세션 발급 + 기존 기록 유지 권장 (최초 열람 시각이 분석 기준)
- 본문 포맷: MVP는 **plain text** (프론트가 문단 그대로 렌더). 마크다운/이미지 필요해지면 협의
- ⚠ 부정행위 탐지 로직(A3: IP·기기·캠 감독·마우스/키보드 이벤트·복붙 금지 등)은 **운영 기준 미확정**.
  프론트는 현재 **에디터 붙여넣기 차단**만 구현돼 있음. 이벤트 수집 엔드포인트가 정해지면
  (제안: `POST /solve-sessions/{id}/events` 배치) 프론트에 송신 로직 추가 — §5 참고

### 2.9 `POST /runs` — 코드 실행 (제출 아님, 예제 테스트용)

**요청**
```json
{
  "problemId": "S2-08",
  "solveSessionId": "…",
  "language": "java11",
  "sourceCode": "public class Main { … }",
  "stdin": "5 3\n1 1 1 2 3\n…"
}
```
**200** (동기 — Judge0 `wait=true` 권장, 타임아웃 ~10s)
```json
{
  "status": "ok",
  "stdout": "50",
  "stderr": null,
  "timeMs": 232,
  "memoryKb": 24432,
  "exitCode": 0
}
```
- `status`: `'ok' | 'compile_error' | 'runtime_error' | 'time_limit'`
- 채점 아님: 점수/기록 없음. 단 run 횟수도 솔브 세션에 로깅해두면 분석에 유용 (제안)
- 남용 방지 레이트리밋 권장 (`429`)

### 2.10 `POST /submissions` — 제출 (비동기 채점 시작)

**요청** — §2.9에서 `stdin` 제외한 것과 동일
```json
{ "problemId": "S2-08", "solveSessionId": "…", "language": "java11", "sourceCode": "…" }
```
**202 (또는 200)**
```json
{ "submissionId": 87123420 }
```

### 2.11 `GET /submissions/{submissionId}` — 채점 상태 (폴링)

프론트는 종결 상태가 나올 때까지 **약 0.7~1초 간격 폴링**한다.

**200 (채점 중)**
```json
{
  "submissionId": 87123420,
  "user": { "handle": "algo_lover" },
  "problem": { "problemId": "S2-08", "displayNo": "S2-08", "title": "그래프 가중치 처리" },
  "status": "judging",
  "progress": 71,
  "timeMs": null, "memoryKb": null,
  "language": "java11", "codeBytes": 4231,
  "submittedAt": "2026-06-11T12:01:00+09:00"
}
```
**200 (종결)** — `status: "accepted"` 등, `progress: null`, `timeMs`/`memoryKb` 채움

- `progress` — 테스트케이스 진행률(%): `floor(완료 TC / 전체 TC * 100)`. 화면에 "채점 중 (89%)"로 표시
- 종결 상태: `accepted | wrong_answer | time_limit | memory_limit | runtime_error | compile_error`
- **accepted 부수효과**: 문제 `myStatus → cleared`, 시즌 점수 가산(현재 시즌 문제 + 첫 클리어일 때만),
  토론 접근권 해제, 랭킹/대시보드 반영
- 폴링 대신 SSE/WebSocket은 Deferred("채점 결과 상세"와 함께) — MVP는 폴링으로 충분

### 2.12 `GET /submissions` — 채점 현황 목록

쿼리: `problemId`(선택), `mine=true`(선택, 내 것만), (제안) `page`/`size`

| 화면 | 호출 |
|---|---|
| 문제 페이지 "채점 현황" 탭 | `GET /submissions` (전체 공개 피드, 최신순) |
| 문제 상세 "내 제출" 탭 | `GET /submissions?problemId=S2-08&mine=true` |

**200** — §2.11 객체의 배열 (최신순). MVP는 페이징 없이 최근 N(50)건 허용, 페이징 도입 시 협의

### 2.13 `GET /rankings?scope={season|overall|friends}` — 랭킹

**200**
```json
{
  "season": { "id": 2, "name": "Season 2", "startDate": "2026-07-01", "endDate": "2026-09-30", "status": "current", "dDay": 72 },
  "entries": [
    { "rank": 1, "handle": "algo_god", "tier": { "name": "diamond", "level": "I" }, "score": 3201, "solvedCount": 412, "lastActiveAt": "2026-06-11T11:55:00+09:00" }
  ],
  "myEntry": { "rank": 4, "handle": "algo_lover", "tier": { "name": "platinum", "level": "II" }, "score": 2433, "solvedCount": 287, "lastActiveAt": "2026-06-11T11:00:00+09:00" }
}
```
- `scope=season` — 현재 시즌 점수 기준 (기본)
- `scope=overall` — ⚠ **의미 미확정**: 영구 티어가 제거된 상태에서 "전체 랭킹"이 무엇인지(역대 누적 점수? 통산 푼 문제?) 회의 필요. 프론트는 동일 스키마로 표시만 함
- `scope=friends` — 친구/팔로우 기준. **친구 관계 추가·관리 API는 미정**(화면 없음) — 시드/팔로우 기능 협의 필요
- `myEntry` — 목록에 내가 없어도 항상 채워서("내 순위" 행). 비로그인 허용 시 `null`
- MVP는 상위 N(예: 100) + `myEntry`로 충분. 페이징 도입 시 협의

### 2.14 `GET /problems/{problemId}/discussions` — 토론 (정답자 한정)

**403 대신 200 + `accessible` 분기**를 사용한다 — 잠금 화면에도 통계(토론 수 등)를 보여줘야 하기 때문.

**200 (미해결 유저)**
```json
{
  "accessible": false,
  "stats": { "postCount": 234, "publicSolutionCount": 89, "codeReviewCount": 156 }
}
```
**200 (정답자)**
```json
{
  "accessible": true,
  "firstSolvedAt": "2025-11-20T14:00:00+09:00",
  "stats": { "postCount": 234, "publicSolutionCount": 89, "codeReviewCount": 156 },
  "posts": [
    {
      "id": 6, "category": "code_review",
      "title": "O(N²) 풀이 공유합니다 — 시간복잡도 개선 의견 받아요",
      "author": { "handle": "algo_lover", "tierName": "platinum" },
      "commentCount": 12, "voteCount": 24,
      "createdAt": "2026-06-11T10:00:00+09:00"
    }
  ]
}
```
- 접근 판정: **해당 문제 Accepted 이력 보유** 여부
- `category`: `'code_review' | 'solution'` 두 축만 (Out of Scope: 문제별 질문 탭 — 전역 Q&A로 이관, "일반 문제만 Q&A 구현"은 D항목 협의 필요)
- `author.tierName` — 레벨 없이 티어명만 (작성자 옆 색 점 표시용)
- **글 작성/글 상세/댓글은 Deferred** — 프론트도 버튼만 있고 동작 없음. 우선순위 올라오면 `POST /problems/{id}/discussions` 등 협의

### 2.15 `GET /users/{handle}` — 유저 프로필

**200**
```json
{
  "handle": "algo_lover",
  "joinedAt": "2025-12-03T09:00:00+09:00",
  "isMe": true,
  "seasonTier": { "name": "platinum", "level": "II" },
  "seasonScore": 2433,
  "seasonRank": 4,
  "decay": { "inactiveDays": 5, "daysUntilDrop": 2, "fromTier": {"name":"platinum","level":"II"}, "toTier": {"name":"platinum","level":"III"} },
  "stats": { "solvedCount": 142, "submissionCount": 384, "accuracyRate": 49.8, "avgAttempts": 2.7, "streakDays": 14, "longestStreakDays": 32 },
  "titles": [
    { "id": "s1_clear", "name": "S1 시즌 클리어", "description": "시즌 1 문제 전부 클리어", "colorKey": "platinum", "owned": true, "fromSeason": 1, "expired": false }
  ],
  "selectedTitleId": "s1_clear",
  "activity": { "days": [ { "date": "2025-06-15", "count": 1, "level": 1 } ], "activeDays": 342, "avgPerDay": 1.2 },
  "recentSolved": [
    { "problemId": "21609", "displayNo": "21609", "title": "상어 중학교", "tier": {"name":"platinum","level":"V"}, "solvedAt": "2026-06-11T10:00:00+09:00" }
  ],
  "recentSubmissions": [
    { "submissionId": 87123412, "problemId": "21609", "displayNo": "21609", "title": "상어 중학교", "status": "accepted", "submittedAt": "2026-06-11T10:00:00+09:00" }
  ]
}
```
- `isMe` — 요청자 == 프로필 주인. 이 값에 따라 프론트가:
  - `decay` 배너 표시 (본인만 — 타인 응답에선 `decay: null` 권장)
  - 칭호 **선택 UI**(보유/미보유 전체) vs 보유 칭호 나열만
- `titles` — 본인이면 보유+미보유 전체, 타인이면 보유만으로 충분
- `titles[].colorKey`: `'bronze'|'silver'|'gold'|'platinum'|'diamond'|'green'|'blue'` (프론트 색상 키)
- `titles[].expired` — 시즌 종료로 더는 획득 불가한 미보유 칭호 표기
- ⚠ 칭호 발급 규칙(A4)은 "골드 이상부터 발급"만 확정 — 자동 발급 조건 상세는 미정. 발급은 전적으로 백엔드 책임, 프론트는 표시/선택만
- `activity` — 최근 52주, 과거→오늘 순

### 2.16 `PUT /me/title` — 대표 칭호 선택

**요청** `{ "titleId": "s1_clear" }` 또는 해제 `{ "titleId": null }`
**204**
**400** — 미보유 칭호 지정 시

---

## 3. Judge0 연동 (백엔드 내부)

> Key Decision: **Judge0 self-host** (Docker isolate 샌드박스). 항상 자체 백엔드 뒤에 위치, **클라이언트 직접 노출 금지** (B3).

### 3.1 언어 코드 매핑

| 프론트 `LanguageCode` | 표시명 | Judge0 `language_id` (CE 기준) |
|---|---|---|
| `java11` | Java 11 | 62 (OpenJDK 13 — 11 정확 매핑은 self-host 빌드에서 조정) |
| `python3` | Python 3 | 71 (Python 3.8) |
| `cpp17` | C++17 | 54 (GCC, `-std=c++17`) |
| `nodejs` | JavaScript (Node.js) | 63 |

- self-host라 language_id는 빌드 구성에 따라 달라질 수 있음 — **백엔드 내부에서만 매핑**하고 API 계약은 위 `LanguageCode` 문자열로 고정
- 언어 추가 시: 백엔드 매핑 + 프론트 `src/constants/languages.ts`(표시명·스타터 코드) 동시 갱신

### 3.2 실행/제출 구분

| | `POST /runs` | `POST /submissions` |
|---|---|---|
| Judge0 호출 | 단건, 유저 stdin | 문제의 전체 테스트케이스 배치 |
| 대기 방식 | 동기(`wait=true`) 권장 | 비동기 + 콜백(웹훅) 수신 또는 백엔드 폴링 |
| 기록 | 채점 기록 없음 (세션 로깅 권장) | submissions 테이블 + 점수/상태 갱신 |
| 제한 | 문제별 시간/메모리 제한 동일 적용 | 〃 |

- `progress`(%) = 완료 테스트케이스 / 전체. Judge0 토큰별 콜백을 받아 카운트하면 자연 구현
- 테스트 문제 시드: [icpc/na-rocky-mountain-2020-public](https://github.com/icpc/na-rocky-mountain-2020-public) (스펙 D)
- 문제/테스트케이스 투입은 **어드민 UI 없이 seed 스크립트/마크다운·JSON 직접 투입** (B4 확정)

---

## 4. 점수 · 티어 · 하락 — 계산은 전부 백엔드

프론트는 **계산하지 않는다**. 아래 값을 받아 표시만:

| 값 | 출처 필드 | 비고 |
|---|---|---|
| 문제 점수 | `ProblemSummary.points` | A1 확정: 난이도별 고정(절댓값). §2.6 표 참고 |
| 시즌 점수/순위 | `me.seasonScore`, `me.seasonRank`, 랭킹 | 현재 시즌 문제 첫 클리어만 가산 |
| 티어 | `seasonTier` | 절댓값 컷 (A1: "불실골플다 절댓값, 많이 하면 올라감"). 챌린저(100명) 확정 시 협의 |
| 하락 경고 | `dashboard.decay` / `profile.decay` | 공식 미확정(추후 개발) — 그 전엔 `null` |
| 시즌 길이 | `season.startDate/endDate/dDay` | ⚠ 스펙 A2는 **6개월**, 와이어프레임은 3개월(7/1~9/30) — 목 데이터는 와이어프레임 기준. 실값은 백엔드가 내려주는 대로 표시되므로 충돌 없음 |
| 시즌 초기화 | — | 시즌 종료 시 티어·점수 전부 초기화(B1: 영구 티어 완전 제거). 시즌 전환 자동화는 Deferred(초기엔 운영자 수동/스크립트) |

---

## 5. 미확정 사항(🟡) ↔ API 영향

> 팀 회의에서 확정되면 본 문서 + `src/types/domain.ts` 동시 갱신

| 스펙 항목 | 상태 | API 영향 |
|---|---|---|
| A1 점수/티어/하락 공식 | 점수=고정(확정), 하락=추후 개발 | `decay` null 운용 → 구현 시 채움. 티어 컷 절댓값. **챌린저(100명)** 확정 시 `TierRank.name`에 `'challenger'` 추가 + 프론트 색상/라벨 추가 필요 |
| A2 시즌 주기 | **6개월**(스펙 red) vs 와이어프레임 3개월 | 날짜는 전부 서버 응답 기준이라 코드 영향 없음. 시즌 시드만 정확히 |
| A3 부정행위 탐지 | 본문 IDE-only 확정, 신호 수집 범위 미확정 | 현재: `open` 시각 기록 + `solveSessionId` 연결 + 프론트 붙여넣기 차단. 확정 시 제안: `POST /solve-sessions/{id}/events` 배치(`paste_blocked`, `focus_lost`, `devtools_open` 등) — 프론트 송신 로직 추가 작업 필요 |
| A4 칭호 발급 규칙 | 골드 이상부터 발급(확정), 조건 상세 미정 | 발급=백엔드 배치/이벤트. API는 `titles[]`로 충분 |
| B4 어드민 | DEFERRED | 문제/TC/시즌/칭호 투입 전부 seed 스크립트. 어드민 API 불필요(MVP) |
| C3 KPI | "정의 사항 개발 + 랜딩 페이지" | **비로그인 랜딩 페이지는 Deferred 목록에도 있음** — 충돌. 현재 프론트는 로그인 화면이 비로그인 진입점. 랜딩 확정 시 별도 페이지 추가 |
| D 전역 Q&A | "일반 문제만 Q&A 구현" 문구 | 해석 모호(전역 Q&A는 Deferred이기도 함). **화면 없음** — 확정 시 신규 화면+API 설계 |
| 랭킹 `overall` 의미 | 미확정 | §2.13 참고 |
| 친구 관계 | 화면만 존재(랭킹 탭·내 주변) | 팔로우 추가/삭제 API 미정 — MVP는 시드 허용 |
| 이메일 가입+인증 | 🟡 (소셜은 확정) | `POST /auth/login`만 계약됨. 가입/인증 플로우 확정 시 추가 |

---

## 6. 프론트 구현 노트 (백엔드가 알아두면 좋은 것)

1. **목 모드**: `src/api/mock/` 이 본 문서의 레퍼런스 구현(인메모리). 백엔드 동작이 애매하면 목 구현을 보면 프론트 기대 동작을 알 수 있다 (예: accepted 후 `myStatus` 전이, 토론 해제)
2. **전환 절차**: `.env.development`에서 `VITE_USE_MOCK=hybrid`(구현분만) 또는 `false`(전부) → `npm run dev` → Vite 프록시 경유로 `:8080` 호출. 하이브리드의 실서버 대상 목록은 `src/api/index.ts`의 `hybridApi` 한 곳에서 관리
3. **폴링 부하**: 제출 1건당 채점 완료까지 ~1초 간격 GET. 동시 제출 많아지면 레이트리밋/SSE 협의
4. **상대 시간**: "5분 전" 등은 전부 프론트(`formatRelative`) — 서버는 ISO만
5. **티어 표기**: 화면의 마름모 색·"플래티넘 II" 라벨은 프론트 `tierMap` — 서버는 enum만
6. **와이어프레임과 의도적으로 다른 부분** (가정, 이슈 시 역제안 환영):
   - 와이어프레임의 '나'가 화면마다 달랐던 것(algo_lover/me_dev)을 **algo_lover로 통일**
   - 홈 '내 주변 순위'를 실제 내 순위(4위) ±2로 정합화
   - 로그인 화면 추가(와이어프레임 9화면에 없으나 SPA 진입점으로 필수)
   - 문제 상세 '내 제출' 탭에 실제 목록 구현(와이어프레임은 탭만 존재)
   - IDE 에디터에 붙여넣기 차단 + 경고 문구(A3 "복붙 금지(필)" 반영)

---

## 7. 빠른 시작 (백엔드 개발자용)

```bash
git clone <repo> && cd grind-algorithm-front
npm install
npm run dev            # http://localhost:5173 — 목 모드로 전체 화면 동작
# 백엔드 띄운 뒤: .env.development → VITE_USE_MOCK=false 로 변경 후 재시작
```

연동 스모크 테스트 순서 권장: `GET /me` → `GET /dashboard` → `GET /seasons` + `/seasons/2/problems` → `POST /problems/S2-08/open` → `POST /runs` → `POST /submissions` + 폴링 → `GET /rankings` → `GET /users/{handle}` → `GET /problems/S2-08/discussions`

# GrindAlgorithm — Frontend

백준 참고 미니멀 디자인의 **시즌제 랭킹 기반 코딩 문제 풀이 사이트** 프론트엔드.
와이어프레임 확정 9화면(`algo_kr_overview.jsx`)을 실제 SPA로 구현한 것.

- 스택: **Vite + React 18 + TypeScript + react-router-dom** (스펙 C2: Next.js 미사용 확정)
- 백엔드: Spring Boot · Java · JPA / MariaDB / Judge0 self-host (별도 리포) — 연동 계약은 [docs/BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md)

## 실행

```bash
npm install
npm run dev      # http://localhost:5173 (목 모드 — 백엔드 불필요)
npm run build    # tsc + vite build
npm run preview
```

### 목 모드 ↔ 실서버 전환

`.env.development`:

```
VITE_USE_MOCK=true    # true(기본): 인메모리 목 API / false: 실제 백엔드 호출
VITE_API_BASE_URL=/api/v1
```

`false`로 바꾸면 Vite dev 프록시(`vite.config.ts`)가 `/api`, `/oauth2`를 `localhost:8080`(Spring Boot)으로 전달한다.

## 화면 (확정 9화면)

| 라우트 | 화면 |
|---|---|
| `/` | 홈 — 시즌 티어, decay 경고, 오늘의 추천, 내 주변 순위, 시즌 카드, 주간 통계, 시즌 잔디 |
| `/problems` | 문제 목록 — 시즌 탭(S2 현재=랭킹 반영/S1 과거=연습) + **채점 현황 내부 탭** |
| `/problems/:problemId` | 문제 상세 — 메타·분류·예상 복잡도만 노출, **본문·예제 비공개**, 내 제출 탭 |
| `/problems/:problemId/solve` | IDE — 분할 뷰(본문+에디터+입출력), 4개 언어, 실행/제출(채점 폴링). **본문은 여기서만 노출** |
| `/problems/:problemId/discussion` | 문제 토론 — 정답자 한정(잠금/해제), 코드리뷰·풀이공유 |
| `/ranking` | 랭킹 — 시즌/전체/친구 탭, 내 순위 행 |
| `/season` | 시즌 — 진행률·시즌 문제·리워드·이전 시즌 |
| `/users/:handle` | 유저 프로필 — 칭호 선택, 통계, 1년 잔디, 최근 활동 |
| `/login` | 로그인 — GitHub/Google OAuth + 이메일 (와이어프레임 외 추가) |

## 구조

```
src/
  api/            # API 계약: client.ts(인터페이스) · real.ts(실서버) · mock/(목 구현+데이터)
  types/domain.ts # 응답 스키마 = 백엔드 연동 문서와 1:1
  pages/          # 화면 9 + 로그인
  components/     # Tier, TitleBadge, JandiGrid, CodeEditor, TabBar, DecayBanner …
  context/        # AuthContext (세션 부팅·로그인/아웃)
  constants/      # 지원 언어·스타터 코드
  theme.ts        # 디자인 토큰 (와이어프레임 이관)
docs/BACKEND_INTEGRATION.md   # 백엔드 개발자용 연동 명세
```

## 핵심 정책 (스펙 반영)

- **본문 IDE-only(B2)**: `GET /problems/{id}`에는 본문이 없다. `POST /problems/{id}/open`(IDE 진입)만 본문을 내려주며 열람 시각이 기록된다
- **영구 티어 없음(B1)**: 시즌 종료 시 티어·점수 초기화. 모든 티어 표기는 "시즌 티어"
- **정답자 한정 토론**: Accepted 이력이 있어야 글 목록 열람
- **붙여넣기 차단(A3)**: IDE 에디터에서 외부 붙여넣기 차단 + 경고

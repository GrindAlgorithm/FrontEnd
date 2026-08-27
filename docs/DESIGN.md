# GrindAlgorithm 디자인 시스템 — 세션 E (요건 21)

다크 터미널 테마. 목표: "geek", AI slop 배제. 토큰의 단일 출처는 `src/theme.ts` 의 `C`.

## 원칙 (금지/필수)

**금지**
- 그라데이션, `box-shadow`, glassmorphism, blur
- `border-radius` — 항상 **0** (기존 값이 있으면 제거하거나 0)
- UI 장식용 이모지 (데이터로서의 이모지는 허용)
- 색상 리터럴 하드코딩 — 반드시 `C.*` 토큰 사용 (신택스 하이라이트 팔레트 예외)
- 흰 배경 (`#fff` 류) — 다크 표면 토큰으로 대체

**필수**
- 위계는 배경 3단(`C.bg` < `C.surface` < `C.surfaceAlt`)과 1px 보더로만 표현
- 숫자·핸들·코드·라벨·뱃지·테이블 헤더는 `monoStack`
- 본문 한글 산문은 `fontStack` (Pretendard)
- 액센트는 phosphor green(`C.accent`) **하나만**. 파랑 액센트 금지 (`C.blue` 는 레거시 별칭 → `C.accent` 로 교체)

## 토큰 매핑 (라이트 → 다크 치환표)

| 기존 값 | 대체 |
|---|---|
| `background: '#fff'` (카드/패널) | `C.surface` |
| `background: '#fff'` (인풋/에디터) | `C.bg` 또는 `C.surfaceAlt` (인접 표면보다 한 단계 어둡게) |
| `#f8f9fa`, `#fafafa`, `#f0f0f0`, `C.bg`(구 회색) | `C.surfaceAlt` (호버/헤더 행) 또는 `C.bg` |
| `#f0f7ff` (파랑 틴트 배경) | `C.accentBg` |
| `#f0fff4` (초록 틴트 배경) | `C.greenBg` |
| `#fff5f5` (빨강 틴트 배경) | `C.redBg` |
| `C.blue` / `#0d6efd` | `C.accent` |
| `C.blueDark` / `#0a58ca` | `C.accentDim` |
| `boxShadow: ...` | 제거 (필요하면 `border: 1px solid C.border`) |
| `borderRadius: N` | 제거 또는 `0` |
| `color: '#000'` | `C.text` |
| `#999`, `#6c757d` | `C.muted` |

## 컴포넌트 관용구

- **버튼(주요)**: `background: 'transparent'`, `border: 1px solid C.accent`, `color: C.accent`, hover 시 인버트(`background: C.accent`, `color: C.bg`). hover 는 `onMouseEnter/Leave` 대신 가능하면 정적 스타일 유지 — 기존 코드가 정적이면 인버트 없이 보더형만.
- **버튼(위험)**: 위와 같되 `C.red`.
- **버튼(비활성)**: `border: 1px solid C.border`, `color: C.muted`.
- **인풋/텍스트에어리어**: `background: C.bg`, `border: 1px solid C.border`, `color: C.text`, focus 는 global.css 의 focus-visible 에 맡김.
- **카드/패널**: `background: C.surface`, `border: 1px solid C.border`.
- **테이블**: 헤더 행 `background: C.surfaceAlt`, `fontFamily: monoStack`, `fontSize` 1px 줄임; 행 구분 `1px solid C.borderLight`; hover 행 `C.surfaceAlt`.
- **뱃지/칩**: 모노, `border: 1px solid <색>`, `color: <색>`, 배경은 해당 `*Bg` 틴트 또는 투명. 라운딩 없음.
- **섹션 제목**: 앞에 `<span style={{color: C.accent, fontFamily: monoStack}}>// </span>` 프리픽스 (예: `// 공지`). 페이지당 과용 금지 — h2 급에만.
- **상태 표시**: AC=`C.green`, 오답/에러=`C.red`, 진행/대기=`C.muted`, 경고=`C.amber`.

## 폰트

- `monoStack` = JetBrains Mono (index.html 에서 Google Fonts 로드) → D2Coding → 시스템 모노
- `fontStack` = Pretendard (CDN)

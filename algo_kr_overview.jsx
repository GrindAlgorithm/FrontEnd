import { useState, useEffect } from 'react'

const C = {
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
}

const fontStack = '"Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const monoStack = '"JetBrains Mono", "D2Coding", ui-monospace, SFMono-Regular, Menlo, "Cascadia Mono", monospace'

const tierMap = {
  bronze:   { color: C.bronze,   label: '브론즈' },
  silver:   { color: C.silver,   label: '실버' },
  gold:     { color: C.gold,     label: '골드' },
  platinum: { color: C.platinum, label: '플래티넘' },
  diamond:  { color: C.diamond,  label: '다이아' },
}

function Tier({ tier, level }) {
  const t = tierMap[tier]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.color, fontWeight: 600 }}>
      <span style={{ width: 9, height: 9, background: t.color, transform: 'rotate(45deg)', display: 'inline-block' }} />
      <span>{t.label} {level}</span>
    </span>
  )
}

const NAV_LINKS = [
  { id: 'home', label: '홈' },
  { id: 'problems', label: '문제' },
  { id: 'ranking', label: '랭킹' },
]

function Nav({ current }) {
  return (
    <header style={{ borderBottom: `1px solid ${C.borderLight}`, background: '#fff' }}>
      <div className="max-w-5xl mx-auto px-4 flex items-center" style={{ height: 52, gap: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.5 }}>
          Grind<span style={{ color: C.blue }}>Algorithm</span>
        </div>
        <nav className="flex" style={{ gap: 20, flex: 1 }}>
          {NAV_LINKS.map(l => (
            <div
              key={l.id}
              style={{
                fontSize: 14,
                color: current === l.id ? C.text : C.muted,
                fontWeight: current === l.id ? 600 : 400,
                padding: '4px 2px',
                borderBottom: current === l.id ? `2px solid ${C.blue}` : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {l.label}
            </div>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <span style={{ color: C.muted }}>로그인</span>
          <span style={{ color: C.blue }}>회원가입</span>
        </div>
      </div>
    </header>
  )
}

// ──────────────────────────── HOME ────────────────────────────

const TODAY_PICKS = [
  { no: 1167,  title: '트리의 지름',          tier: 'gold',     level: 'II',  reason: '티어업 후보',   reasonColor: 'blue'   },
  { no: 11404, title: '플로이드',              tier: 'gold',     level: 'IV',  reason: '약한 분야 · DP', reasonColor: 'red'    },
  { no: 14503, title: '로봇 청소기',           tier: 'gold',     level: 'V',   reason: '이어 풀기',     reasonColor: 'muted'  },
  { no: 21610, title: '마법사 상어와 비바라기', tier: 'platinum', level: 'V',   reason: '비슷한 난이도', reasonColor: 'muted'  },
  { no: 17143, title: '낚시왕',                tier: 'platinum', level: 'III', reason: '시뮬레이션 추천', reasonColor: 'muted' },
]

const FRIENDS_NEAR = [
  { rank: 312,  user: 'park_dev',    seasonTier: 'platinum', seasonLevel: 'I',  delta: '+2' },
  { rank: 580,  user: 'algo_friend', seasonTier: 'platinum', seasonLevel: 'I',  delta: '-1' },
  { rank: 1234, user: 'me_dev',      seasonTier: 'silver',   seasonLevel: 'II', delta: '0',  isMe: true },
  { rank: 1456, user: 'study_kim',   seasonTier: 'silver',   seasonLevel: 'III', delta: '+5' },
  { rank: 1822, user: 'newbie_lee',  seasonTier: 'silver',   seasonLevel: 'IV',  delta: '+12' },
]

const NOTICES = [
  { tag: '공지',    title: 'Season 2 시작 · 시즌 문제 15개 공개', when: '7월 1일', highlight: true },
  { tag: '공지',    title: '채점 서버 점검 안내 (5/30 02:00~04:00)', when: '4일 전' },
  { tag: '업데이트', title: 'Java 17 지원 추가',                       when: '1주 전' },
]

// 12주(시즌 분량) 잔디
function generateSeasonJandi() {
  const data = []
  for (let w = 0; w < 12; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const seed = w * 7 + d + 100
      const r = Math.sin(seed * 12.9898) * 43758.5453
      const v = r - Math.floor(r)
      let level
      if (v < 0.35) level = 0
      else if (v < 0.6) level = 1
      else if (v < 0.82) level = 2
      else if (v < 0.94) level = 3
      else level = 4
      week.push(level)
    }
    data.push(week)
  }
  return data
}
const SEASON_JANDI = generateSeasonJandi()

function reasonColorOf(r) {
  if (r === 'blue') return C.blue
  if (r === 'red') return C.red
  return C.muted
}

function HomeScreen({ onPickProblem, onGoProblems, onGoRanking, onGoSeason, onGoProfile, onGoIDE }) {
  return (
    <div>
      {/* Personal Hero — 유저 프로필 헤더 톤 차용 */}
      <section style={{
        borderBottom: `1px solid ${C.borderLight}`,
        paddingBottom: 20,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>안녕하세요,</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: -0.5, cursor: 'pointer' }} onClick={onGoProfile}>
              algo_lover <span style={{ color: C.muted, fontSize: 13, fontWeight: 400 }}>님</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>시즌 티어</div>
              <Tier tier="platinum" level="II" />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>2,433점 · <span style={{ color: C.blue, cursor: 'pointer' }} onClick={onGoRanking}>4위</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Decay 경고 */}
      <div style={{
        border: `1px solid ${C.red}`,
        background: '#fff5f5',
        padding: '10px 14px',
        marginBottom: 24,
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ color: C.red, fontSize: 16, fontWeight: 700 }}>⚠</span>
        <span style={{ flex: 1 }}>
          <strong>5일간 활동 없음</strong> — 2일 뒤 시즌 티어가 <strong>플래티넘 II → 플래티넘 III</strong>으로 하락합니다
        </span>
        <button
          onClick={onGoIDE}
          style={{
            background: C.red, color: '#fff', border: 'none', padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: fontStack,
          }}
        >
          지금 풀기 →
        </button>
      </div>

      {/* Body: 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28 }}>
        {/* LEFT */}
        <div>
          {/* 오늘의 추천 */}
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>오늘의 추천</h2>
              <span style={{ fontSize: 12, color: C.blue, cursor: 'pointer' }} onClick={onGoProblems}>전체 문제 →</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderTop: `2px solid ${C.text}`, borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '8px 6px', textAlign: 'left',  fontWeight: 600, width: 60 }}>번호</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left',  fontWeight: 600 }}>제목</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left',  fontWeight: 600, width: 110 }}>난이도</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left',  fontWeight: 600, width: 130 }}>추천 이유</th>
                </tr>
              </thead>
              <tbody>
                {TODAY_PICKS.map(p => (
                  <tr key={p.no} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                    <td style={{ padding: '8px 6px', fontFamily: monoStack, color: C.muted }}>{p.no}</td>
                    <td style={{ padding: '8px 6px' }}>
                      <span style={{ color: C.blue, cursor: 'pointer' }} onClick={onPickProblem}>{p.title}</span>
                    </td>
                    <td style={{ padding: '8px 6px' }}><Tier tier={p.tier} level={p.level} /></td>
                    <td style={{ padding: '8px 6px', color: reasonColorOf(p.reasonColor), fontSize: 12, fontWeight: p.reasonColor !== 'muted' ? 600 : 400 }}>{p.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 친구 순위 */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>내 주변 순위</h2>
              <span style={{ fontSize: 12, color: C.blue, cursor: 'pointer' }} onClick={onGoRanking}>전체 랭킹 →</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderTop: `2px solid ${C.text}`, borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, width: 60 }}>순위</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left',  fontWeight: 600 }}>아이디</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left',  fontWeight: 600, width: 110 }}>시즌 티어</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, width: 80 }}>7일 변동</th>
                </tr>
              </thead>
              <tbody>
                {FRIENDS_NEAR.map(f => (
                  <tr key={f.rank} style={{
                    borderBottom: `1px solid ${C.borderLight}`,
                    background: f.isMe ? C.bg : 'transparent',
                  }}>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: C.muted }}>{f.rank.toLocaleString()}</td>
                    <td style={{ padding: '8px 6px' }}>
                      <span style={{ color: C.blue, cursor: 'pointer', fontWeight: f.isMe ? 700 : 400 }}>
                        {f.user} {f.isMe && <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>(나)</span>}
                      </span>
                    </td>
                    <td style={{ padding: '8px 6px' }}><Tier tier={f.seasonTier} level={f.seasonLevel} /></td>
                    <td style={{
                      padding: '8px 6px',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: 12,
                      color: f.delta.startsWith('+') ? C.green : f.delta.startsWith('-') ? C.red : C.muted,
                      fontWeight: 600,
                    }}>{f.delta === '0' ? '–' : f.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* RIGHT */}
        <aside>
          {/* 시즌 진행 */}
          <section style={{ marginBottom: 28, border: `1px solid ${C.border}`, padding: 14, background: C.bg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Season 2</h2>
              <span style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>D-72</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>7/1 ~ 9/30</div>

            <div style={{ height: 4, background: C.borderLight, borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', width: '22%', background: C.blue }} />
            </div>

            {/* 챌린지 진행 */}
            <div style={{ paddingTop: 12, borderTop: `1px solid ${C.borderLight}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.muted }}>시즌 문제</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>7 <span style={{ color: C.muted, fontWeight: 400 }}>/ 15</span></span>
              </div>
              <button
                onClick={onGoIDE}
                style={{
                  width: '100%',
                  background: C.blue, color: '#fff', border: 'none', padding: '8px 12px',
                  fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: fontStack, marginTop: 8,
                }}
              >
                다음 시즌 문제 풀기 →
              </button>
              <div onClick={onGoSeason} style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: C.blue, cursor: 'pointer' }}>
                시즌 상세 보기
              </div>
            </div>
          </section>

          {/* 이번 주 활동 */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>이번 주</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {[
                  ['푼 문제', '7개'],
                  ['시즌 점수', '+128'],
                  ['연속 일수', '14일'],
                  ['정답률', '52.3%'],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                    <td style={{ padding: '6px 4px', color: C.muted, fontSize: 12 }}>{k}</td>
                    <td style={{
                      padding: '6px 4px',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 600,
                      color: v.startsWith('+') ? C.green : C.text,
                    }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 공지 */}
          <section>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>공지</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {NOTICES.map((n, i) => (
                <li key={i} style={{
                  padding: '6px 0',
                  fontSize: 12,
                  display: 'flex',
                  gap: 6,
                  alignItems: 'baseline',
                }}>
                  <span style={{
                    fontSize: 10,
                    color: n.highlight ? C.red : C.muted,
                    fontWeight: 600,
                    minWidth: 40,
                  }}>[{n.tag}]</span>
                  <span style={{ color: C.blue, cursor: 'pointer', flex: 1, lineHeight: 1.5 }}>{n.title}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {/* 이번 시즌 활동 (잔디) */}
      <section style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.borderLight}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>이번 시즌 활동</h2>
          <span style={{ fontSize: 11, color: C.muted }}>
            58일 활동 · 평균 1.4문제/일 · <span style={{ color: C.blue, cursor: 'pointer' }} onClick={onGoProfile}>1년 활동 보기 →</span>
          </span>
        </div>
        <svg viewBox="0 0 170 100" style={{ width: '100%', height: 'auto', display: 'block', maxWidth: 360 }}>
          {SEASON_JANDI.map((week, wi) => (
            <g key={wi}>
              {week.map((level, di) => (
                <rect
                  key={di}
                  x={wi * 14}
                  y={di * 14}
                  width={11}
                  height={11}
                  rx={2}
                  fill={JANDI_COLORS[level]}
                />
              ))}
            </g>
          ))}
        </svg>
      </section>
    </div>
  )
}


// ──────────────────────────── PROBLEMS ────────────────────────────

const TIER_POINTS = {
  bronze:   { V: 5,   IV: 6,   III: 7,   II: 8,   I: 10 },
  silver:   { V: 12,  IV: 14,  III: 16,  II: 18,  I: 22 },
  gold:     { V: 25,  IV: 30,  III: 35,  II: 42,  I: 50 },
  platinum: { V: 60,  IV: 70,  III: 85,  II: 100, I: 120 },
  diamond:  { V: 150, IV: 180, III: 220, II: 270, I: 330 },
}
function pointsOf(tier, level) {
  return (TIER_POINTS[tier] && TIER_POINTS[tier][level]) || 0
}

const STATUS_BADGE = {
  cleared: { label: '✓ 클리어', color: C.green },
  wip:     { label: '시도중',    color: C.blue },
  untried: { label: '—',         color: C.muted },
}

const SEASONS = [
  {
    id: 2,
    label: 'Season 2',
    period: '7/1 ~ 9/30',
    status: 'current',
    dDay: 72,
    problems: [
      { no: 'S2-01', title: '시작 코드: 정렬 변주',        tier: 'bronze',   level: 'IV',  tags: ['정렬'],               rate: 71.2, status: 'cleared' },
      { no: 'S2-02', title: '부분합 한 줄',                tier: 'bronze',   level: 'III', tags: ['부분합'],             rate: 65.5, status: 'cleared' },
      { no: 'S2-03', title: '슬라이딩 윈도우',             tier: 'silver',   level: 'IV',  tags: ['투포인터'],           rate: 52.3, status: 'cleared' },
      { no: 'S2-04', title: '트리 BFS',                    tier: 'silver',   level: 'III', tags: ['BFS', '트리'],        rate: 48.1, status: 'cleared' },
      { no: 'S2-05', title: '우선순위 큐 워밍업',          tier: 'silver',   level: 'II',  tags: ['자료구조'],            rate: 45.2, status: 'cleared' },
      { no: 'S2-06', title: '그리디 인터벌',               tier: 'silver',   level: 'I',   tags: ['그리디'],             rate: 42.8, status: 'cleared' },
      { no: 'S2-07', title: '다이나믹 그리드',             tier: 'gold',     level: 'V',   tags: ['DP'],                 rate: 38.5, status: 'cleared' },
      { no: 'S2-08', title: '그래프 가중치 처리',          tier: 'gold',     level: 'IV',  tags: ['다익스트라'],          rate: 33.1, status: 'wip' },
      { no: 'S2-09', title: '비트마스크 DP',               tier: 'gold',     level: 'III', tags: ['DP', '비트마스크'],   rate: 28.4, status: 'untried' },
      { no: 'S2-10', title: 'LIS 변형',                    tier: 'gold',     level: 'II',  tags: ['DP'],                 rate: 25.3, status: 'untried' },
      { no: 'S2-11', title: '최단경로 다중 시작점',        tier: 'gold',     level: 'I',   tags: ['다익스트라'],          rate: 22.7, status: 'untried' },
      { no: 'S2-12', title: '백트래킹 메이즈',             tier: 'platinum', level: 'V',   tags: ['백트래킹'],           rate: 18.2, status: 'untried' },
      { no: 'S2-13', title: '세그먼트 트리 기본',          tier: 'platinum', level: 'IV',  tags: ['세그먼트트리'],        rate: 14.5, status: 'untried' },
      { no: 'S2-14', title: '이분 매칭',                   tier: 'platinum', level: 'III', tags: ['매칭'],               rate: 11.2, status: 'untried' },
      { no: 'S2-15', title: '시즌 결승: 그래프 컬러링',    tier: 'platinum', level: 'II',  tags: ['그래프'],             rate: 8.4,  status: 'untried' },
    ],
  },
  {
    id: 1,
    label: 'Season 1',
    period: '4/1 ~ 6/30',
    status: 'past',
    problems: [
      { no: 'S1-01', title: '시즌 도입: 색깔 배열',        tier: 'bronze',   level: 'III', tags: ['구현'],              rate: 68.1, status: 'cleared' },
      { no: 'S1-02', title: '비밀 코드의 깊이',             tier: 'silver',   level: 'IV',  tags: ['DFS'],                rate: 51.5, status: 'cleared' },
      { no: 'S1-03', title: '시간 여행자의 일정표',        tier: 'silver',   level: 'I',   tags: ['정렬', '그리디'],     rate: 41.2, status: 'cleared' },
      { no: 'S1-04', title: '미로의 분기점',                tier: 'gold',     level: 'V',   tags: ['BFS'],                rate: 36.8, status: 'cleared' },
      { no: 'S1-05', title: '네트워크의 약점',              tier: 'gold',     level: 'III', tags: ['그래프'],             rate: 28.1, status: 'cleared' },
      { no: 'S1-06', title: '교차로의 신호',                tier: 'gold',     level: 'II',  tags: ['시뮬레이션'],          rate: 24.3, status: 'cleared' },
      { no: 'S1-07', title: '왕국의 분할',                  tier: 'gold',     level: 'I',   tags: ['분할정복'],            rate: 21.5, status: 'cleared' },
      { no: 'S1-08', title: '소수의 정원',                  tier: 'platinum', level: 'V',   tags: ['수학'],               rate: 17.2, status: 'cleared' },
      { no: 'S1-09', title: '암호의 재구성',                tier: 'platinum', level: 'IV',  tags: ['문자열'],             rate: 13.8, status: 'untried' },
      { no: 'S1-10', title: '겹쳐진 별자리',                tier: 'platinum', level: 'III', tags: ['기하'],               rate: 10.2, status: 'untried' },
      { no: 'S1-11', title: '환상의 격자',                  tier: 'platinum', level: 'II',  tags: ['DP', '시뮬레이션'],   rate: 8.4,  status: 'untried' },
      { no: 'S1-12', title: '시즌 결승: 운명의 그래프',     tier: 'diamond',  level: 'V',   tags: ['그래프'],             rate: 5.1,  status: 'untried' },
    ],
  },
]

function ProblemListScreen({ initialTab = 'problems' }) {
  const [topTab, setTopTab] = useState(initialTab)
  const [seasonId, setSeasonId] = useState(2)
  const [q, setQ] = useState('')
  const season = SEASONS.find(s => s.id === seasonId)
  const filtered = season.problems.filter(p => !q || p.title.includes(q) || p.no.includes(q))
  const cleared = season.problems.filter(p => p.status === 'cleared').length
  const isCurrent = season.status === 'current'

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>문제</h1>

      {/* Top tabs: 문제 목록 / 채점 현황 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: 'problems',    label: '문제 목록' },
          { id: 'submissions', label: '채점 현황' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTopTab(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px 16px',
              fontSize: 14,
              cursor: 'pointer',
              color: topTab === t.id ? C.text : C.muted,
              fontWeight: topTab === t.id ? 700 : 400,
              borderBottom: topTab === t.id ? `2px solid ${C.blue}` : '2px solid transparent',
              marginBottom: -1,
              fontFamily: fontStack,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {topTab === 'submissions' ? <SubmissionsTable /> : (
        <>
      {/* Season tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        {SEASONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSeasonId(s.id)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px 14px',
              fontSize: 13,
              cursor: 'pointer',
              color: seasonId === s.id ? C.text : C.muted,
              fontWeight: seasonId === s.id ? 600 : 400,
              borderBottom: seasonId === s.id ? `2px solid ${C.blue}` : '2px solid transparent',
              marginBottom: -1,
              fontFamily: fontStack,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{s.label}</span>
            <span style={{
              fontSize: 10,
              padding: '1px 6px',
              background: s.status === 'current' ? C.blue : C.borderLight,
              color: s.status === 'current' ? '#fff' : C.muted,
              borderRadius: 2,
              fontWeight: 600,
            }}>
              {s.status === 'current' ? '현재' : '과거'}
            </span>
          </button>
        ))}
      </div>

      {/* Season banner */}
      {isCurrent ? (
        <div style={{
          border: `1px solid ${C.blue}`,
          background: '#f0f7ff',
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{season.label} · {season.period}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              이 시즌의 문제를 풀면 <strong style={{ color: C.text }}>시즌 랭킹 점수</strong>가 올라갑니다
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.muted }}>종료까지</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.red, fontVariantNumeric: 'tabular-nums' }}>D-{season.dDay}</div>
          </div>
        </div>
      ) : (
        <div style={{
          border: `1px solid ${C.border}`,
          background: C.bg,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ color: C.muted, fontSize: 16 }}>🔒</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>{season.label} · {season.period} · 종료됨</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              연습용 · 풀어도 시즌 랭킹 점수에 영향 없음
            </div>
          </div>
        </div>
      )}

      {/* Stats + Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: C.muted }}>
          전체 {season.problems.length}개 · 클리어 <strong style={{ color: C.text }}>{cleared}</strong>개
        </span>
        <input
          placeholder="제목 또는 번호 검색"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{
            border: `1px solid ${C.border}`,
            padding: '6px 10px',
            fontSize: 13,
            borderRadius: 3,
            width: 200,
            fontFamily: fontStack,
            outline: 'none',
          }}
        />
      </div>

      {/* Problem table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderTop: `2px solid ${C.text}`, borderBottom: `1px solid ${C.border}` }}>
            <th style={{ padding: '10px 8px', textAlign: 'left',  fontWeight: 600, width: 70 }}>번호</th>
            <th style={{ padding: '10px 8px', textAlign: 'left',  fontWeight: 600 }}>제목</th>
            <th style={{ padding: '10px 8px', textAlign: 'left',  fontWeight: 600 }}>분류</th>
            <th style={{ padding: '10px 8px', textAlign: 'left',  fontWeight: 600, width: 110 }}>난이도</th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, width: 70 }}>정답률</th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, width: 75 }}>점수</th>
            <th style={{ padding: '10px 8px', textAlign: 'left',  fontWeight: 600, width: 80 }}>상태</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p => {
            const pts = pointsOf(p.tier, p.level)
            const st = STATUS_BADGE[p.status]
            return (
              <tr key={p.no} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                <td style={{ padding: '10px 8px', fontFamily: monoStack, color: C.muted, fontSize: 12 }}>{p.no}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{ color: C.blue, cursor: 'pointer' }}>{p.title}</span>
                </td>
                <td style={{ padding: '10px 8px', color: C.muted, fontSize: 12 }}>{p.tags.join(', ')}</td>
                <td style={{ padding: '10px 8px' }}><Tier tier={p.tier} level={p.level} /></td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.rate.toFixed(1)}%</td>
                <td style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 600,
                  color: isCurrent ? C.text : C.muted,
                  textDecoration: isCurrent ? 'none' : 'line-through',
                }}>
                  {pts}점
                </td>
                <td style={{ padding: '10px 8px', color: st.color, fontSize: 12, fontWeight: 600 }}>{st.label}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
        </>
      )}
    </div>
  )
}


// ──────────────────────────── PROBLEM DETAIL ────────────────────────────

function ProblemDetailScreen({ onSolve }) {
  const tags = ['시뮬레이션', 'BFS', '구현']
  const expectedComplexity = 'O(N⁴) 이내'
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: monoStack, color: C.muted, fontSize: 18 }}>S2-08</span>
        그래프 가중치 처리
        <Tier tier="gold" level="IV" />
      </h1>

      {/* 탭 (토론 화면과 동일 구조) */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {['문제', '내 제출', '토론'].map((t, i) => (
          <div key={t} style={{
            padding: '8px 14px',
            fontSize: 13,
            color: i === 0 ? C.text : C.muted,
            fontWeight: i === 0 ? 600 : 400,
            borderBottom: i === 0 ? `2px solid ${C.blue}` : '2px solid transparent',
            marginBottom: -1,
            cursor: 'pointer',
          }}>
            {t}
          </div>
        ))}
      </div>

      {/* 메타 정보 표 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 24, border: `1px solid ${C.border}` }}>
        <thead>
          <tr style={{ background: C.bg }}>
            {['시간 제한', '메모리 제한', '제출', '정답', '맞힌 사람', '정답 비율', '시즌 점수'].map((h, i, arr) => (
              <th key={h} style={{ padding: '8px 6px', fontWeight: 600, borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {['1 초', '512 MB', '8,432', '2,791', '2,113', '33.1%', '30점'].map((v, i, arr) => (
              <td key={i} style={{ padding: '8px 6px', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', borderTop: `1px solid ${C.border}` }}>{v}</td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* 알고리즘 분류 */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>알고리즘 분류</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tags.map(t => (
            <span key={t} style={{
              border: `1px solid ${C.border}`,
              background: '#fff',
              padding: '5px 12px',
              fontSize: 13,
              color: C.blue,
              cursor: 'pointer',
            }}>
              {t}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 12, color: C.muted, margin: '10px 0 0' }}>
          예상 시간 복잡도: <strong style={{ color: C.text, fontFamily: monoStack }}>{expectedComplexity}</strong>
        </p>
      </section>

      {/* 본문 잠금 박스 */}
      <section style={{
        border: `1px solid ${C.border}`,
        background: C.bg,
        padding: '32px 24px',
        marginBottom: 20,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>
          문제 본문은 IDE에서 확인 가능합니다
        </h3>
        <p style={{ fontSize: 12, color: C.muted, margin: '0 0 18px', lineHeight: 1.7 }}>
          부정행위 탐지를 위해 모든 문제 열람은 IDE에서만 이루어지며 시간이 기록됩니다.<br />
          본문 노출 시점부터 풀이 시간이 측정되며, 비정상적인 패턴(매우 빠른 정답 등)은 검토 대상이 될 수 있습니다.
        </p>
        <button
          onClick={onSolve}
          style={{
            background: C.blue, color: '#fff', border: 'none', padding: '12px 32px',
            fontSize: 15, cursor: 'pointer', fontWeight: 700, fontFamily: fontStack,
          }}
        >
          IDE에서 문제 풀기 →
        </button>
      </section>

      {/* 보조 정보 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        color: C.muted,
        paddingTop: 12,
        borderTop: `1px solid ${C.borderLight}`,
      }}>
        <span>내 상태: <span style={{ color: C.blue, fontWeight: 600 }}>시도중 (2회 제출, 미해결)</span></span>
        <span>마지막 시도: 3시간 전</span>
      </div>
    </div>
  )
}

// ──────────────────────────── SUBMISSIONS ────────────────────────────

const SUBMISSIONS = [
  { id: 87123412, user: 'algo_lover',  problem: 21609, problemTitle: '상어 중학교',  result: '맞았습니다!!',  mem: 24432, time: 312,  lang: 'Java 11',    size: 4231, when: '2분 전' },
  { id: 87123411, user: 'newbie01',    problem: 1000,  problemTitle: 'A+B',          result: '맞았습니다!!',  mem: 14216, time: 76,   lang: 'Python 3',   size: 87,   when: '3분 전' },
  { id: 87123410, user: 'cs_student',  problem: 1753,  problemTitle: '최단경로',     result: '시간 초과',    mem: 35221, time: 1000, lang: 'Python 3',   size: 1422, when: '5분 전' },
  { id: 87123409, user: 'kim_dev',     problem: 11657, problemTitle: '타임머신',     result: '틀렸습니다',    mem: 18221, time: 192,  lang: 'C++17',      size: 921,  when: '8분 전' },
  { id: 87123408, user: 'algo_lover',  problem: 21609, problemTitle: '상어 중학교',  result: '채점 중 (89%)', mem: null,  time: null, lang: 'Java 11',    size: 4231, when: '12분 전' },
  { id: 87123407, user: 'park_test',   problem: 1149,  problemTitle: 'RGB거리',      result: '맞았습니다!!',  mem: 17221, time: 132,  lang: 'C++17',      size: 612,  when: '14분 전' },
  { id: 87123406, user: 'java_kim',    problem: 1932,  problemTitle: '정수 삼각형',  result: '런타임 에러',  mem: 16221, time: 88,   lang: 'Java 11',    size: 833,  when: '16분 전' },
]

function resultColor(r) {
  if (r.startsWith('맞')) return C.green
  if (r.includes('채점')) return C.muted
  return C.red
}

function SubmissionsTable() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ borderTop: `2px solid ${C.text}`, borderBottom: `1px solid ${C.border}` }}>
          {['채점 번호', '아이디', '문제', '결과', '메모리', '시간', '언어', '코드 길이', '제출 시각'].map(h => (
            <th key={h} style={{ padding: '10px 6px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {SUBMISSIONS.map(s => (
          <tr key={s.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
            <td style={{ padding: '10px 6px', fontFamily: monoStack, color: C.muted }}>{s.id}</td>
            <td style={{ padding: '10px 6px' }}><span style={{ color: C.blue }}>{s.user}</span></td>
            <td style={{ padding: '10px 6px' }}>
              <span style={{ color: C.blue }}>{s.problem}번 · {s.problemTitle}</span>
            </td>
            <td style={{ padding: '10px 6px', color: resultColor(s.result), fontWeight: 600 }}>{s.result}</td>
            <td style={{ padding: '10px 6px', fontVariantNumeric: 'tabular-nums', color: C.muted }}>{s.mem ? s.mem.toLocaleString() + ' KB' : '-'}</td>
            <td style={{ padding: '10px 6px', fontVariantNumeric: 'tabular-nums', color: C.muted }}>{s.time !== null ? s.time + ' ms' : '-'}</td>
            <td style={{ padding: '10px 6px', color: C.muted }}>{s.lang}</td>
            <td style={{ padding: '10px 6px', fontVariantNumeric: 'tabular-nums', color: C.muted }}>{s.size} B</td>
            <td style={{ padding: '10px 6px', color: C.muted }}>{s.when}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ──────────────────────────── IDE ────────────────────────────

const HL = {
  keyword: '#0033b3',
  type:    '#267f99',
  string:  '#a31515',
  comment: '#6e9956',
  number:  '#1750eb',
}

const LANG_TOKENS = {
  'Java 11': {
    keyword: /\b(?:public|private|protected|class|static|void|int|long|double|float|boolean|char|byte|short|new|return|if|else|for|while|do|true|false|null|import|package|extends|implements|abstract|final|try|catch|finally|throw|throws|interface|enum|switch|case|break|continue|this|super|instanceof)\b/,
    type: /\b(?:Integer|String|Boolean|Long|Double|Float|Character|List|ArrayList|Map|HashMap|Set|HashSet|Scanner|BufferedReader|InputStreamReader|StringBuilder|StringTokenizer|Arrays|Collections|System|Math|Object)\b/,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
    comment: /\/\/.*|\/\*[\s\S]*?\*\//,
    number: /\b\d+(?:\.\d+)?\b/,
  },
  'Python 3': {
    keyword: /\b(?:def|class|if|elif|else|for|while|return|import|from|as|in|not|and|or|is|True|False|None|try|except|finally|with|lambda|yield|pass|break|continue|global|nonlocal|raise|assert)\b/,
    type: /\b(?:int|str|float|bool|list|dict|tuple|set|range|len|print|input|map|filter|zip|enumerate|sorted|reversed|sum|min|max|abs|round|open|type)\b/,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
    comment: /#.*/,
    number: /\b\d+(?:\.\d+)?\b/,
  },
  'C++17': {
    keyword: /\b(?:int|long|double|float|char|bool|void|auto|const|static|extern|return|if|else|for|while|do|true|false|nullptr|NULL|new|delete|class|struct|public|private|protected|template|typename|using|namespace|include|define|ifdef|ifndef|endif|try|catch|throw|virtual|override|sizeof)\b/,
    type: /\b(?:string|vector|map|unordered_map|set|unordered_set|queue|deque|stack|priority_queue|pair|size_t|iostream|cin|cout|endl|cerr|ios_base)\b/,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
    comment: /\/\/.*|\/\*[\s\S]*?\*\/|#\w+.*/,
    number: /\b\d+(?:\.\d+)?\b/,
  },
  'JavaScript (Node.js)': {
    keyword: /\b(?:const|let|var|function|return|if|else|for|while|do|true|false|null|undefined|import|export|from|class|extends|new|this|try|catch|finally|throw|async|await|of|in|typeof|instanceof|switch|case|break|continue|default)\b/,
    type: /\b(?:console|Math|Number|String|Array|Object|JSON|Promise|Map|Set|Symbol|require|module|process)\b/,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/,
    comment: /\/\/.*|\/\*[\s\S]*?\*\//,
    number: /\b\d+(?:\.\d+)?\b/,
  },
}

const STARTER_CODE = {
  'Java 11': `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // 여기에 코드를 작성하세요
    }
}`,
  'Python 3': `import sys
input = sys.stdin.readline

# 여기에 코드를 작성하세요
`,
  'C++17': `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // 여기에 코드를 작성하세요

    return 0;
}`,
  'JavaScript (Node.js)': `const input = require('fs').readFileSync('/dev/stdin').toString().trim().split('\\n');

// 여기에 코드를 작성하세요
`,
}

const STARTER_SET = new Set(Object.values(STARTER_CODE).map(s => s.trim()))

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlight(code, lang) {
  const t = LANG_TOKENS[lang]
  if (!t) return escapeHtml(code)
  const order = ['comment', 'string', 'keyword', 'type', 'number']
  const combined = new RegExp(
    order.map(name => `(?<${name}>${t[name].source})`).join('|'),
    'g'
  )

  let html = ''
  let last = 0
  for (const m of code.matchAll(combined)) {
    html += escapeHtml(code.slice(last, m.index))
    let kind = null
    if (m.groups) {
      for (const k of order) {
        if (m.groups[k] !== undefined) { kind = k; break }
      }
    }
    html += kind
      ? `<span style="color:${HL[kind]}">${escapeHtml(m[0])}</span>`
      : escapeHtml(m[0])
    last = m.index + m[0].length
  }
  html += escapeHtml(code.slice(last))
  return html
}

function CodeEditor({ code, onChange, lang }) {
  const lines = Math.max(code.split('\n').length, 18)
  const highlighted = highlight(code, lang)

  const handleKeyDown = e => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newCode = code.slice(0, start) + '    ' + code.slice(end)
      onChange(newCode)
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4
      })
    }
  }

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      background: '#fafafa',
      fontFamily: monoStack,
      fontSize: 13,
      lineHeight: '20px',
      overflow: 'hidden',
      minHeight: 0,
    }}>
      <div style={{
        userSelect: 'none',
        padding: '12px 10px',
        background: '#f0f0f0',
        color: '#999',
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        borderRight: `1px solid ${C.borderLight}`,
        minWidth: 44,
        whiteSpace: 'pre',
        fontFamily: monoStack,
      }}>
        {Array.from({ length: lines }, (_, i) => i + 1).join('\n')}
      </div>
      <div style={{ position: 'relative', flex: 1, overflow: 'auto' }}>
        <pre
          style={{
            margin: 0,
            padding: 12,
            fontFamily: monoStack,
            fontSize: 13,
            lineHeight: '20px',
            whiteSpace: 'pre',
            color: '#000',
            minHeight: '100%',
            minWidth: '100%',
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
          dangerouslySetInnerHTML={{ __html: highlighted + ' ' }}
        />
        <textarea
          value={code}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            padding: 12,
            margin: 0,
            fontFamily: monoStack,
            fontSize: 13,
            lineHeight: '20px',
            border: 'none',
            outline: 'none',
            resize: 'none',
            background: 'transparent',
            color: 'transparent',
            caretColor: '#000',
            whiteSpace: 'pre',
            boxSizing: 'border-box',
            overflow: 'hidden',
            tabSize: 4,
          }}
        />
      </div>
    </div>
  )
}

const SAMPLE_INPUT = `5 3
1 1 1 2 3
1 1 1 2 3
2 2 2 0 3
0 -1 -1 3 3
0 0 -1 3 3`

function IDEScreen() {
  const [lang, setLang] = useState('Java 11')
  const [code, setCode] = useState(STARTER_CODE['Java 11'])
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)

  const handleLang = newLang => {
    setLang(newLang)
    if (STARTER_SET.has(code.trim()) || !code.trim()) {
      setCode(STARTER_CODE[newLang])
    }
  }

  const handleRun = () => {
    setRunning(true)
    setOutput('실행 중...')
    setTimeout(() => {
      if (input.trim()) {
        setOutput('50\n\n────────────\n실행 시간: 232 ms\n메모리: 24,432 KB\n종료 코드: 0')
      } else {
        setOutput('⚠ 입력이 비어있습니다. "예제 입력 채우기" 또는 직접 입력하세요.')
      }
      setRunning(false)
    }, 700)
  }

  return (
    <div style={{ display: 'flex', height: 760, borderTop: `1px solid ${C.borderLight}` }}>
      {/* Left: problem panel */}
      <div style={{
        width: '40%',
        borderRight: `1px solid ${C.border}`,
        overflow: 'auto',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${C.borderLight}`,
          background: C.bg,
          fontSize: 12,
          fontWeight: 600,
          color: C.muted,
          letterSpacing: 0.3,
        }}>
          문제
        </div>
        <div style={{ padding: '16px 20px', overflow: 'auto', flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: monoStack, color: C.muted, fontSize: 13 }}>21609</span>
            상어 중학교
            <Tier tier="platinum" level="V" />
          </h2>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.muted, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.borderLight}` }}>
            <span>시간 1초</span>
            <span>메모리 512MB</span>
            <span>정답률 35.6%</span>
          </div>

          <h3 style={{ fontSize: 13, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>문제</h3>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: '0 0 16px' }}>
            상어 중학교에는 교실이 하나 있고, N×N 격자에 블록이 놓여있다.
            인접한 같은 색 블록을 묶어 그룹을 만들고, 가장 큰 그룹을 찾아 제거하는 작업을 반복한다.
          </p>

          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>입력</h3>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: '0 0 16px' }}>
            첫째 줄에 N, M이 주어진다. 둘째 줄부터 N개의 줄에 격자 정보가 주어진다.
          </p>

          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>출력</h3>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: '0 0 16px' }}>
            획득한 점수의 합을 출력한다.
          </p>

          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>예제 입력</h3>
          <pre style={{ background: C.bg, padding: 10, fontSize: 12, margin: '0 0 12px', border: `1px solid ${C.border}`, fontFamily: monoStack, lineHeight: 1.5 }}>
{SAMPLE_INPUT}
          </pre>

          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>예제 출력</h3>
          <pre style={{ background: C.bg, padding: 10, fontSize: 12, margin: '0 0 16px', border: `1px solid ${C.border}`, fontFamily: monoStack, lineHeight: 1.5 }}>50</pre>

          <button
            onClick={() => setInput(SAMPLE_INPUT)}
            style={{
              background: '#fff',
              border: `1px solid ${C.border}`,
              padding: '6px 12px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: fontStack,
              color: C.text,
            }}
          >
            예제 입력 채우기 ↓
          </button>
        </div>
      </div>

      {/* Right: editor + IO + status */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: `1px solid ${C.borderLight}`,
          background: C.bg,
          gap: 8,
        }}>
          <select
            value={lang}
            onChange={e => handleLang(e.target.value)}
            style={{
              border: `1px solid ${C.border}`,
              padding: '4px 8px',
              fontSize: 12,
              fontFamily: fontStack,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <option>Java 11</option>
            <option>Python 3</option>
            <option>C++17</option>
            <option>JavaScript (Node.js)</option>
          </select>
          <button
            onClick={() => setCode(STARTER_CODE[lang])}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px 8px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: fontStack,
              color: C.muted,
            }}
            title="스타터 코드로 초기화"
          >
            ↺ 초기화
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleRun}
            disabled={running}
            style={{
              background: '#fff',
              color: C.text,
              border: `1px solid ${C.border}`,
              padding: '5px 14px',
              fontSize: 12,
              cursor: running ? 'wait' : 'pointer',
              fontFamily: fontStack,
              fontWeight: 600,
            }}
          >
            {running ? '실행 중...' : '▶ 실행'}
          </button>
          <button
            style={{
              background: C.blue,
              color: '#fff',
              border: 'none',
              padding: '6px 18px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: fontStack,
              fontWeight: 600,
            }}
          >
            제출
          </button>
        </div>

        {/* Editor */}
        <CodeEditor code={code} onChange={setCode} lang={lang} />

        {/* IO panel */}
        <div style={{
          display: 'flex',
          borderTop: `1px solid ${C.border}`,
          background: '#fff',
          height: 200,
          minHeight: 200,
        }}>
          <div style={{ flex: 1, borderRight: `1px solid ${C.borderLight}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              background: C.bg,
              borderBottom: `1px solid ${C.borderLight}`,
              letterSpacing: 0.3,
            }}>
              입력
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="테스트 입력을 여기에 붙여넣으세요"
              spellCheck={false}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: 10,
                fontFamily: monoStack,
                fontSize: 12,
                resize: 'none',
                background: '#fff',
                color: C.text,
                lineHeight: 1.5,
              }}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              background: C.bg,
              borderBottom: `1px solid ${C.borderLight}`,
              letterSpacing: 0.3,
            }}>
              출력
            </div>
            <pre style={{
              flex: 1,
              margin: 0,
              padding: 10,
              fontFamily: monoStack,
              fontSize: 12,
              overflow: 'auto',
              background: '#fff',
              color: output.startsWith('⚠') ? C.red : C.text,
              lineHeight: 1.5,
            }}>{output || '실행 결과가 여기에 표시됩니다.'}</pre>
          </div>
        </div>

        {/* Status bar */}
        <div style={{
          display: 'flex',
          padding: '4px 12px',
          fontSize: 11,
          color: C.muted,
          background: C.bg,
          borderTop: `1px solid ${C.borderLight}`,
          gap: 16,
          fontFamily: monoStack,
          alignItems: 'center',
        }}>
          <span>Ln {code.split('\n').length}</span>
          <span>{lang}</span>
          <span>UTF-8</span>
          <span>Spaces: 4</span>
          <div style={{ flex: 1 }} />
          <span>크기: {new Blob([code]).size} B</span>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────── RANKING ────────────────────────────

const RANKING_DATA = [
  { rank: 1,  user: 'algo_god',    seasonTier: 'diamond',  seasonLevel: 'I',   score: 3201, solved: 412, when: '5분 전' },
  { rank: 2,  user: 'park_master', seasonTier: 'diamond',  seasonLevel: 'III', score: 3098, solved: 388, when: '12분 전' },
  { rank: 3,  user: 'kim_dev',     seasonTier: 'diamond',  seasonLevel: 'IV',  score: 2912, solved: 351, when: '3분 전' },
  { rank: 4,  user: 'algo_lover',  seasonTier: 'platinum', seasonLevel: 'II',  score: 2433, solved: 287, when: '1시간 전' },
  { rank: 5,  user: 'cs_student',  seasonTier: 'platinum', seasonLevel: 'III', score: 2298, solved: 263, when: '2분 전' },
  { rank: 6,  user: 'java_kim',    seasonTier: 'platinum', seasonLevel: 'IV',  score: 2102, solved: 244, when: '30분 전' },
  { rank: 7,  user: 'newbie01',    seasonTier: 'gold',     seasonLevel: 'I',   score: 1922, solved: 188, when: '5시간 전' },
  { rank: 8,  user: 'park_test',   seasonTier: 'gold',     seasonLevel: 'II',  score: 1788, solved: 172, when: '8시간 전' },
  { rank: 9,  user: 'lee_solver',  seasonTier: 'gold',     seasonLevel: 'III', score: 1612, solved: 156, when: '1일 전' },
  { rank: 10, user: 'choi_kim',    seasonTier: 'gold',     seasonLevel: 'IV',  score: 1421, solved: 142, when: '12시간 전' },
]

const MY_RANK = { rank: 1234, user: 'me_dev', seasonTier: 'silver', seasonLevel: 'II', score: 422, solved: 47, when: '방금' }

function RankingScreen({ onGoSeason, onPickUser }) {
  const [tab, setTab] = useState('season')
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>랭킹</h1>
        <span style={{ fontSize: 12, color: C.blue, cursor: 'pointer' }} onClick={onGoSeason}>시즌 정보 →</span>
      </div>

      {/* 시즌 정보 */}
      <div style={{
        border: `1px solid ${C.border}`,
        padding: '12px 16px',
        marginBottom: 16,
        background: C.bg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Season 2</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>7월 1일 ~ 9월 30일 · 시즌 종료 시 티어와 점수가 초기화됩니다</div>
        </div>
        <div style={{ fontSize: 13, color: C.muted, textAlign: 'right' }}>
          종료까지 <span style={{ color: C.red, fontWeight: 700 }}>D-72</span>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 0, borderBottom: `1px solid ${C.border}` }}>
        {[
          { id: 'season',  label: '시즌 랭킹' },
          { id: 'total',   label: '전체 랭킹' },
          { id: 'friends', label: '친구' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px 14px',
              fontSize: 13,
              cursor: 'pointer',
              color: tab === t.id ? C.text : C.muted,
              fontWeight: tab === t.id ? 600 : 400,
              borderBottom: tab === t.id ? `2px solid ${C.blue}` : '2px solid transparent',
              marginBottom: -1,
              fontFamily: fontStack,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 표 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, width: 50 }}>순위</th>
            <th style={{ padding: '10px 8px', textAlign: 'left',  fontWeight: 600 }}>아이디</th>
            <th style={{ padding: '10px 8px', textAlign: 'left',  fontWeight: 600 }}>시즌 티어</th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>시즌 점수</th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>푼 문제</th>
            <th style={{ padding: '10px 8px', textAlign: 'left',  fontWeight: 600 }}>최근 활동</th>
          </tr>
        </thead>
        <tbody>
          {RANKING_DATA.map(r => (
            <tr key={r.rank} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: r.rank <= 3 ? 700 : 400, color: r.rank <= 3 ? C.text : C.muted }}>{r.rank}</td>
              <td style={{ padding: '10px 8px' }}><span style={{ color: C.blue, cursor: 'pointer' }} onClick={onPickUser}>{r.user}</span></td>
              <td style={{ padding: '10px 8px' }}><Tier tier={r.seasonTier} level={r.seasonLevel} /></td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{r.score.toLocaleString()}</td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.solved}</td>
              <td style={{ padding: '10px 8px', color: C.muted, fontSize: 12 }}>{r.when}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 내 순위 */}
      <div style={{ marginTop: 24, paddingTop: 12, borderTop: `2px solid ${C.text}` }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>내 순위</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            <tr style={{ background: C.bg, borderBottom: `1px solid ${C.borderLight}` }}>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: C.muted, width: 50 }}>{MY_RANK.rank}</td>
              <td style={{ padding: '10px 8px' }}><span style={{ color: C.blue, cursor: 'pointer', fontWeight: 600 }} onClick={onPickUser}>{MY_RANK.user}</span></td>
              <td style={{ padding: '10px 8px' }}><Tier tier={MY_RANK.seasonTier} level={MY_RANK.seasonLevel} /></td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{MY_RANK.score}</td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{MY_RANK.solved}</td>
              <td style={{ padding: '10px 8px', color: C.muted, fontSize: 12 }}>{MY_RANK.when}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ──────────────────────────── USER PROFILE ────────────────────────────

function generateJandi() {
  const data = []
  for (let w = 0; w < 52; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const seed = w * 7 + d
      const r = Math.sin(seed * 12.9898) * 43758.5453
      const v = r - Math.floor(r)
      let level
      if (v < 0.5) level = 0
      else if (v < 0.75) level = 1
      else if (v < 0.9) level = 2
      else if (v < 0.97) level = 3
      else level = 4
      week.push(level)
    }
    data.push(week)
  }
  return data
}

const JANDI_DATA = generateJandi()
const JANDI_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']

const TITLES = [
  { id: 's1_clear',     label: 'S1 시즌 클리어',  desc: '시즌 1 문제 전부 클리어',         color: C.platinum, owned: true,  fromSeason: 1 },
  { id: 's1_diamond',   label: 'S1 다이아',        desc: '시즌 1 다이아 티어 도달',         color: C.diamond,  owned: true,  fromSeason: 1 },
  { id: 's1_100',       label: 'S1 100문제',       desc: '시즌 1 중 100문제 풀이',          color: C.bronze,   owned: true,  fromSeason: 1 },
  { id: 's0_beta',      label: 'S0 베타 테스터',   desc: '베타 시즌 참여자',                color: C.blue,     owned: true,  fromSeason: 0 },
  { id: 's2_first',     label: 'S2 첫 발걸음',     desc: '시즌 2 문제 1개 클리어',          color: C.silver,   owned: true,  fromSeason: 2 },
  { id: 'streak_30',    label: '30일 연속',         desc: '30일 연속 활동',                   color: C.green,    owned: true,  fromSeason: null },
  { id: 's2_champion',  label: 'S2 챔피언',         desc: '시즌 2 종료 시 1위',              color: C.gold,     owned: false, fromSeason: 2 },
  { id: 's2_diamond',   label: 'S2 다이아',         desc: '시즌 2 다이아 티어 도달',         color: C.diamond,  owned: false, fromSeason: 2 },
  { id: 's2_clear',     label: 'S2 시즌 클리어',    desc: '시즌 2 문제 전부 클리어',         color: C.platinum, owned: false, fromSeason: 2 },
  { id: 's2_100',       label: 'S2 100문제',        desc: '시즌 2 중 100문제 풀이',          color: C.bronze,   owned: false, fromSeason: 2 },
  { id: 'streak_100',   label: '100일 연속',         desc: '100일 연속 활동',                  color: C.green,    owned: false, fromSeason: null },
  { id: 's1_champion',  label: 'S1 챔피언',         desc: '시즌 1 종료 시 1위 (만료됨)',     color: C.gold,     owned: false, fromSeason: 1, expired: true },
]

function TitleBadge({ title, size = 'sm' }) {
  if (!title) return null
  const padding = size === 'sm' ? '3px 8px' : '5px 10px'
  const fontSize = size === 'sm' ? 11 : 12
  const dot = size === 'sm' ? 7 : 8
  return (
    <span style={{
      border: `1px solid ${title.color}`,
      padding,
      fontSize,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: '#fff',
      color: title.color,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: dot, height: dot, background: title.color, transform: 'rotate(45deg)', display: 'inline-block' }} />
      <span>{title.label}</span>
    </span>
  )
}

function UserProfileScreen() {
  const [selectedTitleId, setSelectedTitleId] = useState('s1_clear')
  const selectedTitle = TITLES.find(t => t.id === selectedTitleId) || null
  const owned = TITLES.filter(t => t.owned)
  const locked = TITLES.filter(t => !t.owned)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ width: 72, height: 72, background: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: C.muted, fontFamily: monoStack }}>
          A
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>algo_lover</h1>
            {selectedTitle && <TitleBadge title={selectedTitle} size="md" />}
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: monoStack, marginBottom: 12 }}>가입 2025-12-03</div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>시즌 티어</div>
              <Tier tier="platinum" level="II" />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>시즌 점수 2,433 · 4위</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decay 경고 */}
      <div style={{
        border: `1px solid ${C.red}`,
        background: '#fff5f5',
        padding: '10px 14px',
        marginBottom: 24,
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ color: C.red, fontSize: 16, fontWeight: 700 }}>⚠</span>
        <span>
          <strong>5일간 활동 없음</strong> — 7일 이상 미활동 시 시즌 티어가 하락합니다
        </span>
      </div>

      {/* 통계 */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>통계</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[
              ['푼 문제', '142개',  '제출 횟수', '384건'],
              ['정답률', '49.8%',  '평균 시도', '2.7회'],
              ['연속 일수', '14일', '최장 연속', '32일'],
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                <td style={{ padding: '8px 6px', color: C.muted, width: '15%' }}>{row[0]}</td>
                <td style={{ padding: '8px 6px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', width: '35%' }}>{row[1]}</td>
                <td style={{ padding: '8px 6px', color: C.muted, width: '15%' }}>{row[2]}</td>
                <td style={{ padding: '8px 6px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 칭호 */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
            칭호 <span style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>{owned.length} / {TITLES.length}</span>
          </h2>
          <span style={{ fontSize: 11, color: C.muted }}>클릭해서 닉네임 옆에 표시할 칭호를 선택하세요</span>
        </div>

        {/* 보유 칭호 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>보유</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {/* 선택 안 함 옵션 */}
            <button
              onClick={() => setSelectedTitleId(null)}
              style={{
                border: `1.5px solid ${selectedTitleId === null ? C.blue : C.border}`,
                background: selectedTitleId === null ? '#f0f7ff' : '#fff',
                padding: '10px 12px',
                cursor: 'pointer',
                fontFamily: fontStack,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ width: 9, height: 9, border: `1px dashed ${C.muted}`, display: 'inline-block' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>선택 안 함</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>닉네임만 표시</div>
              </div>
              {selectedTitleId === null && <span style={{ color: C.blue, fontWeight: 700 }}>✓</span>}
            </button>

            {owned.map(t => {
              const isSelected = selectedTitleId === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTitleId(t.id)}
                  style={{
                    border: `1.5px solid ${isSelected ? C.blue : C.border}`,
                    background: isSelected ? '#f0f7ff' : '#fff',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontFamily: fontStack,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ width: 9, height: 9, background: t.color, transform: 'rotate(45deg)', display: 'inline-block', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.color }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                  </div>
                  {isSelected && <span style={{ color: C.blue, fontWeight: 700, flexShrink: 0 }}>✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* 미보유 칭호 */}
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>미보유</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {locked.map(t => (
              <div
                key={t.id}
                style={{
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  padding: '10px 12px',
                  fontFamily: fontStack,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: t.expired ? 0.45 : 0.7,
                }}
              >
                <span style={{ width: 9, height: 9, background: t.color, transform: 'rotate(45deg)', display: 'inline-block', flexShrink: 0, opacity: 0.5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t.label}
                    {t.expired && <span style={{ fontSize: 9, color: C.red, fontWeight: 600 }}>만료</span>}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: C.muted, margin: '14px 0 0', lineHeight: 1.6 }}>
          시즌 한정 칭호는 해당 시즌 종료 후엔 획득 불가. 이미 획득한 칭호는 영구 보유됩니다.
        </p>
      </section>

      {/* 잔디 */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>최근 1년 활동</h2>
          <span style={{ fontSize: 11, color: C.muted }}>342일 활동 · 평균 1.2문제/일</span>
        </div>
        <div style={{ borderTop: `2px solid ${C.text}`, paddingTop: 16 }}>
          <svg viewBox="0 0 720 100" style={{ width: '100%', height: 'auto', display: 'block' }}>
            {JANDI_DATA.map((week, wi) => (
              <g key={wi}>
                {week.map((level, di) => (
                  <rect
                    key={di}
                    x={wi * 14}
                    y={di * 14}
                    width={11}
                    height={11}
                    rx={2}
                    fill={JANDI_COLORS[level]}
                  />
                ))}
              </g>
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 11, color: C.muted }}>
            <span style={{ marginRight: 4 }}>적음</span>
            {JANDI_COLORS.map((c, i) => (
              <span key={i} style={{ width: 11, height: 11, background: c, borderRadius: 2, display: 'inline-block' }} />
            ))}
            <span style={{ marginLeft: 4 }}>많음</span>
          </div>
        </div>
      </section>

      {/* 최근 푼 문제 + 최근 제출 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        <section>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>최근 푼 문제</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {[
                { no: 21609, title: '상어 중학교',   tier: 'platinum', level: 'V',  when: '2시간 전' },
                { no: 1753,  title: '최단경로',     tier: 'gold',     level: 'IV', when: '어제' },
                { no: 11657, title: '타임머신',     tier: 'gold',     level: 'IV', when: '2일 전' },
                { no: 1932,  title: '정수 삼각형', tier: 'silver',   level: 'I',  when: '3일 전' },
              ].map(p => (
                <tr key={p.no} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <td style={{ padding: '8px 6px', fontFamily: monoStack, color: C.muted, width: 55 }}>{p.no}</td>
                  <td style={{ padding: '8px 6px' }}><span style={{ color: C.blue }}>{p.title}</span></td>
                  <td style={{ padding: '8px 6px' }}><Tier tier={p.tier} level={p.level} /></td>
                  <td style={{ padding: '8px 6px', color: C.muted, fontSize: 11, textAlign: 'right' }}>{p.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>최근 제출</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {[
                { no: 21609, title: '상어 중학교', result: '맞았습니다!!', when: '2시간 전' },
                { no: 21609, title: '상어 중학교', result: '틀렸습니다',   when: '2시간 전' },
                { no: 1753,  title: '최단경로',   result: '맞았습니다!!', when: '어제' },
                { no: 11657, title: '타임머신',   result: '시간 초과',   when: '2일 전' },
              ].map((s, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <td style={{ padding: '8px 6px', fontFamily: monoStack, color: C.muted, width: 55 }}>{s.no}</td>
                  <td style={{ padding: '8px 6px' }}><span style={{ color: C.blue }}>{s.title}</span></td>
                  <td style={{ padding: '8px 6px', color: resultColor(s.result), fontSize: 11, fontWeight: 600 }}>{s.result}</td>
                  <td style={{ padding: '8px 6px', color: C.muted, fontSize: 11, textAlign: 'right' }}>{s.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

// ──────────────────────────── SEASON ────────────────────────────

function SeasonScreen({ onGoProblems }) {
  const current = SEASONS.find(s => s.status === 'current')
  const past = SEASONS.filter(s => s.status === 'past')
  const problems = current.problems
  const cleared = problems.filter(p => p.status === 'cleared').length
  const total = problems.length

  return (
    <div>
      {/* 시즌 정보 */}
      <section style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>{current.label}</h1>
          <span style={{ fontSize: 13, color: C.muted }}>{current.period}</span>
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 16px', lineHeight: 1.6 }}>
          이번 시즌의 문제를 풀면 <strong style={{ color: C.text }}>시즌 랭킹 점수</strong>가 올라갑니다.
          시즌 종료 시 티어와 점수가 모두 초기화됩니다.
        </p>

        {/* 진행률 바 */}
        <div style={{ position: 'relative', marginTop: 16 }}>
          <div style={{ height: 6, background: C.borderLight, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '22%', background: C.blue }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginTop: 6 }}>
            <span>시작 (7/1)</span>
            <span style={{ color: C.red, fontWeight: 600 }}>오늘 · D-{current.dDay}</span>
            <span>종료 (9/30)</span>
          </div>
        </div>
      </section>

      {/* 시즌 문제 */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>시즌 문제</h2>
            <p style={{ fontSize: 12, color: C.muted, margin: '4px 0 0' }}>
              이번 시즌 한정 문제 · 시즌 종료 후엔 랭킹 점수가 부여되지 않음
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{cleared} <span style={{ color: C.muted, fontSize: 14, fontWeight: 400 }}>/ {total}</span></div>
            <div style={{ fontSize: 11, color: C.muted }}>{Math.round(cleared / total * 100)}% 완료</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderTop: `2px solid ${C.text}`, borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '10px 8px', textAlign: 'left',  fontWeight: 600, width: 70 }}>번호</th>
              <th style={{ padding: '10px 8px', textAlign: 'left',  fontWeight: 600 }}>제목</th>
              <th style={{ padding: '10px 8px', textAlign: 'left',  fontWeight: 600, width: 120 }}>난이도</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, width: 70 }}>점수</th>
              <th style={{ padding: '10px 8px', textAlign: 'left',  fontWeight: 600, width: 80 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {problems.map(p => {
              const st = STATUS_BADGE[p.status]
              const pts = pointsOf(p.tier, p.level)
              return (
                <tr key={p.no} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <td style={{ padding: '10px 8px', fontFamily: monoStack, color: C.muted, fontSize: 12 }}>{p.no}</td>
                  <td style={{ padding: '10px 8px' }}><span style={{ color: C.blue, cursor: 'pointer' }}>{p.title}</span></td>
                  <td style={{ padding: '10px 8px' }}><Tier tier={p.tier} level={p.level} /></td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{pts}점</td>
                  <td style={{ padding: '10px 8px', color: st.color, fontWeight: 600, fontSize: 12 }}>{st.label}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 10, fontSize: 12, color: C.blue, cursor: 'pointer' }} onClick={onGoProblems}>
          문제 화면에서 보기 →
        </div>
      </section>

      {/* 시즌 리워드 */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>시즌 리워드</h2>
        <p style={{ fontSize: 12, color: C.muted, margin: '0 0 12px' }}>시즌 한정 뱃지 · 프로필 장식. 시즌 종료 후엔 획득 불가.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderTop: `2px solid ${C.text}`, borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600 }}>리워드</th>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600 }}>조건</th>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, width: 180 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {[
              { badge: 'S2 챔피언',         color: C.gold,     cond: '시즌 종료 시 1위',                 status: '진행중 (4위)',           achieved: false },
              { badge: 'S2 다이아',         color: C.diamond,  cond: '시즌 다이아 티어 도달',            status: '진행중 (플래티넘 II)',   achieved: false },
              { badge: 'S2 시즌 클리어',    color: C.platinum, cond: '시즌 문제 15개 모두 클리어',       status: '진행중 (7/15)',          achieved: false },
              { badge: 'S2 첫 발걸음',      color: C.silver,   cond: '시즌 문제 1개 클리어',             status: '달성',                   achieved: true },
              { badge: 'S2 100문제',        color: C.bronze,   cond: '시즌 중 100문제 풀이',             status: '진행중 (47/100)',        achieved: false },
            ].map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: r.achieved ? 1 : 0.5 }}>
                    <span style={{ width: 11, height: 11, background: r.color, transform: 'rotate(45deg)', display: 'inline-block' }} />
                    <span style={{ fontWeight: 600 }}>{r.badge}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 8px', color: C.muted, fontSize: 12 }}>{r.cond}</td>
                <td style={{ padding: '10px 8px', color: r.achieved ? C.green : C.muted, fontSize: 12, fontWeight: 600 }}>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 이전 시즌 */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>이전 시즌</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderTop: `2px solid ${C.text}`, borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600 }}>시즌</th>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600 }}>기간</th>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600 }}>챔피언</th>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600 }}>최종 티어</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              <td style={{ padding: '10px 8px', fontWeight: 600 }}>Season 1</td>
              <td style={{ padding: '10px 8px', color: C.muted, fontSize: 12 }}>4/1 ~ 6/30</td>
              <td style={{ padding: '10px 8px' }}><span style={{ color: C.blue, cursor: 'pointer' }}>algo_god</span></td>
              <td style={{ padding: '10px 8px' }}><Tier tier="diamond" level="II" /></td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              <td style={{ padding: '10px 8px', fontWeight: 600 }}>Season 0</td>
              <td style={{ padding: '10px 8px', color: C.muted, fontSize: 12 }}>베타 시즌</td>
              <td style={{ padding: '10px 8px' }}><span style={{ color: C.blue, cursor: 'pointer' }}>park_master</span></td>
              <td style={{ padding: '10px 8px' }}><Tier tier="diamond" level="I" /></td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}


// ──────────────────────────── PROBLEM DISCUSSION ────────────────────────────

const DISCUSSION_POSTS = [
  { tag: '코드리뷰', title: 'O(N²) 풀이 공유합니다 — 시간복잡도 개선 의견 받아요', author: 'algo_lover',  authorTier: 'platinum', comments: 12, votes: 24, when: '2시간 전' },
  { tag: '풀이공유', title: '시뮬레이션 + BFS 조합으로 풀었습니다',               author: 'park_master', authorTier: 'diamond',  comments: 8,  votes: 41, when: '5시간 전' },
  { tag: '풀이공유', title: 'BFS 시작점 처리 — 다들 어떻게 푸셨나요?',         author: 'newbie01',    authorTier: 'silver',   comments: 5,  votes: 3,  when: '8시간 전' },
  { tag: '코드리뷰', title: 'Java로 풀이 — 가독성 개선 부탁드립니다',           author: 'java_kim',    authorTier: 'gold',     comments: 6,  votes: 12, when: '12시간 전' },
  { tag: '풀이공유', title: 'Python 88ms 풀이 — 최적화 팁',                     author: 'cs_student',  authorTier: 'platinum', comments: 22, votes: 67, when: '어제' },
  { tag: '풀이공유', title: '회전 처리 시 4방향 우선순위 어떻게 잡으시나요?',   author: 'kim_dev',     authorTier: 'platinum', comments: 3,  votes: 7,  when: '2일 전' },
]

const TAG_COLOR = {
  '코드리뷰': C.blue,
  '풀이공유': C.green,
}

function ProblemDiscussionScreen({ onSolve }) {
  const [solved, setSolved] = useState(false)
  return (
    <div>
      {/* 와이어프레임 데모용 토글 */}
      <div style={{
        background: '#fffbea',
        border: `1px dashed #d4a72c`,
        padding: '6px 12px',
        marginBottom: 16,
        fontSize: 12,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}>
        <span style={{ color: C.muted }}>와이어프레임 데모:</span>
        <button
          onClick={() => setSolved(false)}
          style={{
            background: !solved ? C.text : '#fff',
            color: !solved ? '#fff' : C.text,
            border: `1px solid ${C.border}`,
            padding: '3px 10px',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: fontStack,
          }}
        >
          미해결 상태
        </button>
        <button
          onClick={() => setSolved(true)}
          style={{
            background: solved ? C.text : '#fff',
            color: solved ? '#fff' : C.text,
            border: `1px solid ${C.border}`,
            padding: '3px 10px',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: fontStack,
          }}
        >
          정답자 상태
        </button>
      </div>

      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
        <span style={{ color: C.blue, cursor: 'pointer' }}>21609번 · 상어 중학교</span> / 토론
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: monoStack, color: C.muted, fontSize: 18 }}>21609</span>
        상어 중학교
        <Tier tier="platinum" level="V" />
      </h1>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {['문제', '내 제출', '토론'].map((t, i) => (
          <div key={t} style={{
            padding: '8px 14px',
            fontSize: 13,
            color: i === 2 ? C.text : C.muted,
            fontWeight: i === 2 ? 600 : 400,
            borderBottom: i === 2 ? `2px solid ${C.blue}` : '2px solid transparent',
            marginBottom: -1,
            cursor: 'pointer',
          }}>
            {t}
            {i === 2 && <span style={{ marginLeft: 6, fontSize: 11, color: C.muted, fontWeight: 400 }}>234</span>}
          </div>
        ))}
      </div>

      {!solved ? (
        // 잠금 상태
        <div style={{
          border: `1px solid ${C.border}`,
          padding: '48px 24px',
          textAlign: 'center',
          background: C.bg,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>
            이 문제를 풀어야 토론에 참여할 수 있습니다
          </h2>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px', lineHeight: 1.7 }}>
            답안 복사 방지를 위해, 문제를 푼 사용자만<br />
            토론과 공개 답안 코드를 볼 수 있어요
          </p>
          <button
            onClick={onSolve}
            style={{
              background: C.blue, color: '#fff', border: 'none', padding: '10px 22px', fontSize: 14, cursor: 'pointer', fontWeight: 600, fontFamily: fontStack,
            }}
          >
            문제 풀기 →
          </button>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.borderLight}`, fontSize: 12, color: C.muted }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
              <span><strong>234</strong>개 토론</span>
              <span><strong>89</strong>개 공개 답안</span>
              <span><strong>156</strong>개 코드 리뷰</span>
            </div>
          </div>
        </div>
      ) : (
        // 해제 상태
        <div>
          <div style={{
            border: `1px solid ${C.green}`,
            background: '#f0fff4',
            padding: '8px 14px',
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ color: C.green, fontSize: 14, fontWeight: 700 }}>✓</span>
            <span><strong>정답자 권한 활성화</strong> · 2025-11-20 첫 해결</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['전체', '코드 리뷰', '풀이 공유'].map((label, i) => (
                <button key={label} style={{
                  background: '#fff',
                  color: i === 0 ? C.text : C.muted,
                  border: `1px solid ${i === 0 ? C.text : C.border}`,
                  padding: '5px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: fontStack,
                  fontWeight: i === 0 ? 600 : 400,
                }}>
                  {label}
                </button>
              ))}
            </div>
            <button style={{
              background: C.blue, color: '#fff', border: 'none', padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600, fontFamily: fontStack,
            }}>
              + 글쓰기
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderTop: `2px solid ${C.text}`, borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: '10px 6px', textAlign: 'left',  fontWeight: 600, width: 80 }}>분류</th>
                <th style={{ padding: '10px 6px', textAlign: 'left',  fontWeight: 600 }}>제목</th>
                <th style={{ padding: '10px 6px', textAlign: 'left',  fontWeight: 600, width: 130 }}>작성자</th>
                <th style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 600, width: 50 }}>댓글</th>
                <th style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 600, width: 60 }}>추천</th>
                <th style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 600, width: 90 }}>작성</th>
              </tr>
            </thead>
            <tbody>
              {DISCUSSION_POSTS.map((p, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <td style={{ padding: '10px 6px' }}>
                    <span style={{ fontSize: 11, color: TAG_COLOR[p.tag], fontWeight: 600 }}>[{p.tag}]</span>
                  </td>
                  <td style={{ padding: '10px 6px' }}>
                    <span style={{ color: C.text, cursor: 'pointer' }}>{p.title}</span>
                  </td>
                  <td style={{ padding: '10px 6px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, background: tierMap[p.authorTier].color, transform: 'rotate(45deg)', display: 'inline-block' }} />
                      <span style={{ color: C.blue, fontSize: 12 }}>{p.author}</span>
                    </span>
                  </td>
                  <td style={{ padding: '10px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: C.muted, fontSize: 12 }}>{p.comments}</td>
                  <td style={{ padding: '10px 6px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: C.muted, fontSize: 12 }}>+{p.votes}</td>
                  <td style={{ padding: '10px 6px', textAlign: 'right', color: C.muted, fontSize: 11 }}>{p.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────── OVERVIEW WRAPPER ────────────────────────────

const SOURCE_WIDTH = 1200

function ScreenFrame({ navId, fullWidth, children }) {
  return (
    <div style={{ fontFamily: fontStack, background: '#fff', color: C.text, width: SOURCE_WIDTH }}>
      <Nav current={navId} />
      {fullWidth ? children : (
        <main className="max-w-5xl mx-auto px-4" style={{ paddingTop: 24, paddingBottom: 48 }}>
          {children}
        </main>
      )}
    </div>
  )
}

function Thumbnail({ width = 360, height = 500, onClick, children }) {
  const scale = width / SOURCE_WIDTH
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width,
        height,
        background: '#fff',
        border: `1px solid ${hover ? C.muted : C.border}`,
        boxShadow: hover ? '0 6px 20px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 4,
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div style={{
        width: SOURCE_WIDTH,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        pointerEvents: 'none',
      }}>
        {children}
      </div>
    </div>
  )
}

function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 100,
        padding: '32px 16px',
        overflow: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 6,
          maxWidth: 1280,
          width: '100%',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${C.borderLight}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: C.bg,
          fontFamily: fontStack,
        }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: C.muted }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 22,
              color: C.muted,
              padding: '0 6px',
              lineHeight: 1,
              fontFamily: fontStack,
            }}
            aria-label="닫기"
          >×</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

const SCREENS = [
  {
    id: 'home',
    label: '1. 홈 (개인화)',
    desc: '시즌 티어 · decay 경고 · 추천 · 친구 순위 · 시즌',
    navId: 'home',
    render: (ctx) => <HomeScreen
      onPickProblem={() => ctx.navigate('detail')}
      onGoProblems={() => ctx.navigate('problems')}
      onGoRanking={() => ctx.navigate('ranking')}
      onGoSeason={() => ctx.navigate('season')}
      onGoProfile={() => ctx.navigate('profile')}
      onGoIDE={() => ctx.navigate('ide')}
    />,
  },
  {
    id: 'problems',
    label: '2. 문제 (문제 목록 탭)',
    desc: '시즌 탭 · 검색 · 표 · 점수 · 상태',
    navId: 'problems',
    render: () => <ProblemListScreen initialTab="problems" />,
  },
  {
    id: 'detail',
    label: '3. 문제 상세',
    desc: '메타 표 · 본문 · 예제 · 문제 풀기 진입',
    navId: 'detail',
    render: (ctx) => <ProblemDetailScreen onSolve={() => ctx.navigate('ide')} />,
  },
  {
    id: 'ide',
    label: '4. IDE',
    desc: '문제 + 에디터 + 입출력 (분할 뷰)',
    navId: 'ide',
    render: () => <IDEScreen />,
    fullWidth: true,
  },
  {
    id: 'discussion',
    label: '5. 문제 토론',
    desc: '해결자만 진입 · 잠금/해제 두 상태',
    navId: 'problems',
    render: (ctx) => <ProblemDiscussionScreen onSolve={() => ctx.navigate('ide')} />,
  },
  {
    id: 'submissions',
    label: '6. 문제 (채점 현황 탭)',
    desc: '문제 페이지 내 탭 · 결과 색상 구분',
    navId: 'problems',
    render: () => <ProblemListScreen initialTab="submissions" />,
  },
  {
    id: 'ranking',
    label: '7. 랭킹',
    desc: '시즌/전체 토글 · 두 티어 분리 · 내 순위',
    navId: 'ranking',
    render: (ctx) => <RankingScreen
      onGoSeason={() => ctx.navigate('season')}
      onPickUser={() => ctx.navigate('profile')}
    />,
  },
  {
    id: 'season',
    label: '8. 시즌',
    desc: '진행률 · 챌린지 · 리워드 · 이전 시즌',
    navId: 'ranking',
    render: (ctx) => <SeasonScreen onGoProblems={() => ctx.navigate('problems')} />,
  },
  {
    id: 'profile',
    label: '9. 유저 프로필',
    desc: '시즌 티어 · 칭호 선택 · decay 경고 · 잔디',
    navId: 'ranking',
    render: () => <UserProfileScreen />,
  },
]

export default function App() {
  const [expandedId, setExpandedId] = useState(null)
  const expanded = SCREENS.find(s => s.id === expandedId)

  return (
    <div style={{
      fontFamily: fontStack,
      background: '#eef0f2',
      minHeight: '100vh',
      color: C.text,
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>
        <header style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            Wireframe Overview
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', letterSpacing: -0.5 }}>
            Grind<span style={{ color: C.blue }}>Algorithm</span>
          </h1>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
            {SCREENS.length}개 화면 · 썸네일 클릭하면 풀사이즈로 열림 (ESC로 닫기)
          </p>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 28,
        }}>
          {SCREENS.map(s => (
            <div key={s.id}>
              <Thumbnail onClick={() => setExpandedId(s.id)}>
                <ScreenFrame navId={s.navId} fullWidth={s.fullWidth}>
                  {s.render({ navigate: setExpandedId })}
                </ScreenFrame>
              </Thumbnail>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.label}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.desc}</div>
              </div>
            </div>
          ))}

          {/* Placeholder slot for adding more screens */}
          <div>
            <div style={{
              width: '100%',
              maxWidth: 360,
              height: 500,
              border: `1.5px dashed ${C.border}`,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.muted,
              fontSize: 13,
              background: 'transparent',
            }}>
              + 화면 추가 슬롯
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>다음 후보</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                채점 결과 상세 · 유저 프로필 · 랭킹 등
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={!!expandedId}
        title={expanded ? expanded.label : ''}
        onClose={() => setExpandedId(null)}
      >
        {expanded && (
          <ScreenFrame navId={expanded.navId} fullWidth={expanded.fullWidth}>
            {expanded.render({ navigate: setExpandedId })}
          </ScreenFrame>
        )}
      </Modal>
    </div>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { C, fontStack } from '../theme'
import { Tier } from '../components/Tier'
import { DecayBanner } from '../components/DecayBanner'
import { JandiGrid } from '../components/JandiGrid'
import { LoadingView, ErrorView } from '../components/Feedback'
import { bodyRowStyle, numCell, tableStyle, td, th, theadRowStyle } from '../components/table'
import { monoStack } from '../theme'
import { formatShortDate, toJandiWeeks } from '../utils/format'
import type { RecommendReason } from '../types/domain'

function reasonColor(r: RecommendReason): string {
  if (r === 'tier_up') return C.blue
  if (r === 'weak_area') return C.red
  return C.muted
}

export function HomePage() {
  const navigate = useNavigate()
  const { me } = useAuth()
  const { data, loading, error, reload } = useApi(() => api.getDashboard(), [])

  if (loading) return <LoadingView />
  if (error || !data) return <ErrorView error={error ?? new Error('데이터 없음')} onRetry={reload} />

  const d = data
  const goNextProblem = () =>
    navigate(d.season.nextProblemId ? `/problems/${d.season.nextProblemId}/solve` : '/problems')

  return (
    <div>
      {/* Personal Hero */}
      <section
        style={{ borderBottom: `1px solid ${C.borderLight}`, paddingBottom: 20, marginBottom: 24 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 24,
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>안녕하세요,</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
              <Link to={`/users/${me?.handle}`}>
                {me?.handle}{' '}
                <span style={{ color: C.muted, fontSize: 13, fontWeight: 400 }}>님</span>
              </Link>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  marginBottom: 4,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                시즌 티어
              </div>
              {me?.seasonTier && <Tier tier={me.seasonTier} />}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                {me?.seasonScore.toLocaleString()}점 ·{' '}
                <Link to="/ranking" style={{ color: C.blue }}>
                  {me?.seasonRank}위
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decay 경고 */}
      {d.decay && <DecayBanner decay={d.decay} variant="home" onAction={goNextProblem} />}

      {/* Body: 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28 }}>
        {/* LEFT */}
        <div>
          {/* 오늘의 추천 */}
          <section style={{ marginBottom: 28 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 10,
              }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>오늘의 추천</h2>
              <Link to="/problems" style={{ fontSize: 12, color: C.blue }}>
                전체 문제 →
              </Link>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr style={theadRowStyle}>
                  <th style={th({ padding: '8px 6px', width: 60 })}>번호</th>
                  <th style={th({ padding: '8px 6px' })}>제목</th>
                  <th style={th({ padding: '8px 6px', width: 110 })}>난이도</th>
                  <th style={th({ padding: '8px 6px', width: 130 })}>추천 이유</th>
                </tr>
              </thead>
              <tbody>
                {d.todayPicks.map(p => (
                  <tr key={p.problemId} style={bodyRowStyle}>
                    <td style={td({ padding: '8px 6px', fontFamily: monoStack, color: C.muted })}>
                      {p.displayNo}
                    </td>
                    <td style={td({ padding: '8px 6px' })}>
                      <Link to={`/problems/${p.problemId}`} style={{ color: C.blue }}>
                        {p.title}
                      </Link>
                    </td>
                    <td style={td({ padding: '8px 6px' })}>
                      <Tier tier={p.tier} />
                    </td>
                    <td
                      style={td({
                        padding: '8px 6px',
                        color: reasonColor(p.reasonType),
                        fontSize: 12,
                        fontWeight: p.reasonType === 'tier_up' || p.reasonType === 'weak_area' ? 600 : 400,
                      })}
                    >
                      {p.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 내 주변 순위 */}
          <section>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 10,
              }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>내 주변 순위</h2>
              <Link to="/ranking" style={{ fontSize: 12, color: C.blue }}>
                전체 랭킹 →
              </Link>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr style={theadRowStyle}>
                  <th style={th({ padding: '8px 6px', textAlign: 'right', width: 60 })}>순위</th>
                  <th style={th({ padding: '8px 6px' })}>아이디</th>
                  <th style={th({ padding: '8px 6px', width: 110 })}>시즌 티어</th>
                  <th style={th({ padding: '8px 6px', textAlign: 'right', width: 80 })}>7일 변동</th>
                </tr>
              </thead>
              <tbody>
                {d.nearbyRanking.map(f => (
                  <tr
                    key={f.rank}
                    style={{ ...bodyRowStyle, background: f.isMe ? C.bg : 'transparent' }}
                  >
                    <td style={td({ padding: '8px 6px', ...numCell, color: C.muted })}>
                      {f.rank.toLocaleString()}
                    </td>
                    <td style={td({ padding: '8px 6px' })}>
                      <Link
                        to={`/users/${f.handle}`}
                        style={{ color: C.blue, fontWeight: f.isMe ? 700 : 400 }}
                      >
                        {f.handle}{' '}
                        {f.isMe && (
                          <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>(나)</span>
                        )}
                      </Link>
                    </td>
                    <td style={td({ padding: '8px 6px' })}>
                      <Tier tier={f.tier} />
                    </td>
                    <td
                      style={td({
                        padding: '8px 6px',
                        ...numCell,
                        fontSize: 12,
                        fontWeight: 600,
                        color: f.weeklyDelta > 0 ? C.green : f.weeklyDelta < 0 ? C.red : C.muted,
                      })}
                    >
                      {f.weeklyDelta === 0
                        ? '–'
                        : f.weeklyDelta > 0
                          ? `+${f.weeklyDelta}`
                          : `${f.weeklyDelta}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* RIGHT */}
        <aside>
          {/* 시즌 진행 */}
          <section
            style={{ marginBottom: 28, border: `1px solid ${C.border}`, padding: 14, background: C.bg }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 4,
              }}
            >
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{d.season.name}</h2>
              <span style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>D-{d.season.dDay}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
              {formatShortDate(d.season.startDate)} ~ {formatShortDate(d.season.endDate)}
            </div>

            <div
              style={{
                height: 4,
                background: C.borderLight,
                borderRadius: 2,
                overflow: 'hidden',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.round(d.season.progressRatio * 100)}%`,
                  background: C.blue,
                }}
              />
            </div>

            <div style={{ paddingTop: 12, borderTop: `1px solid ${C.borderLight}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.muted }}>시즌 문제</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>
                  {d.season.solvedCount}{' '}
                  <span style={{ color: C.muted, fontWeight: 400 }}>/ {d.season.totalCount}</span>
                </span>
              </div>
              <button
                onClick={goNextProblem}
                style={{
                  width: '100%',
                  background: C.blue,
                  color: '#fff',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontFamily: fontStack,
                  marginTop: 8,
                }}
              >
                다음 시즌 문제 풀기 →
              </button>
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <Link to="/season" style={{ fontSize: 11, color: C.blue }}>
                  시즌 상세 보기
                </Link>
              </div>
            </div>
          </section>

          {/* 이번 주 활동 */}
          <section style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 700,
                margin: '0 0 10px',
                paddingBottom: 6,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              이번 주
            </h2>
            <table style={tableStyle}>
              <tbody>
                {[
                  ['푼 문제', `${d.weekly.solvedCount}개`],
                  ['시즌 점수', `+${d.weekly.scoreGained}`],
                  ['연속 일수', `${d.weekly.streakDays}일`],
                  ['정답률', `${d.weekly.accuracyRate.toFixed(1)}%`],
                ].map(([k, v]) => (
                  <tr key={k} style={bodyRowStyle}>
                    <td style={td({ padding: '6px 4px', color: C.muted, fontSize: 12 })}>{k}</td>
                    <td
                      style={td({
                        padding: '6px 4px',
                        ...numCell,
                        fontWeight: 600,
                        color: v.startsWith('+') ? C.green : C.text,
                      })}
                    >
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 공지 */}
          <section>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 700,
                margin: '0 0 10px',
                paddingBottom: 6,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              공지
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {d.notices.map(n => (
                <li
                  key={n.id}
                  style={{ padding: '6px 0', fontSize: 12, display: 'flex', gap: 6, alignItems: 'baseline' }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: n.highlight ? C.red : C.muted,
                      fontWeight: 600,
                      minWidth: 40,
                    }}
                  >
                    [{n.tag}]
                  </span>
                  <span style={{ color: C.blue, cursor: 'pointer', flex: 1, lineHeight: 1.5 }}>
                    {n.title}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {/* 이번 시즌 활동 (잔디) */}
      <section style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.borderLight}` }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 10,
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>이번 시즌 활동</h2>
          <span style={{ fontSize: 11, color: C.muted }}>
            {d.seasonActivity.activeDays}일 활동 · 평균 {d.seasonActivity.avgPerDay}문제/일 ·{' '}
            <Link to={`/users/${me?.handle}`} style={{ color: C.blue }}>
              1년 활동 보기 →
            </Link>
          </span>
        </div>
        <JandiGrid weeks={toJandiWeeks(d.seasonActivity.days)} style={{ maxWidth: 360 }} />
      </section>
    </div>
  )
}

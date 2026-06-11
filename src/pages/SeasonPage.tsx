import { Link } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { C, monoStack, titleColorMap } from '../theme'
import { Tier } from '../components/Tier'
import { LoadingView, ErrorView } from '../components/Feedback'
import { bodyRowStyle, numCell, tableStyle, td, th, theadRowStyle } from '../components/table'
import { formatShortDate } from '../utils/format'
import type { ProblemStatus } from '../types/domain'

const STATUS_BADGE: Record<ProblemStatus, { label: string; color: string }> = {
  cleared: { label: '✓ 클리어', color: C.green },
  wip: { label: '시도중', color: C.blue },
  untried: { label: '—', color: C.muted },
}

export function SeasonPage() {
  const { data, loading, error, reload } = useApi(() => api.getCurrentSeasonDetail(), [])

  if (loading) return <LoadingView />
  if (error || !data) return <ErrorView error={error ?? new Error('데이터 없음')} onRetry={reload} />

  const { season, problems, rewards, pastSeasons, progressRatio } = data
  const cleared = problems.filter(p => p.myStatus === 'cleared').length
  const total = problems.length

  return (
    <div>
      {/* 시즌 정보 */}
      <section style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.borderLight}` }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 8,
          }}
        >
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
            {season.name}
          </h1>
          <span style={{ fontSize: 13, color: C.muted }}>
            {formatShortDate(season.startDate)} ~ {formatShortDate(season.endDate)}
          </span>
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 16px', lineHeight: 1.6 }}>
          이번 시즌의 문제를 풀면 <strong style={{ color: C.text }}>시즌 랭킹 점수</strong>가
          올라갑니다. 시즌 종료 시 티어와 점수가 모두 초기화됩니다.
        </p>

        {/* 진행률 바 */}
        <div style={{ position: 'relative', marginTop: 16 }}>
          <div style={{ height: 6, background: C.borderLight, borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.round(progressRatio * 100)}%`,
                background: C.blue,
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: C.muted,
              marginTop: 6,
            }}
          >
            <span>시작 ({formatShortDate(season.startDate)})</span>
            <span style={{ color: C.red, fontWeight: 600 }}>오늘 · D-{season.dDay ?? '-'}</span>
            <span>종료 ({formatShortDate(season.endDate)})</span>
          </div>
        </div>
      </section>

      {/* 시즌 문제 */}
      <section style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 12,
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>시즌 문제</h2>
            <p style={{ fontSize: 12, color: C.muted, margin: '4px 0 0' }}>
              이번 시즌 한정 문제 · 시즌 종료 후엔 랭킹 점수가 부여되지 않음
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {cleared}{' '}
              <span style={{ color: C.muted, fontSize: 14, fontWeight: 400 }}>/ {total}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              {total > 0 ? Math.round((cleared / total) * 100) : 0}% 완료
            </div>
          </div>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr style={theadRowStyle}>
              <th style={th({ width: 70 })}>번호</th>
              <th style={th()}>제목</th>
              <th style={th({ width: 120 })}>난이도</th>
              <th style={th({ textAlign: 'right', width: 70 })}>점수</th>
              <th style={th({ width: 80 })}>상태</th>
            </tr>
          </thead>
          <tbody>
            {problems.map(p => {
              const st = STATUS_BADGE[p.myStatus]
              return (
                <tr key={p.problemId} style={bodyRowStyle}>
                  <td style={td({ fontFamily: monoStack, color: C.muted, fontSize: 12 })}>
                    {p.displayNo}
                  </td>
                  <td style={td()}>
                    <Link to={`/problems/${p.problemId}`} style={{ color: C.blue }}>
                      {p.title}
                    </Link>
                  </td>
                  <td style={td()}>
                    <Tier tier={p.tier} />
                  </td>
                  <td style={td({ ...numCell, fontWeight: 600 })}>{p.points}점</td>
                  <td style={td({ color: st.color, fontWeight: 600, fontSize: 12 })}>{st.label}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 10, fontSize: 12 }}>
          <Link to={`/problems?season=${season.id}`} style={{ color: C.blue }}>
            문제 화면에서 보기 →
          </Link>
        </div>
      </section>

      {/* 시즌 리워드 */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>시즌 리워드</h2>
        <p style={{ fontSize: 12, color: C.muted, margin: '0 0 12px' }}>
          시즌 한정 뱃지 · 프로필 장식. 시즌 종료 후엔 획득 불가.
        </p>
        <table style={tableStyle}>
          <thead>
            <tr style={theadRowStyle}>
              <th style={th()}>리워드</th>
              <th style={th()}>조건</th>
              <th style={th({ width: 180 })}>상태</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map(r => (
              <tr key={r.id} style={bodyRowStyle}>
                <td style={td()}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      opacity: r.achieved ? 1 : 0.5,
                    }}
                  >
                    <span
                      style={{
                        width: 11,
                        height: 11,
                        background: titleColorMap[r.colorKey],
                        transform: 'rotate(45deg)',
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{r.name}</span>
                  </div>
                </td>
                <td style={td({ color: C.muted, fontSize: 12 })}>{r.condition}</td>
                <td
                  style={td({
                    color: r.achieved ? C.green : C.muted,
                    fontSize: 12,
                    fontWeight: 600,
                  })}
                >
                  {r.progressText}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 이전 시즌 */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>이전 시즌</h2>
        <table style={tableStyle}>
          <thead>
            <tr style={theadRowStyle}>
              <th style={th()}>시즌</th>
              <th style={th()}>기간</th>
              <th style={th()}>챔피언</th>
              <th style={th()}>최종 티어</th>
            </tr>
          </thead>
          <tbody>
            {pastSeasons.map(s => (
              <tr key={s.id} style={bodyRowStyle}>
                <td style={td({ fontWeight: 600 })}>{s.name}</td>
                <td style={td({ color: C.muted, fontSize: 12 })}>{s.periodText}</td>
                <td style={td()}>
                  <Link to={`/users/${s.champion.handle}`} style={{ color: C.blue }}>
                    {s.champion.handle}
                  </Link>
                </td>
                <td style={td()}>
                  <Tier tier={s.champion.tier} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

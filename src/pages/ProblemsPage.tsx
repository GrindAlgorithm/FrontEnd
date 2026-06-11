import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { C, fontStack, monoStack } from '../theme'
import { Tier } from '../components/Tier'
import { TabBar } from '../components/TabBar'
import { LoadingView, ErrorView } from '../components/Feedback'
import { SubmissionsTable } from '../components/SubmissionsTable'
import { bodyRowStyle, numCell, tableStyle, td, th, theadRowStyle } from '../components/table'
import { formatShortDate } from '../utils/format'
import type { ProblemStatus, SeasonSummary } from '../types/domain'

const STATUS_BADGE: Record<ProblemStatus, { label: string; color: string }> = {
  cleared: { label: '✓ 클리어', color: C.green },
  wip: { label: '시도중', color: C.blue },
  untried: { label: '—', color: C.muted },
}

export function ProblemsPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'submissions' ? 'submissions' : 'problems'
  const seasons = useApi(() => api.getSeasons(), [])

  const setTab = (id: string) => {
    const next = new URLSearchParams(params)
    if (id === 'submissions') next.set('tab', 'submissions')
    else next.delete('tab')
    setParams(next, { replace: true })
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>문제</h1>

      {/* Top tabs: 문제 목록 / 채점 현황 — 채점 현황은 별도 화면이 아닌 내부 탭 (Key Decision) */}
      <TabBar
        tabs={[
          { id: 'problems', label: '문제 목록' },
          { id: 'submissions', label: '채점 현황' },
        ]}
        active={tab}
        onChange={setTab}
        fontSize={14}
      />

      {tab === 'submissions' ? (
        <SubmissionsView />
      ) : seasons.loading ? (
        <LoadingView />
      ) : seasons.error || !seasons.data ? (
        <ErrorView error={seasons.error ?? new Error('데이터 없음')} onRetry={seasons.reload} />
      ) : (
        <SeasonProblemsView seasons={seasons.data} />
      )}
    </div>
  )
}

function SubmissionsView() {
  const { data, loading, error, reload } = useApi(() => api.listSubmissions(), [])
  if (loading) return <LoadingView />
  if (error || !data) return <ErrorView error={error ?? new Error('데이터 없음')} onRetry={reload} />
  return <SubmissionsTable rows={data} />
}

function SeasonProblemsView({ seasons }: { seasons: SeasonSummary[] }) {
  const [params, setParams] = useSearchParams()
  const fromUrl = Number(params.get('season'))
  const currentSeason = seasons.find(s => s.status === 'current') ?? seasons[0]
  const seasonId = seasons.some(s => s.id === fromUrl) ? fromUrl : currentSeason.id
  const season = seasons.find(s => s.id === seasonId)!
  const isCurrent = season.status === 'current'
  const [q, setQ] = useState('')

  const { data: problems, loading, error, reload } = useApi(
    () => api.getSeasonProblems(seasonId),
    [seasonId],
  )

  const setSeason = (id: number) => {
    const next = new URLSearchParams(params)
    next.set('season', String(id))
    setParams(next, { replace: true })
  }

  const filtered = useMemo(
    () => (problems ?? []).filter(p => !q || p.title.includes(q) || p.displayNo.includes(q)),
    [problems, q],
  )
  const cleared = (problems ?? []).filter(p => p.myStatus === 'cleared').length

  return (
    <>
      {/* Season tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        {seasons.map(s => (
          <button
            key={s.id}
            onClick={() => setSeason(s.id)}
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
            <span>{s.name}</span>
            <span
              style={{
                fontSize: 10,
                padding: '1px 6px',
                background: s.status === 'current' ? C.blue : C.borderLight,
                color: s.status === 'current' ? '#fff' : C.muted,
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              {s.status === 'current' ? '현재' : '과거'}
            </span>
          </button>
        ))}
      </div>

      {/* Season banner */}
      {isCurrent ? (
        <div
          style={{
            border: `1px solid ${C.blue}`,
            background: '#f0f7ff',
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {season.name} · {formatShortDate(season.startDate)} ~ {formatShortDate(season.endDate)}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              이 시즌의 문제를 풀면 <strong style={{ color: C.text }}>시즌 랭킹 점수</strong>가
              올라갑니다
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.muted }}>종료까지</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.red, fontVariantNumeric: 'tabular-nums' }}>
              D-{season.dDay}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            border: `1px solid ${C.border}`,
            background: C.bg,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ color: C.muted, fontSize: 16 }}>🔒</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>
              {season.name} · {formatShortDate(season.startDate)} ~ {formatShortDate(season.endDate)}{' '}
              · 종료됨
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              연습용 · 풀어도 시즌 랭킹 점수에 영향 없음
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingView />
      ) : error || !problems ? (
        <ErrorView error={error ?? new Error('데이터 없음')} onRetry={reload} />
      ) : (
        <>
          {/* Stats + Search */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12, color: C.muted }}>
              전체 {problems.length}개 · 클리어 <strong style={{ color: C.text }}>{cleared}</strong>개
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
          <table style={tableStyle}>
            <thead>
              <tr style={theadRowStyle}>
                <th style={th({ width: 70 })}>번호</th>
                <th style={th()}>제목</th>
                <th style={th()}>분류</th>
                <th style={th({ width: 110 })}>난이도</th>
                <th style={th({ textAlign: 'right', width: 70 })}>정답률</th>
                <th style={th({ textAlign: 'right', width: 75 })}>점수</th>
                <th style={th({ width: 80 })}>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
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
                    <td style={td({ color: C.muted, fontSize: 12 })}>{p.tags.join(', ')}</td>
                    <td style={td()}>
                      <Tier tier={p.tier} />
                    </td>
                    <td style={td(numCell)}>{p.acceptanceRate.toFixed(1)}%</td>
                    <td
                      style={td({
                        ...numCell,
                        fontWeight: 600,
                        color: isCurrent ? C.text : C.muted,
                        textDecoration: isCurrent ? 'none' : 'line-through', // 과거 시즌 = 점수 무효
                      })}
                    >
                      {p.points}점
                    </td>
                    <td style={td({ color: st.color, fontSize: 12, fontWeight: 600 })}>{st.label}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </>
  )
}

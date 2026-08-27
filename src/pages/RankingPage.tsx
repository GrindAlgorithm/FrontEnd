import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { C, monoStack } from '../theme'
import { Tier } from '../components/Tier'
import { TabBar } from '../components/TabBar'
import { LoadingView, ErrorView } from '../components/Feedback'
import { bodyRowStyle, numCell, tableStyle, td, th } from '../components/table'
import { formatRelative } from '../utils/format'
import type { RankingEntry, RankingScope } from '../types/domain'

function koreanDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

const SCOPE_TABS: { id: RankingScope; label: string }[] = [
  { id: 'season', label: '시즌 랭킹' },
  { id: 'overall', label: '전체 랭킹' },
  { id: 'friends', label: '친구' },
]

export function RankingPage() {
  const [scope, setScope] = useState<RankingScope>('season')
  const { data, loading, error, reload } = useApi(() => api.getRanking(scope), [scope])

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.accent, fontFamily: monoStack }}>{'// '}</span>랭킹
        </h1>
        <Link to="/season" style={{ fontSize: 12, color: C.accent }}>
          시즌 정보 →
        </Link>
      </div>

      {/* 시즌 정보 배너 */}
      {data && (
        <div
          style={{
            border: `1px solid ${C.border}`,
            padding: '12px 16px',
            marginBottom: 16,
            background: C.surface,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{data.season.name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {koreanDate(data.season.startDate)} ~ {koreanDate(data.season.endDate)} · 시즌 종료 시
              티어와 점수가 초기화됩니다
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.muted, textAlign: 'right' }}>
            종료까지{' '}
            <span style={{ color: C.red, fontWeight: 700, fontFamily: monoStack }}>
              D-{data.season.dDay ?? '-'}
            </span>
          </div>
        </div>
      )}

      <TabBar
        tabs={SCOPE_TABS}
        active={scope}
        onChange={id => setScope(id as RankingScope)}
        marginBottom={0}
      />

      {loading ? (
        <LoadingView />
      ) : error || !data ? (
        <ErrorView error={error ?? new Error('데이터 없음')} onRetry={reload} />
      ) : (
        <>
          <RankingTable entries={data.entries} withHeader />

          {/* 내 순위 */}
          {data.myEntry && (
            <div style={{ marginTop: 24, paddingTop: 12, borderTop: `2px solid ${C.text}` }}>
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginBottom: 8,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                내 순위
              </div>
              <table style={tableStyle}>
                <tbody>
                  <MyRankRow entry={data.myEntry} />
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RankingTable({ entries, withHeader }: { entries: RankingEntry[]; withHeader?: boolean }) {
  return (
    <table style={tableStyle}>
      {withHeader && (
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
            <th style={th({ fontFamily: monoStack, fontSize: 12, textAlign: 'right', width: 50 })}>순위</th>
            <th style={th({ fontFamily: monoStack, fontSize: 12 })}>아이디</th>
            <th style={th({ fontFamily: monoStack, fontSize: 12 })}>시즌 티어</th>
            <th style={th({ fontFamily: monoStack, fontSize: 12, textAlign: 'right' })}>시즌 점수</th>
            <th style={th({ fontFamily: monoStack, fontSize: 12, textAlign: 'right' })}>푼 문제</th>
            <th style={th({ fontFamily: monoStack, fontSize: 12 })}>최근 활동</th>
          </tr>
        </thead>
      )}
      <tbody>
        {entries.map(r => (
          <tr key={`${r.rank}-${r.handle}`} style={bodyRowStyle}>
            <td
              style={td({
                ...numCell,
                fontFamily: monoStack,
                fontWeight: r.rank <= 3 ? 700 : 400,
                color: r.rank <= 3 ? C.text : C.muted,
                width: 50,
              })}
            >
              {r.rank.toLocaleString()}
            </td>
            <td style={td()}>
              <Link to={`/users/${r.handle}`} style={{ color: C.accent, fontFamily: monoStack }}>
                {r.handle}
              </Link>
            </td>
            <td style={td()}>
              <Tier tier={r.tier} />
            </td>
            <td style={td({ ...numCell, fontFamily: monoStack, fontWeight: 600 })}>{r.score.toLocaleString()}</td>
            <td style={td({ ...numCell, fontFamily: monoStack })}>{r.solvedCount.toLocaleString()}</td>
            <td style={td({ color: C.muted, fontSize: 12 })}>{formatRelative(r.lastActiveAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function MyRankRow({ entry }: { entry: RankingEntry }) {
  return (
    <tr style={{ background: C.surfaceAlt, borderBottom: `1px solid ${C.borderLight}` }}>
      <td style={td({ ...numCell, fontFamily: monoStack, color: C.muted, width: 50 })}>{entry.rank.toLocaleString()}</td>
      <td style={td()}>
        <Link to={`/users/${entry.handle}`} style={{ color: C.accent, fontFamily: monoStack, fontWeight: 600 }}>
          {entry.handle}
        </Link>
      </td>
      <td style={td()}>
        <Tier tier={entry.tier} />
      </td>
      <td style={td({ ...numCell, fontFamily: monoStack, fontWeight: 600 })}>{entry.score.toLocaleString()}</td>
      <td style={td({ ...numCell, fontFamily: monoStack })}>{entry.solvedCount.toLocaleString()}</td>
      <td style={td({ color: C.muted, fontSize: 12 })}>{formatRelative(entry.lastActiveAt)}</td>
    </tr>
  )
}

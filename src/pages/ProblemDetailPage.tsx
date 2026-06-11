import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { C, fontStack, monoStack } from '../theme'
import { Tier } from '../components/Tier'
import { TabBar } from '../components/TabBar'
import { LoadingView, ErrorView } from '../components/Feedback'
import { SubmissionsTable } from '../components/SubmissionsTable'
import { formatRelative } from '../utils/format'
import type { ProblemDetail } from '../types/domain'

export function ProblemDetailPage() {
  const { problemId } = useParams<{ problemId: string }>()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'submissions' ? 'submissions' : 'problem'

  const { data, loading, error, reload } = useApi(() => api.getProblem(problemId!), [problemId])

  if (loading) return <LoadingView />
  if (error || !data) return <ErrorView error={error ?? new Error('데이터 없음')} onRetry={reload} />

  const p = data

  const handleTab = (id: string) => {
    if (id === 'discussion') {
      navigate(`/problems/${p.problemId}/discussion`)
      return
    }
    const next = new URLSearchParams(params)
    if (id === 'submissions') next.set('tab', 'submissions')
    else next.delete('tab')
    setParams(next, { replace: true })
  }

  return (
    <div>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          margin: '0 0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontFamily: monoStack, color: C.muted, fontSize: 18 }}>{p.displayNo}</span>
        {p.title}
        <Tier tier={p.tier} />
      </h1>

      <TabBar
        tabs={[
          { id: 'problem', label: '문제' },
          { id: 'submissions', label: '내 제출' },
          {
            id: 'discussion',
            label: '토론',
            extra: (
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>
                {p.discussionCount}
              </span>
            ),
          },
        ]}
        active={tab}
        onChange={handleTab}
      />

      {tab === 'submissions' ? <MySubmissionsView problemId={p.problemId} /> : <ProblemView p={p} />}
    </div>
  )
}

function MySubmissionsView({ problemId }: { problemId: string }) {
  const { data, loading, error, reload } = useApi(
    () => api.listSubmissions({ problemId, mine: true }),
    [problemId],
  )
  if (loading) return <LoadingView />
  if (error || !data) return <ErrorView error={error ?? new Error('데이터 없음')} onRetry={reload} />
  return <SubmissionsTable rows={data} />
}

function ProblemView({ p }: { p: ProblemDetail }) {
  const navigate = useNavigate()

  const myStatusText =
    p.my.status === 'cleared' ? (
      <span style={{ color: C.green, fontWeight: 600 }}>✓ 클리어</span>
    ) : p.my.status === 'wip' ? (
      <span style={{ color: C.blue, fontWeight: 600 }}>시도중 ({p.my.attemptCount}회 제출, 미해결)</span>
    ) : (
      <span style={{ color: C.muted }}>미시도</span>
    )

  return (
    <>
      {/* 메타 정보 표 */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 12,
          marginBottom: 24,
          border: `1px solid ${C.border}`,
        }}
      >
        <thead>
          <tr style={{ background: C.bg }}>
            {['시간 제한', '메모리 제한', '제출', '정답', '맞힌 사람', '정답 비율', '시즌 점수'].map(
              (h, i, arr) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 6px',
                    fontWeight: 600,
                    borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            {[
              `${p.timeLimitSec} 초`,
              `${p.memoryLimitMb} MB`,
              p.stats.submissionCount.toLocaleString(),
              p.stats.acceptedCount.toLocaleString(),
              p.stats.solverCount.toLocaleString(),
              `${p.stats.acceptanceRate.toFixed(1)}%`,
              p.points != null ? `${p.points}점` : '—',
            ].map((v, i, arr) => (
              <td
                key={i}
                style={{
                  padding: '8px 6px',
                  textAlign: 'center',
                  borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                {v}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* 알고리즘 분류 */}
      <section style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 14,
            fontWeight: 700,
            margin: '0 0 10px',
            paddingBottom: 6,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          알고리즘 분류
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {p.tags.map(t => (
            <span
              key={t}
              style={{
                border: `1px solid ${C.border}`,
                background: '#fff',
                padding: '5px 12px',
                fontSize: 13,
                color: C.blue,
              }}
            >
              {t}
            </span>
          ))}
        </div>
        {p.expectedComplexity && (
          <p style={{ fontSize: 12, color: C.muted, margin: '10px 0 0' }}>
            예상 시간 복잡도:{' '}
            <strong style={{ color: C.text, fontFamily: monoStack }}>{p.expectedComplexity}</strong>
          </p>
        )}
      </section>

      {/* 본문 잠금 박스 — 본문은 IDE에서만 노출 (부정행위 방지 B2) */}
      <section
        style={{
          border: `1px solid ${C.border}`,
          background: C.bg,
          padding: '32px 24px',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>
          문제 본문은 IDE에서 확인 가능합니다
        </h3>
        <p style={{ fontSize: 12, color: C.muted, margin: '0 0 18px', lineHeight: 1.7 }}>
          부정행위 탐지를 위해 모든 문제 열람은 IDE에서만 이루어지며 시간이 기록됩니다.
          <br />
          본문 노출 시점부터 풀이 시간이 측정되며, 비정상적인 패턴(매우 빠른 정답 등)은 검토 대상이
          될 수 있습니다.
        </p>
        <button
          onClick={() => navigate(`/problems/${p.problemId}/solve`)}
          style={{
            background: C.blue,
            color: '#fff',
            border: 'none',
            padding: '12px 32px',
            fontSize: 15,
            cursor: 'pointer',
            fontWeight: 700,
            fontFamily: fontStack,
          }}
        >
          IDE에서 문제 풀기 →
        </button>
      </section>

      {/* 보조 정보 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: C.muted,
          paddingTop: 12,
          borderTop: `1px solid ${C.borderLight}`,
        }}
      >
        <span>내 상태: {myStatusText}</span>
        <span>
          마지막 시도: {p.my.lastTriedAt ? formatRelative(p.my.lastTriedAt) : '없음'}
        </span>
      </div>

      {p.seasonId != null && (
        <div style={{ marginTop: 10, fontSize: 12 }}>
          <Link to={`/problems?season=${p.seasonId}`} style={{ color: C.blue }}>
            ← 시즌 문제 목록으로
          </Link>
        </div>
      )}
    </>
  )
}

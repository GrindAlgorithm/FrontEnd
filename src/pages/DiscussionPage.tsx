import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import {
  C,
  DISCUSSION_TAG_COLOR,
  DISCUSSION_TAG_LABEL,
  fontStack,
  monoStack,
} from '../theme'
import { Tier, TierDot } from '../components/Tier'
import { TabBar } from '../components/TabBar'
import { LoadingView, ErrorView } from '../components/Feedback'
import { bodyRowStyle, tableStyle, td, th, theadRowStyle } from '../components/table'
import { formatRelative } from '../utils/format'
import type { DiscussionCategory } from '../types/domain'

type Filter = 'all' | DiscussionCategory

export function DiscussionPage() {
  const { problemId } = useParams<{ problemId: string }>()
  const navigate = useNavigate()
  const detail = useApi(() => api.getProblem(problemId!), [problemId])
  const disc = useApi(() => api.getDiscussions(problemId!), [problemId])
  const [filter, setFilter] = useState<Filter>('all')
  const [writeNote, setWriteNote] = useState(false)

  if (detail.loading || disc.loading) return <LoadingView />
  if (detail.error || !detail.data)
    return <ErrorView error={detail.error ?? new Error('데이터 없음')} onRetry={detail.reload} />
  if (disc.error || !disc.data)
    return <ErrorView error={disc.error ?? new Error('데이터 없음')} onRetry={disc.reload} />

  const p = detail.data
  const d = disc.data
  const noLabel = /^\d+$/.test(p.displayNo) ? `${p.displayNo}번` : p.displayNo

  const handleTab = (id: string) => {
    if (id === 'problem') navigate(`/problems/${p.problemId}`)
    else if (id === 'submissions') navigate(`/problems/${p.problemId}?tab=submissions`)
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
        <Link to={`/problems/${p.problemId}`} style={{ color: C.blue }}>
          {noLabel} · {p.title}
        </Link>{' '}
        / 토론
      </div>

      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          margin: '0 0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
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
                {d.stats.postCount}
              </span>
            ),
          },
        ]}
        active="discussion"
        onChange={handleTab}
      />

      {!d.accessible ? (
        /* 잠금 상태 — 정답자만 진입 가능 */
        <div
          style={{
            border: `1px solid ${C.border}`,
            padding: '48px 24px',
            textAlign: 'center',
            background: C.bg,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>
            이 문제를 풀어야 토론에 참여할 수 있습니다
          </h2>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px', lineHeight: 1.7 }}>
            답안 복사 방지를 위해, 문제를 푼 사용자만
            <br />
            토론과 공개 답안 코드를 볼 수 있어요
          </p>
          <button
            onClick={() => navigate(`/problems/${p.problemId}/solve`)}
            style={{
              background: C.blue,
              color: '#fff',
              border: 'none',
              padding: '10px 22px',
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: fontStack,
            }}
          >
            문제 풀기 →
          </button>

          <div
            style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: `1px solid ${C.borderLight}`,
              fontSize: 12,
              color: C.muted,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
              <span>
                <strong>{d.stats.postCount}</strong>개 토론
              </span>
              <span>
                <strong>{d.stats.publicSolutionCount}</strong>개 공개 답안
              </span>
              <span>
                <strong>{d.stats.codeReviewCount}</strong>개 코드 리뷰
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* 해제 상태 */
        <div>
          <div
            style={{
              border: `1px solid ${C.green}`,
              background: '#f0fff4',
              padding: '8px 14px',
              marginBottom: 16,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ color: C.green, fontSize: 14, fontWeight: 700 }}>✓</span>
            <span>
              <strong>정답자 권한 활성화</strong> · {d.firstSolvedAt.slice(0, 10)} 첫 해결
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 12,
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              {(
                [
                  { id: 'all', label: '전체' },
                  { id: 'code_review', label: '코드 리뷰' },
                  { id: 'solution', label: '풀이 공유' },
                ] as { id: Filter; label: string }[]
              ).map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    background: '#fff',
                    color: filter === f.id ? C.text : C.muted,
                    border: `1px solid ${filter === f.id ? C.text : C.border}`,
                    padding: '5px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: fontStack,
                    fontWeight: filter === f.id ? 600 : 400,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {writeNote && (
                <span style={{ fontSize: 11, color: C.muted }}>
                  글 작성·상세 보기는 추후 구현 예정입니다 (Deferred)
                </span>
              )}
              <button
                onClick={() => setWriteNote(true)}
                style={{
                  background: C.blue,
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontFamily: fontStack,
                }}
              >
                + 글쓰기
              </button>
            </div>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr style={theadRowStyle}>
                <th style={th({ padding: '10px 6px', width: 80 })}>분류</th>
                <th style={th({ padding: '10px 6px' })}>제목</th>
                <th style={th({ padding: '10px 6px', width: 130 })}>작성자</th>
                <th style={th({ padding: '10px 6px', textAlign: 'right', width: 50 })}>댓글</th>
                <th style={th({ padding: '10px 6px', textAlign: 'right', width: 60 })}>추천</th>
                <th style={th({ padding: '10px 6px', textAlign: 'right', width: 90 })}>작성</th>
              </tr>
            </thead>
            <tbody>
              {d.posts
                .filter(post => filter === 'all' || post.category === filter)
                .map(post => (
                  <tr key={post.id} style={bodyRowStyle}>
                    <td style={td({ padding: '10px 6px' })}>
                      <span
                        style={{
                          fontSize: 11,
                          color: DISCUSSION_TAG_COLOR[post.category],
                          fontWeight: 600,
                        }}
                      >
                        [{DISCUSSION_TAG_LABEL[post.category]}]
                      </span>
                    </td>
                    <td style={td({ padding: '10px 6px' })}>
                      <span style={{ color: C.text, cursor: 'pointer' }}>{post.title}</span>
                    </td>
                    <td style={td({ padding: '10px 6px' })}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <TierDot name={post.author.tierName} />
                        <Link to={`/users/${post.author.handle}`} style={{ color: C.blue, fontSize: 12 }}>
                          {post.author.handle}
                        </Link>
                      </span>
                    </td>
                    <td
                      style={td({
                        padding: '10px 6px',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        color: C.muted,
                        fontSize: 12,
                      })}
                    >
                      {post.commentCount}
                    </td>
                    <td
                      style={td({
                        padding: '10px 6px',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        color: C.muted,
                        fontSize: 12,
                      })}
                    >
                      +{post.voteCount}
                    </td>
                    <td
                      style={td({
                        padding: '10px 6px',
                        textAlign: 'right',
                        color: C.muted,
                        fontSize: 11,
                      })}
                    >
                      {formatRelative(post.createdAt)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

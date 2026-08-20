import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { C, DISCUSSION_TAG_COLOR, DISCUSSION_TAG_LABEL } from '../theme'
import { TierDot } from '../components/Tier'
import { LoadingView, ErrorView } from '../components/Feedback'
import { Markdown } from '../components/Markdown'
import { formatRelative } from '../utils/format'

/** 토론 글 상세 (요건 4) — 마크다운 본문 렌더링. 정답자만 접근(백엔드 403). */
export function DiscussionPostPage() {
  const { problemId, postId } = useParams<{ problemId: string; postId: string }>()
  const { data, loading, error, reload } = useApi(
    () => api.getDiscussionPost(problemId!, Number(postId)),
    [problemId, postId],
  )

  if (loading) return <LoadingView />
  if (error || !data)
    return <ErrorView error={error ?? new Error('토론 글을 불러오지 못했습니다')} onRetry={reload} />

  return (
    <div className="container" style={{ maxWidth: 760, margin: '32px auto' }}>
      <Link
        to={`/problems/${problemId}/discussion`}
        style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}
      >
        ← 토론 목록
      </Link>

      <div style={{ margin: '16px 0 4px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 12, color: DISCUSSION_TAG_COLOR[data.category], fontWeight: 600 }}>
          [{DISCUSSION_TAG_LABEL[data.category]}]
        </span>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{data.title}</h1>
      </div>
      <div
        style={{
          fontSize: 12,
          color: C.muted,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <TierDot name={data.author.tierName} />
        <Link to={`/users/${data.author.handle}`} style={{ color: C.blue }}>
          {data.author.handle}
        </Link>
        <span>· {formatRelative(data.createdAt)}</span>
        <span>· 추천 +{data.voteCount}</span>
      </div>

      <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 20 }}>
        <Markdown source={data.body} />
      </div>

      <div
        style={{
          marginTop: 28,
          paddingTop: 16,
          borderTop: `1px solid ${C.borderLight}`,
          fontSize: 12,
          color: C.muted,
        }}
      >
        댓글 {data.commentCount}개 — 댓글/추천 기능은 추후 구현 예정입니다
      </div>
    </div>
  )
}

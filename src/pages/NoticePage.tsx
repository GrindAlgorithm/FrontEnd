import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { C } from '../theme'
import { LoadingView, ErrorView } from '../components/Feedback'
import { Markdown } from '../components/Markdown'

/** 공지 상세 (요건 3) — 홈 대시보드 공지 클릭 시 진입, 마크다운 본문 렌더링. */
export function NoticePage() {
  const { noticeId } = useParams<{ noticeId: string }>()
  const { data, loading, error, reload } = useApi(
    () => api.getNotice(Number(noticeId)),
    [noticeId],
  )

  if (loading) return <LoadingView />
  if (error || !data) return <ErrorView error={error ?? new Error('공지를 불러오지 못했습니다')} onRetry={reload} />

  return (
    <div className="container" style={{ maxWidth: 760, margin: '32px auto' }}>
      <Link to="/" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>
        ← 홈으로
      </Link>

      <div style={{ margin: '16px 0 4px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 12, color: data.highlight ? C.red : C.blue, fontWeight: 600 }}>
          [{data.tag}]
        </span>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{data.title}</h1>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
        {new Date(data.publishedAt).toLocaleDateString('ko-KR')}
      </div>

      <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 20 }}>
        {data.body.trim() === '' ? (
          <span style={{ fontSize: 13, color: C.muted }}>본문이 없는 공지입니다.</span>
        ) : (
          <Markdown source={data.body} />
        )}
      </div>
    </div>
  )
}

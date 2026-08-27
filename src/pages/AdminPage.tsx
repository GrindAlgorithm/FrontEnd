import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import type { NoticeDetail } from '../types/domain'
import { C, fontStack, monoStack } from '../theme'
import { MarkdownEditor } from '../components/MarkdownEditor'

/**
 * 관리자 탭 — 공지 관리(작성/수정/삭제). ADMIN 권한만 접근.
 * 백엔드 /api/v1/admin/notices (hasRole("ADMIN")) 를 호출한다.
 */
export function AdminPage() {
  const { me } = useAuth()

  const [notices, setNotices] = useState<NoticeDetail[]>([])
  const [error, setError] = useState<string | null>(null)

  // 작성/수정 폼
  const [editingId, setEditingId] = useState<number | null>(null)
  const [tag, setTag] = useState('공지')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [highlight, setHighlight] = useState(false)
  const [pending, setPending] = useState(false)

  const load = async () => {
    try {
      setNotices(await api.adminListNotices())
    } catch (e) {
      setError(e instanceof Error ? e.message : '공지 목록을 불러오지 못했습니다')
    }
  }

  useEffect(() => {
    load()
  }, [])

  // 라우트 가드(백엔드도 403으로 막지만 UX상 선차단)
  if (me && me.role !== 'ADMIN') return <Navigate to="/home" replace />

  const resetForm = () => {
    setEditingId(null)
    setTag('공지')
    setTitle('')
    setBody('')
    setHighlight(false)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      if (editingId == null) {
        await api.adminCreateNotice({ tag, title, body, highlight })
      } else {
        await api.adminUpdateNotice(editingId, { tag, title, body, highlight })
      }
      resetForm()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다')
    } finally {
      setPending(false)
    }
  }

  const startEdit = (n: NoticeDetail) => {
    setEditingId(n.id)
    setTag(n.tag)
    setTitle(n.title)
    setBody(n.body)
    setHighlight(n.highlight)
  }

  const remove = async (id: number) => {
    if (!window.confirm('이 공지를 삭제할까요?')) return
    setError(null)
    try {
      await api.adminDeleteNotice(id)
      if (editingId === id) resetForm()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제에 실패했습니다')
    }
  }

  const inputStyle = {
    background: C.bg,
    border: `1px solid ${C.border}`,
    color: C.text,
    padding: '8px 10px',
    fontSize: 13,
    fontFamily: fontStack,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <div className="container" style={{ maxWidth: 760, margin: '32px auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        <span style={{ color: C.accent, fontFamily: monoStack }}>{'// '}</span>관리자 · 공지 관리
      </h1>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
        공지를 작성·수정·삭제합니다. 저장한 공지는 홈 대시보드에 노출됩니다.
      </p>

      {error && (
        <div style={{ fontSize: 13, color: C.red, marginBottom: 16 }}>{error}</div>
      )}

      {/* 작성/수정 폼 */}
      <form
        onSubmit={submit}
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          padding: 16,
          marginBottom: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          {editingId == null ? '새 공지 작성' : `공지 #${editingId} 수정`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="태그 (공지/업데이트)"
            value={tag}
            onChange={e => setTag(e.target.value)}
            style={{ ...inputStyle, width: 140 }}
          />
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
        <MarkdownEditor
          value={body}
          onChange={setBody}
          placeholder="본문 (마크다운, 비워두면 제목만 있는 공지)"
          minHeight={180}
        />
        <label style={{ fontSize: 13, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={highlight} onChange={e => setHighlight(e.target.checked)} />
          상단 강조(highlight)
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit"
            disabled={pending}
            style={{
              background: 'transparent',
              color: C.accent,
              border: `1px solid ${C.accent}`,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: pending ? 'wait' : 'pointer',
              fontFamily: fontStack,
            }}
          >
            {pending ? '저장 중…' : editingId == null ? '작성' : '수정 저장'}
          </button>
          {editingId != null && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                background: 'transparent',
                color: C.muted,
                border: `1px solid ${C.border}`,
                padding: '8px 16px',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: fontStack,
              }}
            >
              취소
            </button>
          )}
        </div>
      </form>

      {/* 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notices.length === 0 && (
          <div style={{ fontSize: 13, color: C.muted }}>등록된 공지가 없습니다.</div>
        )}
        {notices.map(n => (
          <div
            key={n.id}
            style={{
              background: C.surface,
              border: `1px solid ${C.borderLight}`,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: C.accent,
                fontWeight: 600,
                minWidth: 56,
                fontFamily: monoStack,
              }}
            >
              {n.tag}
            </span>
            <span style={{ flex: 1, fontSize: 14 }}>
              {n.highlight && <span style={{ color: C.red, marginRight: 4 }}>★</span>}
              {n.title}
            </span>
            <button
              onClick={() => startEdit(n)}
              style={{
                background: 'transparent',
                border: 'none',
                color: C.muted,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: fontStack,
              }}
            >
              수정
            </button>
            <button
              onClick={() => remove(n.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: C.red,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: fontStack,
              }}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

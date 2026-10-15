import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { C, monoStack } from '../theme'
import { Tier } from '../components/Tier'
import { TabBar } from '../components/TabBar'
import { FriendAction, friendBtn, type FriendState } from '../components/FriendAction'
import { LoadingView, ErrorView } from '../components/Feedback'
import { bodyRowStyle, numCell, tableStyle, td, th } from '../components/table'
import { formatRelative } from '../utils/format'
import type { FriendUser, FriendsResponse, UserSearchItem } from '../types/domain'

type ListTab = 'friends' | 'incoming' | 'outgoing'

const SEARCH_DEBOUNCE_MS = 300

// 좁은 화면에서 글자 단위로 꺾이지 않게 한 줄 고정 — 넘치면 ScrollX 가 가로 스크롤
const listTable = { ...tableStyle, whiteSpace: 'nowrap' as const }

export function FriendsPage() {
  const { data, loading, error, reload, setData } = useApi(() => api.getFriends(), [])
  const [tab, setTab] = useState<ListTab>('friends')

  // 목록 변경 후 로딩 화면 없이 조용히 다시 받는다
  const refresh = async () => {
    try {
      setData(await api.getFriends())
    } catch {
      reload()
    }
  }

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
          <span style={{ color: C.accent, fontFamily: monoStack }}>{'// '}</span>친구
        </h1>
        <Link to="/ranking" state={{ scope: 'friends' }} style={{ fontSize: 12, color: C.accent }}>
          친구 랭킹 →
        </Link>
      </div>

      <AddFriendPanel onChanged={refresh} />

      {loading ? (
        <LoadingView />
      ) : error || !data ? (
        <ErrorView error={error ?? new Error('데이터 없음')} onRetry={reload} />
      ) : (
        <>
          <TabBar
            tabs={[
              { id: 'friends', label: '친구', extra: <Count n={data.friends.length} /> },
              {
                id: 'incoming',
                label: '받은 신청',
                extra: <Count n={data.incoming.length} highlight />,
              },
              { id: 'outgoing', label: '보낸 신청', extra: <Count n={data.outgoing.length} /> },
            ]}
            active={tab}
            onChange={id => setTab(id as ListTab)}
            marginBottom={0}
          />
          <FriendLists tab={tab} data={data} onChanged={refresh} />
        </>
      )}
    </div>
  )
}

function Count({ n, highlight }: { n: number; highlight?: boolean }) {
  const on = highlight && n > 0
  return (
    <span
      style={{
        fontFamily: monoStack,
        fontSize: 11,
        color: on ? C.amber : C.muted,
        border: on ? `1px solid ${C.amber}` : 'none',
        background: on ? C.amberBg : 'transparent',
        padding: on ? '0 5px' : 0,
      }}
    >
      {n}
    </span>
  )
}

// ── 핸들 검색 + 신청 ─────────────────────────────────────────

function AddFriendPanel({ onChanged }: { onChanged: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchItem[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seq = useRef(0)

  const search = async (q: string) => {
    const mine = ++seq.current
    if (!q.trim()) {
      setResults(null)
      setSearching(false)
      return
    }
    setSearching(true)
    setError(null)
    try {
      const rows = await api.searchUsers(q.trim())
      if (mine === seq.current) setResults(rows)
    } catch (e) {
      if (mine === seq.current) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (mine === seq.current) setSearching(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => search(query), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const updateRow = (handle: string, next: FriendState) => {
    setResults(rows => rows && rows.map(r => (r.handle === handle ? { ...r, ...next } : r)))
    onChanged()
  }

  return (
    <section style={{ border: `1px solid ${C.border}`, background: C.surface, marginBottom: 24 }}>
      <form
        onSubmit={e => {
          e.preventDefault()
          search(query)
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}
      >
        <label
          htmlFor="friend-search"
          style={{ fontFamily: monoStack, fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}
        >
          <span style={{ color: C.accent }}>❯</span> friend add
        </label>
        <input
          id="friend-search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="핸들"
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1,
            minWidth: 0,
            background: C.bg,
            border: `1px solid ${C.border}`,
            color: C.text,
            padding: '7px 10px',
            fontSize: 13,
            fontFamily: monoStack,
          }}
        />
        <span style={{ fontSize: 11, color: C.muted, fontFamily: monoStack, width: 48, textAlign: 'right' }}>
          {searching ? '검색 중' : results ? `${results.length}명` : ''}
        </span>
      </form>

      {error && (
        <div style={{ padding: '0 14px 12px', fontSize: 12, color: C.red }} role="alert">
          {error}
        </div>
      )}

      {results && !error && (
        <div style={{ borderTop: `1px solid ${C.borderLight}` }}>
          {results.length === 0 ? (
            <div style={{ padding: '14px', fontSize: 13, color: C.muted }}>
              <span style={{ fontFamily: monoStack, color: C.text }}>{query.trim()}</span> 와 일치하는 핸들이
              없습니다. 철자를 확인하거나 일부만 입력해 보세요.
            </div>
          ) : (
            <ScrollX>
              <table style={listTable}>
                <tbody>
                  {results.map(u => (
                    <tr key={u.handle} style={bodyRowStyle}>
                      <UserCells user={u} />
                      <td style={td({ textAlign: 'right' })}>
                        {u.relation === 'self' ? (
                          <span style={{ fontSize: 12, color: C.muted, fontFamily: monoStack }}>나</span>
                        ) : (
                          <FriendAction
                            handle={u.handle}
                            state={{ relation: u.relation, requestId: u.requestId }}
                            onChange={next => updateRow(u.handle, next)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollX>
          )}
        </div>
      )}
    </section>
  )
}

// ── 친구 / 받은 신청 / 보낸 신청 목록 ─────────────────────────

function FriendLists({
  tab,
  data,
  onChanged,
}: {
  tab: ListTab
  data: FriendsResponse
  onChanged: () => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmHandle, setConfirmHandle] = useState<string | null>(null)

  const act = async (key: string, fn: () => Promise<void>) => {
    setBusyId(key)
    setError(null)
    try {
      await fn()
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId(null)
      setConfirmHandle(null)
    }
  }

  const errorRow = error && (
    <div role="alert" style={{ fontSize: 12, color: C.red, padding: '10px 8px' }}>
      {error}
    </div>
  )

  if (tab === 'friends') {
    if (data.friends.length === 0)
      return <Empty>아직 친구가 없습니다. 위 검색창에 핸들을 입력해 첫 친구에게 신청을 보내세요.</Empty>
    return (
      <>
        {errorRow}
        <ScrollX>
          <table style={listTable}>
            <ListHead last="친구가 된 날" />
            <tbody>
              {data.friends.map(f => {
                const busy = busyId === f.handle
                return (
                  <tr key={f.handle} style={bodyRowStyle}>
                    <UserCells user={f} />
                    <td style={td({ color: C.muted, fontSize: 12, fontFamily: monoStack })}>
                      {f.since.slice(0, 10)}
                    </td>
                    <td style={td({ textAlign: 'right', whiteSpace: 'nowrap' })}>
                      {confirmHandle === f.handle ? (
                        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: C.muted }}>정말 끊을까요?</span>
                          <button
                            disabled={busy}
                            onClick={() => act(f.handle, () => api.removeFriend(f.handle))}
                            style={friendBtn(C.red, busy)}
                          >
                            끊기
                          </button>
                          <button onClick={() => setConfirmHandle(null)} style={friendBtn(C.muted)}>
                            유지
                          </button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmHandle(f.handle)} style={friendBtn(C.muted)}>
                          친구 끊기
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </ScrollX>
      </>
    )
  }

  const requests = tab === 'incoming' ? data.incoming : data.outgoing
  if (requests.length === 0)
    return (
      <Empty>
        {tab === 'incoming'
          ? '받은 신청이 없습니다.'
          : '대기 중인 신청이 없습니다. 상대가 수락하면 친구 목록으로 옮겨집니다.'}
      </Empty>
    )

  return (
    <>
      {errorRow}
      <ScrollX>
        <table style={listTable}>
          <ListHead last={tab === 'incoming' ? '받은 시각' : '보낸 시각'} />
          <tbody>
            {requests.map(r => {
              const key = String(r.id)
              const busy = busyId === key
              return (
                <tr key={r.id} style={bodyRowStyle}>
                  <UserCells user={r.user} />
                  <td style={td({ color: C.muted, fontSize: 12 })}>{formatRelative(r.createdAt)}</td>
                  <td style={td({ textAlign: 'right', whiteSpace: 'nowrap' })}>
                    {tab === 'incoming' ? (
                      <span style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          disabled={busy}
                          onClick={() => act(key, () => api.acceptFriendRequest(r.id))}
                          style={friendBtn(C.accent, busy)}
                        >
                          수락
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => act(key, () => api.deleteFriendRequest(r.id))}
                          style={friendBtn(C.muted, busy)}
                        >
                          거절
                        </button>
                      </span>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={() => act(key, () => api.deleteFriendRequest(r.id))}
                        style={friendBtn(C.muted, busy)}
                      >
                        신청 취소
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </ScrollX>
    </>
  )
}

// ── 공통 조각 ────────────────────────────────────────────────

function ListHead({ last }: { last: string }) {
  const h = { fontFamily: monoStack, fontSize: 12 }
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
        <th style={th(h)}>아이디</th>
        <th style={th(h)}>시즌 티어</th>
        <th style={th({ ...h, textAlign: 'right' })}>푼 문제</th>
        <th style={th(h)}>최근 활동</th>
        <th style={th(h)}>{last}</th>
        <th style={th({ ...h, width: 1 })} aria-label="동작" />
      </tr>
    </thead>
  )
}

/** 아이디 · 티어 · 푼 문제 · 최근 활동 — 검색 결과와 목록이 같은 열 순서를 쓴다 */
function UserCells({ user }: { user: FriendUser }) {
  return (
    <>
      <td style={td()}>
        <Link to={`/users/${user.handle}`} style={{ color: C.accent, fontFamily: monoStack }}>
          {user.handle}
        </Link>
      </td>
      <td style={td()}>
        {user.tier ? <Tier tier={user.tier} /> : <span style={{ fontSize: 12, color: C.muted }}>미배치</span>}
      </td>
      <td style={td({ ...numCell, fontFamily: monoStack })}>{user.solvedCount.toLocaleString()}</td>
      <td style={td({ color: C.muted, fontSize: 12 })}>{formatRelative(user.lastActiveAt)}</td>
    </>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: '40px 16px',
        textAlign: 'center',
        fontSize: 13,
        color: C.muted,
        borderBottom: `1px solid ${C.borderLight}`,
      }}
    >
      {children}
    </div>
  )
}

function ScrollX({ children }: { children: ReactNode }) {
  return <div style={{ overflowX: 'auto' }}>{children}</div>
}

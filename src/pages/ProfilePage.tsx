import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { C, fontStack, monoStack, submissionStatusColor, submissionStatusText, titleColorMap } from '../theme'
import { Tier } from '../components/Tier'
import { TitleBadge } from '../components/TitleBadge'
import { JandiGrid } from '../components/JandiGrid'
import { DecayBanner } from '../components/DecayBanner'
import { LoadingView, ErrorView } from '../components/Feedback'
import { bodyRowStyle, tableStyle, td } from '../components/table'
import { formatRelative, toJandiWeeks } from '../utils/format'
import type { UserProfileResponse, UserTitle } from '../types/domain'

export function ProfilePage() {
  const { handle } = useParams<{ handle: string }>()
  const { data, loading, error, reload } = useApi(() => api.getUserProfile(handle!), [handle])

  if (loading) return <LoadingView />
  if (error || !data) return <ErrorView error={error ?? new Error('데이터 없음')} onRetry={reload} />

  return <ProfileView profile={data} />
}

function ProfileView({ profile: u }: { profile: UserProfileResponse }) {
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(u.selectedTitleId)
  useEffect(() => setSelectedTitleId(u.selectedTitleId), [u.selectedTitleId, u.handle])

  const selectedTitle = u.titles.find(t => t.id === selectedTitleId) ?? null
  const owned = u.titles.filter(t => t.owned)
  const locked = u.titles.filter(t => !t.owned)

  const selectTitle = async (titleId: string | null) => {
    const prev = selectedTitleId
    setSelectedTitleId(titleId) // 낙관적 갱신
    try {
      await api.updateMyTitle(titleId)
    } catch {
      setSelectedTitleId(prev)
    }
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 20,
          marginBottom: 20,
          paddingBottom: 20,
          borderBottom: `1px solid ${C.borderLight}`,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            background: C.bg,
            border: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            color: C.muted,
            fontFamily: monoStack,
            textTransform: 'uppercase',
          }}
        >
          {u.handle.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}
          >
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{u.handle}</h1>
            {selectedTitle && <TitleBadge title={selectedTitle} size="md" />}
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: monoStack, marginBottom: 12 }}>
            가입 {u.joinedAt.slice(0, 10)}
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
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
              {u.seasonTier ? <Tier tier={u.seasonTier} /> : <span style={{ fontSize: 12, color: C.muted }}>미배치</span>}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                시즌 점수 {u.seasonScore.toLocaleString()}
                {u.seasonRank != null && <> · {u.seasonRank}위</>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decay 경고 — 본인에게만 */}
      {u.isMe && u.decay && <DecayBanner decay={u.decay} variant="profile" />}

      {/* 통계 */}
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
          통계
        </h2>
        <table style={tableStyle}>
          <tbody>
            {[
              ['푼 문제', `${u.stats.solvedCount}개`, '제출 횟수', `${u.stats.submissionCount}건`],
              ['정답률', `${u.stats.accuracyRate.toFixed(1)}%`, '평균 시도', `${u.stats.avgAttempts.toFixed(1)}회`],
              ['연속 일수', `${u.stats.streakDays}일`, '최장 연속', `${u.stats.longestStreakDays}일`],
            ].map((row, i) => (
              <tr key={i} style={bodyRowStyle}>
                <td style={td({ padding: '8px 6px', color: C.muted, width: '15%' })}>{row[0]}</td>
                <td style={td({ padding: '8px 6px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', width: '35%' })}>
                  {row[1]}
                </td>
                <td style={td({ padding: '8px 6px', color: C.muted, width: '15%' })}>{row[2]}</td>
                <td style={td({ padding: '8px 6px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' })}>
                  {row[3]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 칭호 */}
      <section style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 10,
            paddingBottom: 6,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
            칭호{' '}
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>
              {owned.length}{u.isMe && ` / ${u.titles.length}`}
            </span>
          </h2>
          {u.isMe && (
            <span style={{ fontSize: 11, color: C.muted }}>
              클릭해서 닉네임 옆에 표시할 칭호를 선택하세요
            </span>
          )}
        </div>

        {u.isMe ? (
          <>
            {/* 보유 칭호 (선택 UI) */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginBottom: 8,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                }}
              >
                보유
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 8,
                }}
              >
                {/* 선택 안 함 옵션 */}
                <button
                  onClick={() => selectTitle(null)}
                  style={{
                    border: `1.5px solid ${selectedTitleId === null ? C.blue : C.border}`,
                    background: selectedTitleId === null ? '#f0f7ff' : '#fff',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontFamily: fontStack,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{ width: 9, height: 9, border: `1px dashed ${C.muted}`, display: 'inline-block' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>선택 안 함</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>닉네임만 표시</div>
                  </div>
                  {selectedTitleId === null && (
                    <span style={{ color: C.blue, fontWeight: 700 }}>✓</span>
                  )}
                </button>

                {owned.map(t => (
                  <TitleOption
                    key={t.id}
                    title={t}
                    selected={selectedTitleId === t.id}
                    onSelect={() => selectTitle(t.id)}
                  />
                ))}
              </div>
            </div>

            {/* 미보유 칭호 */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginBottom: 8,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                }}
              >
                미보유
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 8,
                }}
              >
                {locked.map(t => (
                  <div
                    key={t.id}
                    style={{
                      border: `1px solid ${C.border}`,
                      background: C.bg,
                      padding: '10px 12px',
                      fontFamily: fontStack,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      opacity: t.expired ? 0.45 : 0.7,
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        background: titleColorMap[t.colorKey],
                        transform: 'rotate(45deg)',
                        display: 'inline-block',
                        flexShrink: 0,
                        opacity: 0.5,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.muted,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {t.name}
                        {t.expired && (
                          <span style={{ fontSize: 9, color: C.red, fontWeight: 600 }}>만료</span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.muted,
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 11, color: C.muted, margin: '14px 0 0', lineHeight: 1.6 }}>
              시즌 한정 칭호는 해당 시즌 종료 후엔 획득 불가. 이미 획득한 칭호는 영구 보유됩니다.
            </p>
          </>
        ) : (
          /* 타인 프로필: 보유 칭호 나열만 */
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {owned.length === 0 ? (
              <span style={{ fontSize: 12, color: C.muted }}>보유한 칭호가 없습니다.</span>
            ) : (
              owned.map(t => <TitleBadge key={t.id} title={t} />)
            )}
          </div>
        )}
      </section>

      {/* 잔디 */}
      <section style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 10,
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>최근 1년 활동</h2>
          <span style={{ fontSize: 11, color: C.muted }}>
            {u.activity.activeDays}일 활동 · 평균 {u.activity.avgPerDay}문제/일
          </span>
        </div>
        <div style={{ borderTop: `2px solid ${C.text}`, paddingTop: 16 }}>
          <JandiGrid weeks={toJandiWeeks(u.activity.days)} legend />
        </div>
      </section>

      {/* 최근 푼 문제 + 최근 제출 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
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
            최근 푼 문제
          </h2>
          <table style={{ ...tableStyle, fontSize: 12 }}>
            <tbody>
              {u.recentSolved.map(p => (
                <tr key={`${p.problemId}-${p.solvedAt}`} style={bodyRowStyle}>
                  <td style={td({ padding: '8px 6px', fontFamily: monoStack, color: C.muted, width: 55 })}>
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
                  <td style={td({ padding: '8px 6px', color: C.muted, fontSize: 11, textAlign: 'right' })}>
                    {formatRelative(p.solvedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

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
            최근 제출
          </h2>
          <table style={{ ...tableStyle, fontSize: 12 }}>
            <tbody>
              {u.recentSubmissions.map(s => (
                <tr key={s.submissionId} style={bodyRowStyle}>
                  <td style={td({ padding: '8px 6px', fontFamily: monoStack, color: C.muted, width: 55 })}>
                    {s.displayNo}
                  </td>
                  <td style={td({ padding: '8px 6px' })}>
                    <Link to={`/problems/${s.problemId}`} style={{ color: C.blue }}>
                      {s.title}
                    </Link>
                  </td>
                  <td
                    style={td({
                      padding: '8px 6px',
                      color: submissionStatusColor(s.status),
                      fontSize: 11,
                      fontWeight: 600,
                    })}
                  >
                    {submissionStatusText(s.status)}
                  </td>
                  <td style={td({ padding: '8px 6px', color: C.muted, fontSize: 11, textAlign: 'right' })}>
                    {formatRelative(s.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

function TitleOption({
  title: t,
  selected,
  onSelect,
}: {
  title: UserTitle
  selected: boolean
  onSelect: () => void
}) {
  const color = titleColorMap[t.colorKey]
  return (
    <button
      onClick={onSelect}
      style={{
        border: `1.5px solid ${selected ? C.blue : C.border}`,
        background: selected ? '#f0f7ff' : '#fff',
        padding: '10px 12px',
        cursor: 'pointer',
        fontFamily: fontStack,
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          background: color,
          transform: 'rotate(45deg)',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color }}>{t.name}</div>
        <div
          style={{
            fontSize: 10,
            color: C.muted,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t.description}
        </div>
      </div>
      {selected && <span style={{ color: C.blue, fontWeight: 700, flexShrink: 0 }}>✓</span>}
    </button>
  )
}

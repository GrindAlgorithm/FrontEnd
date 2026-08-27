import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { C, fontStack, monoStack, tierMap } from '../theme'
import { LoadingView } from '../components/Feedback'
import type { TierName } from '../types/domain'

/**
 * 랜딩 페이지 (요건 26) — 비로그인 공개 화면.
 * 로그인 상태로 "/"에 오면 /home으로 보낸다. 홈 탭·/home은 그대로 유지.
 */

const FEATURES: { title: string; body: string }[] = [
  {
    title: '시즌제 랭킹',
    body: '시즌 단위로 점수를 쌓아 티어를 올립니다. 시즌이 끝나면 순위에 따라 리워드가 주어집니다.',
  },
  {
    title: '웹 IDE 실전 환경',
    body: '설치 없이 브라우저에서 코드를 작성하고, 예제 실행과 제출·채점까지 한 화면에서 끝냅니다.',
  },
  {
    title: '공정한 경쟁',
    body: '풀이 과정의 무결성 신호를 기록해 외부 코드 붙여넣기 같은 부정행위로부터 랭킹을 지킵니다.',
  },
  {
    title: '정답자 전용 토론',
    body: '문제를 맞힌 사람만 토론에 참여할 수 있습니다. 스포일러 걱정 없이 풀이와 코드리뷰를 나눕니다.',
  },
]

const STEPS: { no: string; title: string; body: string }[] = [
  { no: '1', title: '문제를 풉니다', body: '난이도별 문제를 웹 IDE에서 바로 풀어보세요.' },
  { no: '2', title: '즉시 채점', body: '제출하면 테스트케이스로 자동 채점됩니다.' },
  { no: '3', title: '티어 상승', body: '첫 정답마다 시즌 점수가 쌓이고 티어가 갱신됩니다.' },
]

const TIER_ORDER: TierName[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond']

function CtaButtons() {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      <Link
        to="/login"
        style={{
          background: 'transparent',
          color: C.accent,
          border: `1px solid ${C.accent}`,
          padding: '10px 28px',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        무료로 시작하기
      </Link>
      <Link
        to="/login"
        style={{
          background: 'transparent',
          color: C.text,
          border: `1px solid ${C.border}`,
          padding: '10px 28px',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        로그인
      </Link>
    </div>
  )
}

export function LandingPage() {
  const { me, booting } = useAuth()

  if (booting) return <LoadingView label="세션 확인 중…" />
  if (me) return <Navigate to="/home" replace />

  return (
    <div style={{ fontFamily: fontStack, color: C.text }}>
      {/* Hero */}
      <section
        style={{
          background: C.bg,
          borderBottom: `1px solid ${C.borderLight}`,
          padding: '72px 0 64px',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 600,
              color: C.accent,
              border: `1px solid ${C.accent}`,
              padding: '3px 10px',
              marginBottom: 16,
              letterSpacing: 0.5,
              fontFamily: monoStack,
            }}
          >
            시즌제 알고리즘 트레이닝
          </div>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 700,
              margin: '0 0 12px',
              letterSpacing: -1,
              fontFamily: monoStack,
            }}
          >
            <span style={{ color: C.accent }}>{'❯ '}</span>
            매 시즌, 랭킹으로 증명하는
            <br />
            알고리즘 실력
          </h1>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: '0 0 28px' }}>
            문제를 풀면 바로 채점되고, 첫 정답마다 시즌 점수가 쌓입니다.
            <br />
            브론즈에서 다이아까지 — 이번 시즌의 티어를 올려보세요.
          </p>
          <CtaButtons />
        </div>
      </section>

      {/* 티어 소개 */}
      <section style={{ padding: '28px 0', borderBottom: `1px solid ${C.borderLight}` }}>
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            fontFamily: monoStack,
            fontSize: 13,
          }}
        >
          {TIER_ORDER.map((t, i) => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: tierMap[t].color, fontWeight: 700 }}>{tierMap[t].label}</span>
              {i < TIER_ORDER.length - 1 && <span style={{ color: C.border }}>→</span>}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '56px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px', textAlign: 'center' }}>
            <span style={{ color: C.accent, fontFamily: monoStack }}>{'// '}</span>
            GrindAlgorithm이 제공하는 것
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {FEATURES.map(f => (
              <div
                key={f.title}
                style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 18 }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        style={{ padding: '48px 0', background: C.surface, borderTop: `1px solid ${C.borderLight}` }}
      >
        <div className="container">
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px', textAlign: 'center' }}>
            <span style={{ color: C.accent, fontFamily: monoStack }}>{'// '}</span>
            이렇게 진행됩니다
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {STEPS.map(s => (
              <div key={s.no} style={{ textAlign: 'center', padding: '8px 12px' }}>
                <div
                  style={{
                    fontFamily: monoStack,
                    fontSize: 22,
                    fontWeight: 700,
                    color: C.accent,
                    marginBottom: 8,
                  }}
                >
                  {s.no}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px' }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        style={{ padding: '56px 0', textAlign: 'center', borderTop: `1px solid ${C.borderLight}` }}
      >
        <div className="container">
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
            이번 시즌은 이미 시작됐습니다
          </h2>
          <p style={{ fontSize: 14, color: C.muted, margin: '0 0 24px' }}>
            지금 가입하면 바로 시즌 랭킹에 참여할 수 있습니다.
          </p>
          <CtaButtons />
        </div>
      </section>

      <footer
        style={{
          padding: '20px 0',
          borderTop: `1px solid ${C.borderLight}`,
          textAlign: 'center',
          fontSize: 12,
          color: C.muted,
        }}
      >
        Grind<span style={{ color: C.accent }}>Algorithm</span> — 시즌제 알고리즘 트레이닝 플랫폼
      </footer>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useSplit } from '../hooks/useSplit'
import { C, fontStack, monoStack, submissionStatusText } from '../theme'
import { Tier } from '../components/Tier'
import { CodeEditor } from '../components/CodeEditor'
import { LoadingView, ErrorView } from '../components/Feedback'
import { IntegrityIndicator, useAntiCheat } from '../antiCheat'
import { ALLOW_EXTERNAL_PASTE } from '../config/testMode'
import { LANGUAGES, STARTER_CODE, isStarterCode } from '../constants/languages'
import type { LanguageCode, SubmissionStatus } from '../types/domain'

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export function IDEPage() {
  const { problemId } = useParams<{ problemId: string }>()
  // 본문 열람 = 풀이 시작 시각 기록 (B2). 열람 시점이 서버에 남는다.
  const open = useApi(() => api.openProblem(problemId!), [problemId])
  // 지원 언어 (요건 24) — 서버 목록이 소유자. 로딩 전/실패 시엔 로컬 상수로 동작.
  // 프론트 자산(스타터 코드·하이라이트)이 없는 신규 언어는 걸러낸다.
  const languagesApi = useApi(() => api.getLanguages(), [])
  const languages = (languagesApi.data ?? LANGUAGES).filter(l => l.code in STARTER_CODE)
  // 부정행위 신호 수집 (A3) — 훅 순서를 지키려고 본문 로딩 전에도 호출한다.
  // solveSessionId가 채워지기 전까지는 수집만 하고 전송하지 않는다.
  const antiCheat = useAntiCheat({
    solveSessionId: open.data?.solveSessionId ?? null,
    problemId: problemId!,
    initialCode: STARTER_CODE.java11,
  })

  const [lang, setLang] = useState<LanguageCode>('java11')
  const [code, setCode] = useState(STARTER_CODE.java11)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [verdict, setVerdict] = useState<SubmissionStatus | null>(null)
  const [pasteWarned, setPasteWarned] = useState(false)
  const pasteTimer = useRef<number | undefined>(undefined)

  // 패널 리사이즈 (요건 22) — 좁은 화면에선 세로 스택으로 두고 리사이즈를 끈다
  const narrow = useMediaQuery('(max-width: 900px)')
  const rootRef = useRef<HTMLDivElement>(null)
  const rightColRef = useRef<HTMLDivElement>(null)
  // 문제 패널 폭 (컨테이너 대비 비율)
  const hSplit = useSplit({
    storageKey: 'ide.split.problem',
    defaultRatio: 0.4,
    min: 0.2,
    max: 0.65,
    axis: 'x',
    containerRef: rootRef,
  })
  // IO 패널 높이 (우측 컬럼 대비 비율 — 아래쪽 기준이라 invert)
  const vSplit = useSplit({
    storageKey: 'ide.split.io',
    defaultRatio: 0.3,
    min: 0.12,
    max: 0.6,
    axis: 'y',
    invert: true,
    containerRef: rightColRef,
  })

  useEffect(() => () => window.clearTimeout(pasteTimer.current), [])

  if (open.loading) return <LoadingView label="문제를 여는 중… (열람 시각이 기록됩니다)" />
  if (open.error || !open.data)
    return <ErrorView error={open.error ?? new Error('데이터 없음')} onRetry={open.reload} />

  const { problem, body, solveSessionId } = open.data

  const handleLang = (next: LanguageCode) => {
    setLang(next)
    // 스타터 코드 교체는 유저 입력이 아니므로 탐지 기준선을 같이 옮긴다 (대량 삽입 오탐 방지)
    if (isStarterCode(code)) {
      setCode(STARTER_CODE[next])
      antiCheat.resetBaseline(STARTER_CODE[next])
    }
  }

  const handleReset = () => {
    setCode(STARTER_CODE[lang])
    antiCheat.resetBaseline(STARTER_CODE[lang])
  }

  const handlePasteBlocked = () => {
    setPasteWarned(true)
    window.clearTimeout(pasteTimer.current)
    pasteTimer.current = window.setTimeout(() => setPasteWarned(false), 4000)
  }

  const handleRun = async () => {
    if (!input.trim()) {
      setOutput('⚠ 입력이 비어있습니다. "예제 입력 채우기" 또는 직접 입력하세요.')
      return
    }
    setRunning(true)
    setOutput('실행 중...')
    try {
      const r = await api.runCode({
        problemId: problem.problemId,
        solveSessionId,
        language: lang,
        sourceCode: code,
        stdin: input,
      })
      const lines = [r.stdout || '(출력 없음)']
      if (r.stderr) lines.push('', '[stderr]', r.stderr)
      lines.push(
        '',
        '────────────',
        `실행 시간: ${r.timeMs ?? '-'} ms`,
        `메모리: ${r.memoryKb != null ? r.memoryKb.toLocaleString() : '-'} KB`,
        `종료 코드: ${r.exitCode ?? '-'}`,
      )
      setOutput(lines.join('\n'))
    } catch (err) {
      setOutput(`⚠ 실행 실패: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setRunning(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setVerdict(null)
    setOutput('제출 중...')
    // 제출 시점의 무결성 기록을 서버가 먼저 갖도록 남은 신호를 밀어낸다 (실패해도 제출은 진행)
    await antiCheat.flush()
    try {
      const { submissionId } = await api.submit({
        problemId: problem.problemId,
        solveSessionId,
        language: lang,
        sourceCode: code,
      })
      // 채점 폴링 — 종결 상태까지 반복 (연동 문서 §제출 흐름)
      for (;;) {
        const s = await api.getSubmission(submissionId)
        if (s.status === 'queued' || s.status === 'judging') {
          setOutput(`채점 중... (${s.progress ?? 0}%)`)
          await sleep(700)
          continue
        }
        const lines = [`결과: ${submissionStatusText(s.status)}`]
        if (s.timeMs != null) lines.push(`실행 시간: ${s.timeMs} ms`)
        if (s.memoryKb != null) lines.push(`메모리: ${s.memoryKb.toLocaleString()} KB`)
        if (s.status === 'accepted') {
          lines.push('', '✓ 정답입니다! 이제 이 문제의 토론에 참여할 수 있습니다.')
        }
        setOutput(lines.join('\n'))
        setVerdict(s.status)
        break
      }
    } catch (err) {
      setOutput(`⚠ 제출 실패: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      ref={rootRef}
      style={{
        display: 'flex',
        flexDirection: narrow ? 'column' : 'row',
        height: 'calc(100vh - 53px)',
        minHeight: 560,
        borderTop: `1px solid ${C.borderLight}`,
        fontFamily: fontStack,
      }}
    >
      {/* Left: problem panel */}
      <div
        style={{
          ...(narrow
            ? { width: '100%', height: '40%', minHeight: 220, borderBottom: `1px solid ${C.border}` }
            : { width: `${hSplit.ratio * 100}%`, borderRight: `1px solid ${C.border}` }),
          overflow: 'auto',
          background: C.bg,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${C.border}`,
            background: C.surface,
            fontSize: 12,
            fontWeight: 600,
            color: C.muted,
            letterSpacing: 0.3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>문제</span>
          <Link to={`/problems/${problem.problemId}`} style={{ color: C.accent, fontWeight: 400 }}>
            상세 화면 ↗
          </Link>
        </div>
        <div style={{ padding: '16px 20px', overflow: 'auto', flex: 1 }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              margin: '0 0 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontFamily: monoStack, color: C.muted, fontSize: 13 }}>
              {problem.displayNo}
            </span>
            {problem.title}
            <Tier tier={problem.tier} />
          </h2>
          <div
            style={{
              display: 'flex',
              gap: 12,
              fontSize: 11,
              color: C.muted,
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: `1px solid ${C.borderLight}`,
            }}
          >
            <span>시간 {problem.timeLimitSec}초</span>
            <span>메모리 {problem.memoryLimitMb}MB</span>
            <span>정답률 {problem.stats.acceptanceRate.toFixed(1)}%</span>
          </div>

          <h3 style={{ fontSize: 13, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>문제</h3>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: '0 0 16px' }}>{body.description}</p>

          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>입력</h3>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: '0 0 16px' }}>{body.inputSpec}</p>

          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>출력</h3>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: '0 0 16px' }}>{body.outputSpec}</p>

          {body.samples.map((sample, i) => (
            <div key={i}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                예제 입력{body.samples.length > 1 ? ` ${i + 1}` : ''}
              </h3>
              <pre
                style={{
                  background: C.surfaceAlt,
                  padding: 10,
                  fontSize: 12,
                  margin: '0 0 12px',
                  border: `1px solid ${C.border}`,
                  fontFamily: monoStack,
                  lineHeight: 1.5,
                  overflow: 'auto',
                }}
              >
                {sample.input}
              </pre>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                예제 출력{body.samples.length > 1 ? ` ${i + 1}` : ''}
              </h3>
              <pre
                style={{
                  background: C.surfaceAlt,
                  padding: 10,
                  fontSize: 12,
                  margin: '0 0 16px',
                  border: `1px solid ${C.border}`,
                  fontFamily: monoStack,
                  lineHeight: 1.5,
                  overflow: 'auto',
                }}
              >
                {sample.output}
              </pre>
            </div>
          ))}

          <button
            onClick={() => setInput(body.samples[0]?.input ?? '')}
            style={{
              background: 'transparent',
              border: `1px solid ${C.border}`,
              padding: '6px 12px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: fontStack,
              color: C.text,
            }}
          >
            예제 입력 채우기 ↓
          </button>
        </div>
      </div>

      {/* 좌우 분할 핸들 */}
      {!narrow && (
        <div
          {...hSplit.handleProps}
          title="드래그로 폭 조절 · 더블클릭으로 초기화"
          style={{
            width: 6,
            flexShrink: 0,
            cursor: 'col-resize',
            touchAction: 'none',
            background: hSplit.dragging ? C.accent : C.border,
            borderRight: `1px solid ${C.border}`,
          }}
        />
      )}

      {/* Right: editor + IO + status */}
      <div
        ref={rightColRef}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            borderBottom: `1px solid ${C.border}`,
            background: C.surface,
            gap: 8,
          }}
        >
          <select
            value={lang}
            onChange={e => handleLang(e.target.value as LanguageCode)}
            style={{
              border: `1px solid ${C.border}`,
              padding: '4px 8px',
              fontSize: 12,
              fontFamily: fontStack,
              background: C.bg,
              color: C.text,
              cursor: 'pointer',
            }}
          >
            {languages.map(l => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px 8px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: fontStack,
              color: C.muted,
            }}
            title="스타터 코드로 초기화"
          >
            ↺ 초기화
          </button>
          {pasteWarned && (
            <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>
              ⚠ 외부에서 복사한 코드는 붙여넣을 수 없습니다 (이 에디터에서 복사한 코드는 가능)
            </span>
          )}
          {/* 테스트 빌드에서만 나타난다. 운영 빌드에 이 문구가 보이면 플래그가 잘못 켜진 것이다. */}
          {ALLOW_EXTERNAL_PASTE && (
            <span style={{ fontSize: 11, color: C.amber, fontWeight: 600 }}>
              테스트 모드 · 외부 붙여넣기 허용됨 (신호는 그대로 기록됩니다)
            </span>
          )}
          <div style={{ flex: 1 }} />
          {antiCheat.summary.level === 'risk' && (
            <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>
              ⚠ 이 제출은 검토 대상으로 표시됩니다
            </span>
          )}
          <IntegrityIndicator
            summary={antiCheat.summary}
            events={antiCheat.events}
            onOpen={antiCheat.refresh}
          />
          <button
            onClick={handleRun}
            disabled={running || submitting}
            style={{
              background: 'transparent',
              color: C.text,
              border: `1px solid ${C.border}`,
              padding: '5px 14px',
              fontSize: 12,
              cursor: running ? 'wait' : 'pointer',
              fontFamily: fontStack,
              fontWeight: 600,
            }}
          >
            {running ? '실행 중...' : '▶ 실행'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={running || submitting}
            style={{
              background: 'transparent',
              color: C.accent,
              border: `1px solid ${C.accent}`,
              padding: '6px 18px',
              fontSize: 12,
              cursor: submitting ? 'wait' : 'pointer',
              fontFamily: fontStack,
              fontWeight: 600,
            }}
          >
            {submitting ? '채점 중...' : '제출'}
          </button>
        </div>

        {/* Editor */}
        <CodeEditor
          code={code}
          onChange={setCode}
          lang={lang}
          onPasteBlocked={handlePasteBlocked}
          monitor={antiCheat.monitor}
        />

        {/* 상하 분할 핸들 (에디터 ↕ IO) */}
        {!narrow && (
          <div
            {...vSplit.handleProps}
            title="드래그로 높이 조절 · 더블클릭으로 초기화"
            style={{
              height: 6,
              flexShrink: 0,
              cursor: 'row-resize',
              touchAction: 'none',
              background: vSplit.dragging ? C.accent : C.border,
              borderTop: `1px solid ${C.border}`,
            }}
          />
        )}

        {/* IO panel */}
        <div
          style={{
            display: 'flex',
            background: C.bg,
            flexShrink: 0,
            ...(narrow
              ? { borderTop: `1px solid ${C.border}`, height: 200, minHeight: 200 }
              : { height: `${vSplit.ratio * 100}%`, minHeight: 120 }),
          }}
        >
          <div
            style={{
              flex: 1,
              borderRight: `1px solid ${C.borderLight}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                color: C.muted,
                background: C.surface,
                borderBottom: `1px solid ${C.border}`,
                letterSpacing: 0.3,
              }}
            >
              입력
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="테스트 입력을 여기에 붙여넣으세요"
              spellCheck={false}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: 10,
                fontFamily: monoStack,
                fontSize: 12,
                resize: 'none',
                background: C.bg,
                color: C.text,
                lineHeight: 1.5,
              }}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                color: C.muted,
                background: C.surface,
                borderBottom: `1px solid ${C.border}`,
                letterSpacing: 0.3,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>출력</span>
              {verdict && (
                <span style={{ fontWeight: 400 }}>
                  <Link to="/problems?tab=submissions" style={{ color: C.accent }}>
                    채점 현황 →
                  </Link>
                  {verdict === 'accepted' && (
                    <>
                      {' · '}
                      <Link
                        to={`/problems/${problem.problemId}/discussion`}
                        style={{ color: C.green }}
                      >
                        토론 참여 →
                      </Link>
                    </>
                  )}
                </span>
              )}
            </div>
            <pre
              style={{
                flex: 1,
                margin: 0,
                padding: 10,
                fontFamily: monoStack,
                fontSize: 12,
                overflow: 'auto',
                background: C.bg,
                color: output.startsWith('⚠') ? C.red : C.text,
                lineHeight: 1.5,
              }}
            >
              {output || '실행 결과가 여기에 표시됩니다.'}
            </pre>
          </div>
        </div>

        {/* Status bar */}
        <div
          style={{
            display: 'flex',
            padding: '4px 12px',
            fontSize: 11,
            color: C.muted,
            background: C.surface,
            borderTop: `1px solid ${C.border}`,
            gap: 16,
            fontFamily: monoStack,
            alignItems: 'center',
          }}
        >
          <span>Ln {code.split('\n').length}</span>
          <span>{languages.find(l => l.code === lang)?.label ?? lang}</span>
          <span>UTF-8</span>
          <span>Spaces: 4</span>
          <div style={{ flex: 1 }} />
          <span>크기: {new Blob([code]).size} B</span>
        </div>
      </div>
    </div>
  )
}

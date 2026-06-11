import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { C, fontStack, monoStack, submissionStatusText } from '../theme'
import { Tier } from '../components/Tier'
import { CodeEditor } from '../components/CodeEditor'
import { LoadingView, ErrorView } from '../components/Feedback'
import { LANGUAGES, STARTER_CODE, isStarterCode } from '../constants/languages'
import type { LanguageCode, SubmissionStatus } from '../types/domain'

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export function IDEPage() {
  const { problemId } = useParams<{ problemId: string }>()
  // 본문 열람 = 풀이 시작 시각 기록 (B2). 열람 시점이 서버에 남는다.
  const open = useApi(() => api.openProblem(problemId!), [problemId])

  const [lang, setLang] = useState<LanguageCode>('java11')
  const [code, setCode] = useState(STARTER_CODE.java11)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [verdict, setVerdict] = useState<SubmissionStatus | null>(null)
  const [pasteWarned, setPasteWarned] = useState(false)
  const pasteTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(pasteTimer.current), [])

  if (open.loading) return <LoadingView label="문제를 여는 중… (열람 시각이 기록됩니다)" />
  if (open.error || !open.data)
    return <ErrorView error={open.error ?? new Error('데이터 없음')} onRetry={open.reload} />

  const { problem, body, solveSessionId } = open.data

  const handleLang = (next: LanguageCode) => {
    setLang(next)
    if (isStarterCode(code)) setCode(STARTER_CODE[next])
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
      style={{
        display: 'flex',
        height: 'calc(100vh - 53px)',
        minHeight: 560,
        borderTop: `1px solid ${C.borderLight}`,
        fontFamily: fontStack,
      }}
    >
      {/* Left: problem panel */}
      <div
        style={{
          width: '40%',
          borderRight: `1px solid ${C.border}`,
          overflow: 'auto',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${C.borderLight}`,
            background: C.bg,
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
          <Link to={`/problems/${problem.problemId}`} style={{ color: C.blue, fontWeight: 400 }}>
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
                  background: C.bg,
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
                  background: C.bg,
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
              background: '#fff',
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

      {/* Right: editor + IO + status */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            borderBottom: `1px solid ${C.borderLight}`,
            background: C.bg,
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
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setCode(STARTER_CODE[lang])}
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
              ⚠ 부정행위 방지 정책에 따라 붙여넣기가 제한됩니다
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={handleRun}
            disabled={running || submitting}
            style={{
              background: '#fff',
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
              background: C.blue,
              color: '#fff',
              border: 'none',
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
        <CodeEditor code={code} onChange={setCode} lang={lang} onPasteBlocked={handlePasteBlocked} />

        {/* IO panel */}
        <div
          style={{
            display: 'flex',
            borderTop: `1px solid ${C.border}`,
            background: '#fff',
            height: 200,
            minHeight: 200,
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
                background: C.bg,
                borderBottom: `1px solid ${C.borderLight}`,
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
                background: '#fff',
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
                background: C.bg,
                borderBottom: `1px solid ${C.borderLight}`,
                letterSpacing: 0.3,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>출력</span>
              {verdict && (
                <span style={{ fontWeight: 400 }}>
                  <Link to="/problems?tab=submissions" style={{ color: C.blue }}>
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
                background: '#fff',
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
            background: C.bg,
            borderTop: `1px solid ${C.borderLight}`,
            gap: 16,
            fontFamily: monoStack,
            alignItems: 'center',
          }}
        >
          <span>Ln {code.split('\n').length}</span>
          <span>{LANGUAGES.find(l => l.code === lang)?.label}</span>
          <span>UTF-8</span>
          <span>Spaces: 4</span>
          <div style={{ flex: 1 }} />
          <span>크기: {new Blob([code]).size} B</span>
        </div>
      </div>
    </div>
  )
}

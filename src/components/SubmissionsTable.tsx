import { Link } from 'react-router-dom'
import { C, monoStack, submissionStatusColor, submissionStatusText } from '../theme'
import { langLabel } from '../constants/languages'
import { formatRelative } from '../utils/format'
import { bodyRowStyle, tableStyle, td, th, theadRowStyle } from './table'
import type { SubmissionSummary } from '../types/domain'

function problemLabel(s: SubmissionSummary): string {
  const no = /^\d+$/.test(s.problem.displayNo) ? `${s.problem.displayNo}번` : s.problem.displayNo
  return `${no} · ${s.problem.title}`
}

/** 채점 현황 표 — 문제 페이지 내부 탭/문제 상세 '내 제출' 공용 */
export function SubmissionsTable({ rows }: { rows: SubmissionSummary[] }) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: C.muted }}>
        제출 내역이 없습니다.
      </div>
    )
  }
  return (
    <table style={{ ...tableStyle, fontSize: 12 }}>
      <thead>
        <tr style={theadRowStyle}>
          {['채점 번호', '아이디', '문제', '결과', '메모리', '시간', '언어', '코드 길이', '제출 시각'].map(h => (
            <th key={h} style={th({ padding: '10px 6px' })}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(s => (
          <tr key={s.submissionId} style={bodyRowStyle}>
            <td style={td({ padding: '10px 6px', fontFamily: monoStack, color: C.muted })}>
              {s.submissionId}
            </td>
            <td style={td({ padding: '10px 6px' })}>
              <Link to={`/users/${s.user.handle}`} style={{ color: C.blue }}>
                {s.user.handle}
              </Link>
            </td>
            <td style={td({ padding: '10px 6px' })}>
              <Link to={`/problems/${s.problem.problemId}`} style={{ color: C.blue }}>
                {problemLabel(s)}
              </Link>
            </td>
            <td
              style={td({
                padding: '10px 6px',
                color: submissionStatusColor(s.status),
                fontWeight: 600,
              })}
            >
              {submissionStatusText(s.status, s.progress)}
            </td>
            <td style={td({ padding: '10px 6px', fontVariantNumeric: 'tabular-nums', color: C.muted })}>
              {s.memoryKb != null ? `${s.memoryKb.toLocaleString()} KB` : '-'}
            </td>
            <td style={td({ padding: '10px 6px', fontVariantNumeric: 'tabular-nums', color: C.muted })}>
              {s.timeMs != null ? `${s.timeMs} ms` : '-'}
            </td>
            <td style={td({ padding: '10px 6px', color: C.muted })}>{langLabel(s.language)}</td>
            <td style={td({ padding: '10px 6px', fontVariantNumeric: 'tabular-nums', color: C.muted })}>
              {s.codeBytes} B
            </td>
            <td style={td({ padding: '10px 6px', color: C.muted })}>{formatRelative(s.submittedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

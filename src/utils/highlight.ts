import type { LanguageCode } from '../types/domain'

// 경량 신택스 하이라이터 — 와이어프레임 이관.
// MVP용 정규식 기반: 외부 에디터 라이브러리(CodeMirror/Monaco) 도입 전까지 사용.

const HL: Record<TokenKind, string> = {
  keyword: '#0033b3',
  type: '#267f99',
  string: '#a31515',
  comment: '#6e9956',
  number: '#1750eb',
}

type TokenKind = 'keyword' | 'type' | 'string' | 'comment' | 'number'

const LANG_TOKENS: Record<LanguageCode, Record<TokenKind, RegExp>> = {
  java11: {
    keyword:
      /\b(?:public|private|protected|class|static|void|int|long|double|float|boolean|char|byte|short|new|return|if|else|for|while|do|true|false|null|import|package|extends|implements|abstract|final|try|catch|finally|throw|throws|interface|enum|switch|case|break|continue|this|super|instanceof)\b/,
    type: /\b(?:Integer|String|Boolean|Long|Double|Float|Character|List|ArrayList|Map|HashMap|Set|HashSet|Scanner|BufferedReader|InputStreamReader|StringBuilder|StringTokenizer|Arrays|Collections|System|Math|Object)\b/,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
    comment: /\/\/.*|\/\*[\s\S]*?\*\//,
    number: /\b\d+(?:\.\d+)?\b/,
  },
  python3: {
    keyword:
      /\b(?:def|class|if|elif|else|for|while|return|import|from|as|in|not|and|or|is|True|False|None|try|except|finally|with|lambda|yield|pass|break|continue|global|nonlocal|raise|assert)\b/,
    type: /\b(?:int|str|float|bool|list|dict|tuple|set|range|len|print|input|map|filter|zip|enumerate|sorted|reversed|sum|min|max|abs|round|open|type)\b/,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
    comment: /#.*/,
    number: /\b\d+(?:\.\d+)?\b/,
  },
  cpp17: {
    keyword:
      /\b(?:int|long|double|float|char|bool|void|auto|const|static|extern|return|if|else|for|while|do|true|false|nullptr|NULL|new|delete|class|struct|public|private|protected|template|typename|using|namespace|include|define|ifdef|ifndef|endif|try|catch|throw|virtual|override|sizeof)\b/,
    type: /\b(?:string|vector|map|unordered_map|set|unordered_set|queue|deque|stack|priority_queue|pair|size_t|iostream|cin|cout|endl|cerr|ios_base)\b/,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
    comment: /\/\/.*|\/\*[\s\S]*?\*\/|#\w+.*/,
    number: /\b\d+(?:\.\d+)?\b/,
  },
  nodejs: {
    keyword:
      /\b(?:const|let|var|function|return|if|else|for|while|do|true|false|null|undefined|import|export|from|class|extends|new|this|try|catch|finally|throw|async|await|of|in|typeof|instanceof|switch|case|break|continue|default)\b/,
    type: /\b(?:console|Math|Number|String|Array|Object|JSON|Promise|Map|Set|Symbol|require|module|process)\b/,
    string: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/,
    comment: /\/\/.*|\/\*[\s\S]*?\*\//,
    number: /\b\d+(?:\.\d+)?\b/,
  },
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const ORDER: TokenKind[] = ['comment', 'string', 'keyword', 'type', 'number']

export function highlight(code: string, lang: LanguageCode): string {
  const tokens = LANG_TOKENS[lang]
  if (!tokens) return escapeHtml(code)
  const combined = new RegExp(
    ORDER.map(name => `(?<${name}>${tokens[name].source})`).join('|'),
    'g',
  )

  let html = ''
  let last = 0
  for (const m of code.matchAll(combined)) {
    html += escapeHtml(code.slice(last, m.index))
    let kind: TokenKind | null = null
    if (m.groups) {
      for (const k of ORDER) {
        if (m.groups[k] !== undefined) {
          kind = k
          break
        }
      }
    }
    html += kind
      ? `<span style="color:${HL[kind]}">${escapeHtml(m[0])}</span>`
      : escapeHtml(m[0])
    last = (m.index ?? 0) + m[0].length
  }
  html += escapeHtml(code.slice(last))
  return html
}

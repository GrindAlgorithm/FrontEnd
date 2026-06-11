import type { LanguageCode } from '../types/domain'

/** 지원 언어 — Judge0 language_id 매핑은 백엔드 책임 (연동 문서 §Judge0) */
export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'java11', label: 'Java 11' },
  { code: 'python3', label: 'Python 3' },
  { code: 'cpp17', label: 'C++17' },
  { code: 'nodejs', label: 'JavaScript (Node.js)' },
]

export function langLabel(code: LanguageCode): string {
  return LANGUAGES.find(l => l.code === code)?.label ?? code
}

export const STARTER_CODE: Record<LanguageCode, string> = {
  java11: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // 여기에 코드를 작성하세요
    }
}`,
  python3: `import sys
input = sys.stdin.readline

# 여기에 코드를 작성하세요
`,
  cpp17: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // 여기에 코드를 작성하세요

    return 0;
}`,
  nodejs: `const input = require('fs').readFileSync('/dev/stdin').toString().trim().split('\\n');

// 여기에 코드를 작성하세요
`,
}

const STARTER_SET = new Set(Object.values(STARTER_CODE).map(s => s.trim()))

/** 현재 코드가 (아무 언어의) 스타터 코드 그대로인지 — 언어 전환 시 덮어쓰기 판단용 */
export function isStarterCode(code: string): boolean {
  return !code.trim() || STARTER_SET.has(code.trim())
}

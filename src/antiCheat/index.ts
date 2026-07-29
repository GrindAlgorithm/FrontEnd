// 부정행위 탐지 모듈 (스펙 A3) — IDE에서만 사용한다.
export { CheatDetector, THRESHOLDS, riskLevel, EMPTY_SUMMARY } from './detector'
export type { EditorMonitor, KeyStroke } from './detector'
export { useAntiCheat } from './useAntiCheat'
export type { AntiCheatHandle } from './useAntiCheat'
export { IntegrityIndicator } from './IntegrityIndicator'

import { useEffect, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'

/**
 * 드래그로 두 패널의 분할 비율을 조절하는 훅 (요건 22 — IDE 패널 리사이즈).
 *
 * ratio는 컨테이너 안에서 기준 패널이 차지하는 비율(0~1).
 * - axis 'x'는 핸들 왼쪽, 'y'는 핸들 위쪽이 기준. invert면 반대쪽을 기준으로 잰다
 *   (아래쪽 패널 높이를 저장하고 싶을 때 등).
 * - min/max 클램프가 최소 폭 가드 — 어느 쪽도 0으로 접히지 않는다.
 * - localStorage(storageKey)에 저장해 재진입 시 복원. 핸들 더블클릭으로 기본값 복귀.
 */
export function useSplit({
  storageKey,
  defaultRatio,
  min,
  max,
  axis,
  invert = false,
  containerRef,
}: {
  storageKey: string
  defaultRatio: number
  min: number
  max: number
  axis: 'x' | 'y'
  invert?: boolean
  containerRef: RefObject<HTMLElement | null>
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const [ratio, setRatio] = useState(() => {
    const saved = Number(localStorage.getItem(storageKey))
    return Number.isFinite(saved) && saved > 0 ? clamp(saved) : defaultRatio
  })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    localStorage.setItem(storageKey, String(ratio))
  }, [storageKey, ratio])

  const handleProps = {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
      // preventDefault로 드래그 중 텍스트 선택 시작을 막는다
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
    },
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return
      const raw =
        axis === 'x' ? (e.clientX - rect.left) / rect.width : (e.clientY - rect.top) / rect.height
      setRatio(clamp(invert ? 1 - raw : raw))
    },
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      setDragging(false)
    },
    onPointerCancel: () => setDragging(false),
    onDoubleClick: () => setRatio(defaultRatio),
  }

  return { ratio, dragging, handleProps }
}

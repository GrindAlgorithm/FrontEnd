/**
 * 테스트 환경에서만 켜는 완화 플래그.
 *
 * staging 배포에서 IDE 를 손으로 시험할 때 외부 붙여넣기가 막혀 있으면 코드를 매번
 * 타이핑해야 해서 검증이 번거롭다. 그래서 빌드 시점 플래그로 차단만 풀어 준다.
 *
 * 기본값은 **차단**이다. `.env.production` 에는 이 변수를 두지 않고, staging 배포
 * 워크플로에서만 `VITE_ALLOW_PASTE=true` 로 빌드한다.
 *
 * 주의: 차단만 풀고 **부정행위 신호는 그대로 기록한다.** 붙여넣기가 탐지·전송되는
 * 경로까지 함께 시험할 수 있어야 하고, 신호까지 꺼 버리면 이 플래그가 켜진 빌드에서
 * 무결성 기능이 통째로 죽은 것처럼 보이기 때문이다.
 */
export const ALLOW_EXTERNAL_PASTE = import.meta.env.VITE_ALLOW_PASTE === 'true'

if (ALLOW_EXTERNAL_PASTE) {
  // 운영 빌드에 실수로 섞여 들어가면 눈에 띄어야 한다.
  // eslint-disable-next-line no-console
  console.warn(
    '[GrindAlgorithm] 테스트 모드 — IDE 외부 붙여넣기 차단이 해제되어 있습니다. ' +
      '운영 빌드라면 VITE_ALLOW_PASTE 를 제거하세요.',
  )
}

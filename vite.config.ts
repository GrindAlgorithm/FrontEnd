import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 백엔드(Spring Boot, 기본 :8080) 연동용 dev 프록시.
// VITE_USE_MOCK=false 로 전환하면 /api 요청이 아래 프록시를 타고 백엔드로 흐른다.
// /oauth2, /login/oauth2 는 Spring Security OAuth2 리다이렉트 경로 (docs/BACKEND_INTEGRATION.md 참고)
// 8080 이 Hyper-V 예약 포트에 물려 못 뜰 때는 BACKEND_ORIGIN=http://localhost:9090 처럼 재정의한다.
const backend = process.env.BACKEND_ORIGIN ?? 'http://localhost:8080'

// dev 서버와 preview 서버가 같은 프록시를 쓴다. preview 는 배포 산출물(dist)을 그대로 띄우므로
// 배포 전에 "빌드된 앱이 목이 아니라 실서버를 부르는지" 를 여기서 확인할 수 있다.
// 배포 환경에서는 Caddy 가 같은 역할을 한다(BackEnd/deploy/Caddyfile).
const proxy = {
  '/api': { target: backend, changeOrigin: true },
  '/oauth2': { target: backend, changeOrigin: true },
  '/login/oauth2': { target: backend, changeOrigin: true },
}

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
})

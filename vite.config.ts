import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 백엔드(Spring Boot, 기본 :8080) 연동용 dev 프록시.
// VITE_USE_MOCK=false 로 전환하면 /api 요청이 아래 프록시를 타고 백엔드로 흐른다.
// /oauth2, /login/oauth2 는 Spring Security OAuth2 리다이렉트 경로 (docs/BACKEND_INTEGRATION.md 참고)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/oauth2': { target: 'http://localhost:8080', changeOrigin: true },
      '/login/oauth2': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})

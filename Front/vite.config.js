import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 프론트에서 '/api'로 시작하는 요청은 백엔드로 넘긴다
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 이미지 파일 등 정적 리소스도 백엔드에서 제공
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})

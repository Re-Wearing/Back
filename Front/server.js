// server.js
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// dist 폴더의 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'dist')))

// React Router 지원: 모든 경로를 index.html로 돌려보내기
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// GCP App Engine은 PORT 환경변수를 통해 포트 지정
const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

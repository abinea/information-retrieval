import express, { Router, query } from 'express'
import bodyParser from 'body-parser'
import engine from '../lib/engine'

const app = express()
const router = Router()

app.use(bodyParser.json())

app.use(router)

router.get('/', (_, res) => {
  res.send('Hello World!')
})
router.post('/api/query', (req, res) => {
  const { query } = req.body
  // 格式化时间 响应时间 传入参数
  const start = process.hrtime.bigint()
  const body = engine.search(query)
  const time = (process.hrtime.bigint() - start).toString()
  res.json({ ...body, time })
})

app.listen(3000, '127.0.0.1', () => {
  console.log('server listening on port 3000!')
})

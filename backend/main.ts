import express, { Router } from 'express'
import bodyParser from 'body-parser'
import bunyan from 'bunyan'
import engine from './lib/engine'

const app = express()
const router = Router()
const logger = bunyan.createLogger({ name: 'logger' })

app.use(bodyParser.json())

app.use(router)

router.get('/', (_, res) => {
  res.send('Hello World!')
})
router.post('/api/query', (req, res) => {
  const { query } = req.body
  // 格式化时间 响应时间 传入参数
  const time = new Date().toISOString()
  logger.info(`[${time}] ${query}`)
  const start = Date.now()
  const body = engine.search(query)
  const end = Date.now()
  res.json({ ...body, time: ((end - start) / 1000).toFixed(2) })
})

app.listen(3000, '127.0.0.1', () => {
  console.log('Server listening on port 3000!')
})

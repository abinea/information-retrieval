import engine from '../lib/engine'

Bun.serve({
  async fetch(req): Promise<Response> {
    const url = new URL(req.url)
    if (/\/api\/query\/?$/.test(url.pathname) && req.method === 'POST') {
      const start = process.hrtime.bigint()
      const data = await req.json()
      const result = engine.search(data.query)
      const time = (process.hrtime.bigint() - start).toString()

      return new Response(JSON.stringify({ ...result, time }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } else {
      return new Response('404', { status: 404 })
    }
  },
  hostname: '127.0.0.1',
  port: 3000,
})

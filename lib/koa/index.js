const Koa = require('koa')
const onerror = require('koa-onerror')
const logger = require('koa-logger')
const serve = require('koa-static')
const path = require('path')
const cors = require('@koa/cors')
const compress = require('koa-compress')

const app = new Koa()

onerror(app)

app.use(logger())

app.use(
  compress({
    threshold: 2048,
    flush: require('zlib').Z_SYNC_FLUSH
  })
)

app.use(async function (ctx, next) {
  ctx.compress = true
  await next()
})

app.use(cors({ origin: '*' }))

app.use(serve(path.join(__dirname + '/static')))

app.use(ctx => {
  if (ctx.path == '/') {
    ctx.redirect('/index.html')
  }
})

//app.listen(3000)

module.exports = app

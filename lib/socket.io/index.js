const app = require('../koa')
const adm = require('../advertiser/advertiseManager')

const server = require('http').createServer(app.callback())
const io = require('socket.io')(server)
const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log('server is listening at port: ' + port)
})

io.on('connection', socket => {
  socket.on('disconnect', () => {
    if (socket.roomId) {
      adm.stopAdvertiser(socket.roomId).catch(a => a)
    }
  })
  socket.on('create', option => {
    adm
      .createAdvertiser(option)
      .then(ad => {
        socket.roomId = ad.roomId
        socket.emit('onCreate', { status: 'success', roomId: ad.roomId, sn: ad.sn })

        ad.on('start', roomId => {
          socket.emit('onStart', roomId)
        })

        ad.on('stop', reason => {
          if (!reason || reason == 'stop') {
            socket.roomId = undefined
          }
          socket.emit('onStop', reason)
        })

        ad.on('sendsuccess', obj => {
          socket.emit('onSendsuccess', obj)
        })

        ad.on('sendfail', obj => {
          socket.emit('onSendfail', obj)
        })
      })
      .catch(e => {
        socket.emit('onCreate', { status: 'fail', message: e.message })
      })
  })

  socket.on('addad', option => {
    let { roomId, content } = option
    if (!roomId) {
      return socket.emit('onAddad', { status: 'fail', message: 'no roomId' })
    }
    if (!content || !content.length) {
      return socket.emit('onAddad', { status: 'fail', message: 'no content' })
    }

    let ad = adm.getAdvertiser(roomId)
    if (!ad) {
      return socket.emit('onAddad', { status: 'fail', message: 'no advertiser on roomId: ' + roomId })
    }

    ad.addad(content)
    socket.emit('onAddad', { status: 'success', count: ad.contents.length })
  })

  socket.on('pause', roomId => {
    let ad = adm.getAdvertiser(roomId)
    if (!ad) {
      return socket.emit('onPause', { status: 'fail', message: 'no advertiser on roomId: ' + roomId })
    }

    ad.pause()
  })

  socket.on('resume', roomId => {
    let ad = adm.getAdvertiser(roomId)
    if (!ad) {
      return socket.emit('onResume', { status: 'fail', message: 'no advertiser on roomId: ' + roomId })
    }

    ad.resume()
  })

  socket.on('stopAd', roomId => {
    adm
      .stopAdvertiser(roomId)
      .then(flag => {
        if (!flag) {
          socket.emit('onStopAd', { status: 'fail', message: 'stop failed on roomId: ' + roomId })
        }
      })
      .catch(e => {
        socket.emit('onStopAd', { status: 'fail', message: 'no advertiser on roomId: ' + roomId })
      })
  })
})

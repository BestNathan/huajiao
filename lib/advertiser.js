const Connector = require('./connector')
const request = require('./request')
const eventEmitter = require('events')
const util = require('util')

module.exports = class Advertiser extends eventEmitter {
  constructor({ roomId, uid, mode = 'normal', contents, interval = 10000, times = 10 }) {
    super()
    this.roomId = roomId
    this.uid = uid
    this.mode = mode
    this.contents = util.isArray(contents) ? contents : [contents]
    this.interval = interval
    this.times = times

    this.sendTimes = 0
    this.sender = null
    this.timer = null
    this.connector = new Connector({ roomId })

    this.joined = false
    this.started = false
    this._init()
  }
  addad(contents) {
    util.isArray(contents) ? this.contents.concat(contents) : this.contents.push(contents)
  }
  resume() {
    if (this.started) {
      return
    }
    if (this.joined) {
      this._startAd()
    }
  }
  pause() {
    this._stopAd('pause')
  }
  destroy(reason) {
    this._stopAd(reason)
    this.connector.close()
  }
  _init() {
    if (this.mode == 'bomb') {
      this.times = this.times > 100 ? 100 : this.times
    } else if (this.mode == 'fakechat') {
      this.timerFn = setTimeout
      this.clearTimerFn = clearTimeout
      this._refreshInterval()
    } else {
      this.timerFn = setInterval
      this.clearTimerFn = clearInterval
    }

    this.connector.on('message', (msg, mem) => {
      this.emit('message', msg)
      if (msg.type == 10) {
        if (this.mode == 'bomb') {
          this.started && this._sendChat(msg.extends.userid)
        } else {
          this.sender = msg.extends.userid
        }
      }
    })
    this.connector.on('joinchatroom', () => {
      this.joined = true
      this.emit('join')
      if (this.mode == 'bomb') {
        this.started = true
        this.emit('start', this.roomId)
      } else {
        this._startAd()
      }
    })
    this.connector.on('joinchatroomfail', reason => {
      this.destroy('joinfail')
    })
    this.connector.on('error', error => {
      this.destroy(error.message)
    })
    this.connector.connect()
  }
  async _sendChat(userid) {
    let content = this._randomContent()
    if (this.mode == 'bomb') {
      content += '.' + this.sendTimes
    }
    let sendObj = {
      room: this.roomId,
      content,
      userid
    }
    let res = await request.sendChat(sendObj)
    if (res.errmsg == 'ok') {
      this.emit('sendsuccess', sendObj)
      this.sendTimes++
      if (this.sendTimes >= this.times) {
        this.destroy()
      }
    } else {
      this.emit('sendfail', sendObj)
    }

    this.sender = null
  }
  async _getSender() {
    if (this.sender && !this.useAudience) {
      return this.sender
    }

    let audiences = null
    if (this.uid) {
      audiences = await request.getAudiences({ roomId: this.roomId, uid: this.uid })
    } else {
      audiences = await request.getAudiencesByRoomId(this.roomId)
    }

    let len = audiences.length
    if (len) {
      return audiences[Math.floor(Math.random() * len)]
    }
  }
  _startAd() {
    this.started = true
    this.clearTimerFn(this.timer)
    let cb = () => {
      if (!this.started) {
        return
      }
      this._getSender()
        .then(userid => {
          if (!userid) {
            return
          }
          return this._sendChat(userid)
        })
        .catch(a => a)

      if (this.mode == 'fakechat') {
        this._refreshInterval()
        this.timer = this.timerFn(cb, this.interval)
      }
    }
    this.timer = this.timerFn(cb, this.interval)
    this.emit('start', this.roomId)
  }
  _refreshInterval() {
    this.interval = Math.random() * 5000
  }
  _stopAd(reason) {
    this.started = false
    clearInterval(this.timer)
    this.emit('stop', reason)
  }
  _randomContent() {
    let len = this.contents.length
    if (len == 1) {
      return this.contents[0]
    }
    return this.contents[Math.floor(Math.random() * len)]
  }
}

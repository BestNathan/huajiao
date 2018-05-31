const eventEmitter = require('events')
const util = require('./util')
const packet = require('./protocol/packet')
const debug = require('debug')('connector')

const msgids = require('./constants/msgids')
const payloadtype = require('./constants/payloadTypes')

const ws = require('websocket')
const websocket = ws.client

const defaultKey = (function() {
  function e(e) {
    return util.RC4.decode(Buffer.from(e, 'base64').toString('utf8'), t)
  }
  var t = 'socketio',
    i = e('w7h6VMOWbcKqCGA='),
    o = e('wqh+VMKMO8KrCzE='),
    s = e('w7kvUsOXOMO9DGc='),
    a = e('w7IsVcKOPsO+Dmg=')
  e('w7IiVcKMO8K+Dzg='), e('w7I6VMOOOMO9DGc=')
  return i + o + s + a + ''
})()

module.exports = class Connector extends eventEmitter {
  constructor(config) {
    super()
    this.config = Object.assign(
      {
        flag: 'qh',
        protocolVersion: 1,
        clientVersion: 101,
        appId: 2080,
        defaultKey,
        reserved: '',
        senderType: 'jid',
        wsServer: 'wss://bridge.huajiao.com',
        timeout: 2e4,
        debug: !0
      },
      config
    )

    this.config.roomId = String(this.config.roomId)
    this.config.sender = this.config.sender ? String(this.config.sender) : util.randomString(11, !0) + Date.now()
    this.config.password = this.config.sender

    this.handshake = !1
    this.session = undefined
  }
  connect() {
    this.socket = new websocket()
    this.socket.connect(this.config.wsServer)
    this.socket.on('connect', this._onConnection.bind(this))
    this.socket.on('connectFailed', e => {
      this.emit('error', e)
    })
    this.socket.on('error', e => {
      this.emit('error', e)
    })
  }
  reconnect() {
    this.close()
    this.connect()
  }
  close() {
    this._sendQuitChatroomPack()
    this._clearStatus()
    this.socket && (this.socket.abort(), this.socket.socket.destroy(), (this.socket = null))
  }
  _clearStatus() {
    clearTimeout(this._heartbeatTimeout),
      clearInterval(this._heartbeatTimer),
      clearTimeout(this._joinChatroomTimeout),
      clearTimeout(this._quitChatroomTimeout),
      (this.connected = !1),
      (this.handshake = !1),
      (this.session = undefined)
  }
  /**
   *
   * @param {ws.connection} conn
   */
  _onConnection(conn) {
    this.connection = conn

    this.connection.on('message', data => {
      this._onMessage(data.binaryData)
    })
    this.connection.on('error', e => {
      this.emit('error', e)
    })

    this._sendHandshakePack()
  }
  _send(buffer) {
    this.connection.sendBytes(buffer)
  }
  _sendHandshakePack() {
    this._send(packet.handshakePacket(this))
    debug('handshake sended')
  }
  _sendLoginPack(resp) {
    this._send(packet.loginPacket(this, resp.initLoginResp.serverRam))
    debug('login sended')
  }
  _sendJoinRoomPack() {
    this._send(packet.joinRoomPacket(this))
    debug('joinroom sended')

    this._joinChatroomTimeout = setTimeout(() => {
      clearTimeout(this._joinChatroomTimeout)
      this._joinChatroomTimeout = null
      this.emit('joinchatroomfail', 'timeout')
    }, this.config.timeout)
  }
  _sendQuitChatroomPack() {
    this._send(packet.quitRoomPacket(this))
    debug('quitroom sended')

    this._quitChatroomTimeout = setTimeout(() => {
      clearTimeout(this._quitChatroomTimeout)
      this._quitChatroomTimeout = null
      this.emit('quitchatroomfail')
    }, this.config.timeout)
  }
  _onMessage(buffer) {
    !this.handshake
      ? this._handleHandshake(buffer)
      : this.session == undefined
        ? this._handleLogin(buffer)
        : this._handleMessage(buffer)
  }
  /**
   *
   * @param {Buffer} buffer
   */
  _handleHandshake(buffer) {
    let flag = buffer.slice(0, 2).toString('utf8')
    if (flag != this.config.flag) {
      throw new Error('\u670d\u52a1\u5668\u54cd\u5e94\u6807\u8bc6\uff08flag\uff09\u6709\u8bef')
    }

    let buf = util.RC4.decode(buffer.slice(6), this.config.defaultKey)
    let message = packet.CommunicationDataUnpacket(buf)

    if (message.msgid != msgids.InitLoginResp) {
      throw new Error('\u54cd\u5e94msgid\u5f02\u5e38\uff0cmsgid == ' + message.msgid)
    }

    if (!this._sn || !message.sn || this._sn != message.sn) {
      throw new Error('sn\u9a8c\u8bc1\u5931\u8d25, Message Type: ' + message.msgid)
    }

    this.handshake = !0
    this.emit('handshake')
    this._sendLoginPack(message.resp)
  }
  /**
   *
   * @param {Buffer} buffer
   */
  _handleLogin(buffer) {
    let buf = this.config.sig
      ? util.RC4.decode(buffer.slice(4), this.config.defaultKey)
      : util.RC4.decode(buffer.slice(4), this.config.password)
    let message = packet.CommunicationDataUnpacket(buf)

    if (message.msgid !== msgids.LoginResp)
      throw new Error('\u54cd\u5e94msgid\u5f02\u5e38\uff0cmsgid == ' + message.msgid)
    if (!this._sn || !message.sn || message.sn != this._sn)
      throw new Error('sn\u9a8c\u8bc1\u5931\u8d25, Message Type: ' + message.msgid)

    if (message.error) {
      throw new Error('login Error: ' + message.error.id)
    }

    this.session = message.resp.login.sessionKey
    this.emit('login')
    this._initHeartBeat()
    this._sendJoinRoomPack()
  }
  /**
   *
   * @param {Buffer} buffer
   */
  _handleMessage(buffer) {
    if (buffer.byteLength == 4 && buffer.readInt32BE() == 0) {
      return void this._handleHeartbeat()
    }

    let buf =
      '' != this.session && this.session != undefined
        ? util.RC4.decode(buffer.slice(4), this.session)
        : buffer.slice(4).toString('base64')
    let message = packet.CommunicationDataUnpacket(buf)
    debug('recv message')
    if (message.msgid == msgids.Service_Resp) {
      this._handleService_Req(message.resp.serviceResp.response)
    } else if (message.msgid == msgids.NewMessageNotify) {
      this._handleNewMessageNotify(message.notify.newinfoNtf)
    } else {
      debug('msgid unhandle')
      this.emit('unhandledMessage', 'msgid', message)
    }
  }
  _handleHeartbeat() {
    clearTimeout(this._heartbeatTimeout)
    this._heartbeatTimeout = null
  }
  _handleService_Req(resp) {
    debug('recv Service_Req')
    let message = packet.ChatRoomUnpacket(resp)
    let data = message.toUserData
    if (data.payloadtype == payloadtype.applyjoinchatroomresp) {
      if (data.result == payloadtype.successful) {
        clearTimeout(this._joinChatroomTimeout)
        this.emit('joinchatroom')
      } else {
        this.emit('joinchatroomfail', Buffer.from(data.reason, 'base64').toString())
      }
    } else if (data.payloadtype == payloadtype.quitchatroomresp) {
    }
  }
  _handleNewMessageNotify(newinfoNtf) {
    if (newinfoNtf.infoType != 'chatroom') {
      return
    }
    debug('recv NewMessageNotify')
    let message = packet.ChatRoomUnpacket(newinfoNtf.infoContent)
    let data = message.toUserData
    if (data && data.result == payloadtype.successful) {
      if (data.payloadtype === payloadtype.newmsgnotify && data.newmsgnotify) {
        debug('recv: newmsgnotify')
        if (data.newmsgnotify && data.newmsgnotify.msgtype == 0) {
          let content = data.newmsgnotify.msgcontent && Buffer.from(data.newmsgnotify.msgcontent, 'base64').toString()
          let members = data.newmsgnotify.memcount
          content && this.emit('message', JSON.parse(content), members)
        }
      } else if (data.payloadtype === payloadtype.memberjoinnotify && data.memberjoinnotify) {
        debug('recv: memberjoinnotify')
        this.emit('unhandledMessage', 'memberjoinnotify', message)
      } else if (data.payloadtype === payloadtype.memberquitnotify && data.memberquitnotify) {
        debug('recv: memberquitnotify')
        this.emit('unhandledMessage', 'memberquitnotify', message)
      } else if (data.payloadtype === payloadtype.membergzipnotify && data.multinotifyList) {
        debug('recv: membergzipnotify')
        data.multinotifyList &&
          data.multinotifyList.forEach(notify => {
            util.ungzip(Buffer.from(notify.data,'base64'), (err, buffer) => {
              if (err) {
                return this.emit('error', err)
              }
              let message = packet.ChatRoomNewMsgUnpacket(buffer.toString('base64'))
              this.emit('message',JSON.parse(Buffer.from(message.msgcontent,'base64').toString()), notify.memcount || 0)
            })
          })
      }
    }
  }
  _initHeartBeat() {
    this._heartbeatTimer = setInterval(() => {
      this._sendHeartbeatPack()
    }, 6e4)
  }
  _sendHeartbeatPack() {
    this._send(Buffer.alloc(4, 0))
    this._heartbeatTimeout = setTimeout(() => {
      clearTimeout(this._heartbeatTimeout)
      this._heartbeatTimeout = null
      this.reconnect()
    }, this.config.timeout)
  }
}

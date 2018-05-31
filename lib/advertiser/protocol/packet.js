const msgids = require('../constants/msgids')
const { getCommunicationDataProto, getChatRoomProto } = require('./proto')
const util = require('../util')

const CommunicationDataUnpacket = buffer => {
  return getCommunicationDataProto('Message')
    .deserializeBinary(buffer)
    .toObject()
}

const ChatRoomUnpacket = buffer => {
  return getChatRoomProto('ChatRoomPacket')
    .deserializeBinary(buffer)
    .toObject()
}

const ChatRoomNewMsgUnpacket = buffer => {
  return getChatRoomProto('ChatRoomNewMsg')
    .deserializeBinary(buffer)
    .toObject()
}


const CommunicationDataRequestMessagePacket = (connector, msgid, request, sn) => {
  let config = connector.config
  connector._sn = sn || util.randomNumber(10)
  return getCommunicationDataProto('Message', {
    msgid,
    sn: connector._sn,
    sender: config.sender,
    sender_type: config.senderType,
    req: getCommunicationDataProto('Request', request)
  }).serializeBinary()
}

const ChatRoomRequestMessagePacket = (connector, upToServer) => {
  let config = connector.config
  let roomBuf = Buffer.from(config.roomId, 'utf8').toString('base64')
  return getChatRoomProto('ChatRoomPacket', {
    client_sn: connector._sn,
    roomid: roomBuf,
    appid: config.appId,
    uuid: util.md5(util.randomString(10) + '0000000001' + Date.now()),
    to_server_data: getChatRoomProto('ChatRoomUpToServer', upToServer)
  }).serializeBinary()
}

const handshakePacket = connector => {
  let config = connector.config
  let sig = config.sig

  let headerBuf = Buffer.alloc(16)
  let headerOffset = 0
  headerOffset = headerBuf.write(config.flag)
  headerOffset = headerBuf.writeUInt8(config.protocolVersion << 4, headerOffset)
  headerOffset = headerBuf.writeUInt8(config.clientVersion, headerOffset)
  headerOffset = headerBuf.writeUInt16BE(config.appId, headerOffset)
  headerOffset = headerBuf.writeUInt32BE(0, headerOffset)
  headerOffset = headerBuf.writeUInt16BE(0, headerOffset)

  let protoBuf = CommunicationDataRequestMessagePacket(connector, msgids.InitLoginReq, {
    init_login_req: getCommunicationDataProto('InitLoginReq', {
      client_ram: util.randomString(10),
      sig
    })
  })
  
  protoBuf = Buffer.from(util.RC4.encode(Buffer.from(protoBuf), config.defaultKey))

  let totalLength = 16 + protoBuf.length
  headerBuf.writeUInt32BE(totalLength, headerOffset)
  return Buffer.concat([headerBuf, protoBuf])
}

const loginPacket = (connector, server_ram) => {
  let config = connector.config
  let secret_ram = Buffer.alloc(server_ram.length + 8)
  secret_ram.write(server_ram + util.randomString(8))

  let headerBuf = Buffer.alloc(4)
  let protoBuf = CommunicationDataRequestMessagePacket(connector, msgids.LoginReq, {
    login: getCommunicationDataProto('LoginReq', {
      app_id: config.appId,
      server_ram: server_ram,
      secret_ram: util.RC4.encode(secret_ram, config.password),
      verf_code: util.makeVerfCode(config.sender),
      net_type: 4,
      mobile_type: 'pc',
      not_encrypt: !0,
      platform: 'h5'
    })
  })
  
  protoBuf = Buffer.from(util.RC4.encode(Buffer.from(protoBuf), config.defaultKey))

  headerBuf.writeInt32BE(protoBuf.length + 4)
  return Buffer.concat([headerBuf, protoBuf])
}

const joinRoomPacket = connector => {
  let config = connector.config

  let headerBuf = Buffer.alloc(4)
  let roomBuf = Buffer.from(config.roomId, 'utf8').toString('base64')
  let protoBuf = CommunicationDataRequestMessagePacket(connector, msgids.Service_Req, {
    service_req: getCommunicationDataProto('Service_Req', {
      service_id: 10000006,
      request: ChatRoomRequestMessagePacket(connector, {
        payloadtype: 102,
        applyjoinchatroomreq: getChatRoomProto('ApplyJoinChatRoomRequest', {
          roomid: roomBuf,
          room: getChatRoomProto('ChatRoom', { roomid: roomBuf }),
          userid_type: 0
        })
      })
    })
  })

  protoBuf =
    '' != this.session && this.session != undefined
      ? Buffer.from(util.RC4.encode(Buffer.from(protoBuf), connector.session))
      : Buffer.from(protoBuf)

  headerBuf.writeInt32BE(protoBuf.length + 4)
  return Buffer.concat([headerBuf, protoBuf])
}

const quitRoomPacket = connector => {
  let config = connector.config

  let headerBuf = Buffer.alloc(4)
  let roomBuf = Buffer.from(config.roomId, 'utf8').toString('base64')
  let protoBuf = CommunicationDataRequestMessagePacket(connector, msgids.Service_Req, {
    service_req: getCommunicationDataProto('Service_Req', {
      service_id: 10000006,
      request: ChatRoomRequestMessagePacket(connector, {
        payloadtype: 103,
        quitchatroomreq: getChatRoomProto('QuitChatRoomRequest', {
          roomid: roomBuf,
          room: getChatRoomProto('ChatRoom', { roomid: roomBuf })
        })
      })
    })
  })

  protoBuf =
    '' != this.session && this.session != undefined
      ? Buffer.from(util.RC4.encode(Buffer.from(protoBuf), connector.session))
      : Buffer.from(protoBuf)

  headerBuf.writeInt32BE(protoBuf.length + 4)
  return Buffer.concat([headerBuf, protoBuf])
}

module.exports = {
  CommunicationDataUnpacket,
  ChatRoomUnpacket,
  ChatRoomNewMsgUnpacket,
  handshakePacket,
  loginPacket,
  joinRoomPacket,
  quitRoomPacket
}

const CommunicationData = require('../proto/CommunicationData_pb')
const ChatRoom = require('../proto/ChatRoom_pb')

const parseKey = key => {
  let arr = key.split('_')
  return arr
    .map(v => {
      return v.charAt(0).toUpperCase() + v.slice(1)
    })
    .join('')
}

const generateProto = (ctor, params) => {
  let proto = new ctor()
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      let parsedKey = parseKey(key)
      let fn = proto['set' + parsedKey]
      if (fn) {
        fn.call(proto, params[key])
      }
    }
  }
  return proto
}

const getCommunicationDataProto = (message, params) => {
  return params ? generateProto(CommunicationData[message], params) : CommunicationData[message]
}

const getChatRoomProto = (message, params) => {
  return params ? generateProto(ChatRoom[message], params) : ChatRoom[message]
}

module.exports = {
  getCommunicationDataProto,
  getChatRoomProto
}

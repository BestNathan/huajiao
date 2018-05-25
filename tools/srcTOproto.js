const fs = require('fs')
const util = require('util')

const parseProto = messages => {
  if (!util.isArray(messages)) {
    messages = [messages]
  }

  let content = `syntax = "proto2";\r\n\r\n`

  messages.forEach(message => {
    let messageContent = `message ${message.name} {\r\n`
    message.fields.forEach(filed => {
      messageContent += `  ${filed.rule} ${filed.type} ${filed.name} = ${filed.id}${
        filed.options && filed.options.default ? `[default = ${filed.options.default}]` : ''
      };\r\n`
    })

    messageContent += `}\r\n\r\n`

    content += messageContent
  })

  fs.writeFileSync('./tools/parsed.proto', content)
}

let messages = [
  {
    name: 'CRPair',
    fields: [
      { rule: 'required', type: 'string', name: 'key', id: 1 },
      { rule: 'optional', type: 'bytes', name: 'value', id: 2 }
    ]
  },
  {
    name: 'CRUser',
    fields: [
      { rule: 'optional', type: 'bytes', name: 'userid', id: 1 },
      { rule: 'optional', type: 'string', name: 'name', id: 2 },
      { rule: 'repeated', type: 'CRPair', name: 'publicsetting', id: 3 },
      { rule: 'repeated', type: 'CRPair', name: 'privatesetting', id: 4 },
      { rule: 'optional', type: 'int32', name: 'status', id: 5 },
      { rule: 'optional', type: 'bytes', name: 'userdata', id: 6 }
    ]
  },
  {
    name: 'ChatRoom',
    fields: [
      { rule: 'required', type: 'bytes', name: 'roomid', id: 1 },
      { rule: 'optional', type: 'CRUser', name: 'creater', id: 2 },
      { rule: 'optional', type: 'string', name: 'name', id: 3 },
      { rule: 'optional', type: 'uint64', name: 'version', id: 4 },
      { rule: 'optional', type: 'uint64', name: 'maxmsgid', id: 5 },
      { rule: 'optional', type: 'uint64', name: 'memcountlimit', id: 6 },
      { rule: 'optional', type: 'string', name: 'roomtype', id: 7 },
      { rule: 'repeated', type: 'CRPair', name: 'properties', id: 8 },
      { rule: 'repeated', type: 'CRUser', name: 'members', id: 9 },
      { rule: 'repeated', type: 'bytes', name: 'blacklist', id: 10 },
      { rule: 'optional', type: 'string', name: 'gameid', id: 11 },
      { rule: 'repeated', type: 'CRUser', name: 'tempmembers', id: 12 },
      { rule: 'optional', type: 'bytes', name: 'partnerdata', id: 13 }
    ]
  },
  {
    name: 'CreateChatRoomRequest',
    fields: [
      { rule: 'optional', type: 'string', name: 'gameid', id: 1 },
      { rule: 'optional', type: 'string', name: 'roomname', id: 2 },
      { rule: 'optional', type: 'uint64', name: 'memcountlimit', id: 3 },
      { rule: 'optional', type: 'string', name: 'roomtype', id: 4 },
      { rule: 'repeated', type: 'CRUser', name: 'members', id: 5 },
      { rule: 'optional', type: 'CRUser', name: 'creater', id: 6 },
      { rule: 'repeated', type: 'CRPair', name: 'properties', id: 7 }
    ]
  },
  { name: 'CreateChatRoomResponse', fields: [{ rule: 'optional', type: 'ChatRoom', name: 'room', id: 1 }] },
  {
    name: 'CreateMultiChatRoomRequest',
    fields: [
      { rule: 'repeated', type: 'CreateChatRoomRequest', name: 'rooms', id: 1 },
      { rule: 'optional', type: 'CRUser', name: 'creater', id: 2 }
    ]
  },
  {
    name: 'CreateMultiChatRoomResponse',
    fields: [
      { rule: 'repeated', type: 'ChatRoom', name: 'rooms', id: 1 },
      { rule: 'optional', type: 'CRUser', name: 'creater', id: 2 }
    ]
  },
  {
    name: 'GetChatRoomDetailRequest',
    fields: [
      { rule: 'required', type: 'bytes', name: 'roomid', id: 1 },
      { rule: 'optional', type: 'int32', name: 'index', id: 2 },
      { rule: 'optional', type: 'int32', name: 'offset', id: 3 }
    ]
  },
  { name: 'GetChatRoomDetailResponse', fields: [{ rule: 'optional', type: 'ChatRoom', name: 'room', id: 1 }] },
  {
    name: 'ApplyJoinChatRoomRequest',
    fields: [
      { rule: 'required', type: 'bytes', name: 'roomid', id: 1 },
      { rule: 'optional', type: 'ChatRoom', name: 'room', id: 2 },
      { rule: 'optional', type: 'int32', name: 'userid_type', id: 3 },
      { rule: 'optional', type: 'bytes', name: 'userdata', id: 4 },
      { rule: 'optional', type: 'bool', name: 'no_userlist', id: 5, options: { default: !1 } }
    ]
  },
  {
    name: 'ApplyJoinChatRoomResponse',
    fields: [
      { rule: 'optional', type: 'ChatRoom', name: 'room', id: 1 },
      { rule: 'optional', type: 'bool', name: 'pull_lost', id: 2, options: { default: !0 } }
    ]
  },
  {
    name: 'QuitChatRoomRequest',
    fields: [
      { rule: 'required', type: 'bytes', name: 'roomid', id: 1 },
      { rule: 'optional', type: 'ChatRoom', name: 'room', id: 2 }
    ]
  },
  { name: 'QuitChatRoomResponse', fields: [{ rule: 'optional', type: 'ChatRoom', name: 'room', id: 1 }] },
  { name: 'QueryAllGameRoomRequest', fields: [] },
  { name: 'QueryAllGameRoomResponse', fields: [{ rule: 'repeated', type: 'CRPair', name: 'maplist', id: 1 }] },
  { name: 'QueryChatRoomIDRequest', fields: [{ rule: 'required', type: 'string', name: 'gameid', id: 1 }] },
  {
    name: 'QueryChatRoomIDResponse',
    fields: [
      { rule: 'optional', type: 'bytes', name: 'roomid', id: 1 },
      { rule: 'optional', type: 'string', name: 'gameid', id: 2 }
    ]
  },
  {
    name: 'UpdateRoomIDRequest',
    fields: [
      { rule: 'required', type: 'string', name: 'gameid', id: 1 },
      { rule: 'required', type: 'bytes', name: 'roomid', id: 2 }
    ]
  },
  { name: 'UpdateRoomIDResponse', fields: [] },
  {
    name: 'UpdateChatRoomRequest',
    fields: [
      { rule: 'required', type: 'bytes', name: 'roomid', id: 1 },
      { rule: 'required', type: 'ChatRoom', name: 'room', id: 2 }
    ]
  },
  { name: 'UpdateChatRoomResponse', fields: [{ rule: 'optional', type: 'ChatRoom', name: 'room', id: 1 }] },
  {
    name: 'KickChatRoomMemberRequest',
    fields: [
      { rule: 'required', type: 'bytes', name: 'roomid', id: 1 },
      { rule: 'repeated', type: 'CRUser', name: 'members', id: 2 },
      { rule: 'optional', type: 'ChatRoom', name: 'room', id: 3 }
    ]
  },
  { name: 'KickChatRoomMemberResponse', fields: [{ rule: 'optional', type: 'ChatRoom', name: 'room', id: 1 }] },
  { name: 'SyncRoomToDBRequest', fields: [{ rule: 'required', type: 'bytes', name: 'roomid', id: 1 }] },
  { name: 'CreateChatRoomNotify', fields: [{ rule: 'required', type: 'ChatRoom', name: 'room', id: 1 }] },
  { name: 'MemberJoinChatRoomNotify', fields: [{ rule: 'required', type: 'ChatRoom', name: 'room', id: 1 }] },
  { name: 'MemberQuitChatRoomNotify', fields: [{ rule: 'required', type: 'ChatRoom', name: 'room', id: 1 }] },
  {
    name: 'KickMemberNotify',
    fields: [
      { rule: 'required', type: 'ChatRoom', name: 'room', id: 1 },
      { rule: 'optional', type: 'CRUser', name: 'user', id: 2 }
    ]
  },
  {
    name: 'UpdateChatRoomNotify',
    fields: [
      { rule: 'required', type: 'ChatRoom', name: 'room', id: 1 },
      { rule: 'optional', type: 'CRUser', name: 'user', id: 2 }
    ]
  },
  {
    name: 'ChatRoomMessageRequest',
    fields: [
      { rule: 'optional', type: 'CRUser', name: 'sender', id: 1 },
      { rule: 'required', type: 'bytes', name: 'roomid', id: 2 },
      { rule: 'required', type: 'int32', name: 'msgtype', id: 3 },
      { rule: 'optional', type: 'bytes', name: 'msgcontent', id: 4 },
      { rule: 'optional', type: 'bytes', name: 'clientparameter', id: 5 },
      { rule: 'optional', type: 'bytes', name: 'clientcache', id: 6 },
      { rule: 'optional', type: 'CreateChatRoomNotify', name: 'createnotify', id: 7 },
      { rule: 'optional', type: 'MemberJoinChatRoomNotify', name: 'joinnotify', id: 8 },
      { rule: 'optional', type: 'MemberQuitChatRoomNotify', name: 'quitnotify', id: 9 },
      { rule: 'optional', type: 'KickMemberNotify', name: 'kicknotify', id: 10 },
      { rule: 'optional', type: 'UpdateChatRoomNotify', name: 'updatenotify', id: 11 },
      { rule: 'repeated', type: 'CRPair', name: 'propertylist', id: 12 }
    ]
  },
  { name: 'ChatRoomMessageResponse', fields: [{ rule: 'optional', type: 'uint64', name: 'msgid', id: 1 }] },
  {
    name: 'ChatRoomNewMsg',
    fields: [
      { rule: 'required', type: 'bytes', name: 'roomid', id: 1 },
      { rule: 'optional', type: 'CRUser', name: 'sender', id: 2 },
      { rule: 'optional', type: 'int32', name: 'msgtype', id: 3 },
      { rule: 'optional', type: 'bytes', name: 'msgcontent', id: 4 },
      { rule: 'optional', type: 'int32', name: 'regmemcount', id: 5 },
      { rule: 'optional', type: 'int32', name: 'memcount', id: 6 },
      { rule: 'optional', type: 'uint32', name: 'msgid', id: 7 },
      { rule: 'optional', type: 'uint32', name: 'maxid', id: 8 },
      { rule: 'optional', type: 'uint64', name: 'timestamp', id: 9 }
    ]
  },
  {
    name: 'ChatRoomErrorMsg',
    fields: [
      { rule: 'required', type: 'bytes', name: 'roomid', id: 1 },
      { rule: 'required', type: 'uint64', name: 'clientsn', id: 2 },
      { rule: 'optional', type: 'int32', name: 'errorcode', id: 3 }
    ]
  },
  {
    name: 'ChatRoomMNotify',
    fields: [
      { rule: 'required', type: 'int32', name: 'type', id: 1 },
      { rule: 'required', type: 'bytes', name: 'data', id: 2 },
      { rule: 'optional', type: 'int32', name: 'regmemcount', id: 3 },
      { rule: 'optional', type: 'int32', name: 'memcount', id: 4 }
    ]
  },
  {
    name: 'SubscribeRequest',
    fields: [
      { rule: 'required', type: 'bytes', name: 'roomid', id: 1 },
      { rule: 'optional', type: 'bool', name: 'sub', id: 2, options: { default: !1 } }
    ]
  },
  {
    name: 'SubscribeResponse',
    fields: [
      { rule: 'required', type: 'bytes', name: 'roomid', id: 1 },
      { rule: 'optional', type: 'bool', name: 'sub', id: 2, options: { default: !1 } }
    ]
  },
  {
    name: 'ChatRoomUpToServer',
    fields: [
      { rule: 'required', type: 'uint32', name: 'payloadtype', id: 1 },
      { rule: 'optional', type: 'CreateChatRoomRequest', name: 'createchatroomreq', id: 2 },
      { rule: 'optional', type: 'GetChatRoomDetailRequest', name: 'getchatroominforeq', id: 3 },
      { rule: 'optional', type: 'ApplyJoinChatRoomRequest', name: 'applyjoinchatroomreq', id: 4 },
      { rule: 'optional', type: 'QuitChatRoomRequest', name: 'quitchatroomreq', id: 5 },
      { rule: 'optional', type: 'UpdateChatRoomRequest', name: 'updatechatroomreq', id: 6 },
      { rule: 'optional', type: 'KickChatRoomMemberRequest', name: 'kickmemberreq', id: 7 },
      { rule: 'optional', type: 'QueryChatRoomIDRequest', name: 'querychatroomidreq', id: 8 },
      { rule: 'optional', type: 'UpdateRoomIDRequest', name: 'updategameidreq', id: 9 },
      { rule: 'optional', type: 'QueryAllGameRoomRequest', name: 'queryallgameroomreq', id: 10 },
      { rule: 'optional', type: 'ChatRoomMessageRequest', name: 'chatroommessagereq', id: 11 },
      { rule: 'optional', type: 'CreateMultiChatRoomRequest', name: 'createrooms', id: 12 },
      { rule: 'optional', type: 'SyncRoomToDBRequest', name: 'syncroomtodba', id: 13 },
      { rule: 'optional', type: 'SubscribeRequest', name: 'subreq', id: 14 }
    ]
  },
  {
    name: 'ChatRoomDownToUser',
    fields: [
      { rule: 'required', type: 'int32', name: 'result', id: 1 },
      { rule: 'required', type: 'uint32', name: 'payloadtype', id: 2 },
      { rule: 'optional', type: 'CreateChatRoomResponse', name: 'createchatroomresp', id: 3 },
      { rule: 'optional', type: 'GetChatRoomDetailResponse', name: 'getchatroominforesp', id: 4 },
      { rule: 'optional', type: 'ApplyJoinChatRoomResponse', name: 'applyjoinchatroomresp', id: 5 },
      { rule: 'optional', type: 'QuitChatRoomResponse', name: 'quitchatroomresp', id: 6 },
      { rule: 'optional', type: 'UpdateChatRoomResponse', name: 'updatechatroomresp', id: 7 },
      { rule: 'optional', type: 'KickChatRoomMemberResponse', name: 'kickmemberresp', id: 8 },
      { rule: 'optional', type: 'QueryChatRoomIDResponse', name: 'querychatroomidresp', id: 9 },
      { rule: 'optional', type: 'UpdateRoomIDResponse', name: 'updategameidresp', id: 10 },
      { rule: 'optional', type: 'QueryAllGameRoomResponse', name: 'queryallgameroomresp', id: 11 },
      { rule: 'optional', type: 'ChatRoomMessageResponse', name: 'chatroommessageresp', id: 12 },
      { rule: 'optional', type: 'ChatRoomNewMsg', name: 'newmsgnotify', id: 13 },
      { rule: 'optional', type: 'ChatRoomErrorMsg', name: 'errormsgnotify', id: 14 },
      { rule: 'optional', type: 'CreateMultiChatRoomResponse', name: 'createrooms', id: 15 },
      { rule: 'optional', type: 'MemberJoinChatRoomNotify', name: 'memberjoinnotify', id: 16 },
      { rule: 'optional', type: 'MemberQuitChatRoomNotify', name: 'memberquitnotify', id: 17 },
      { rule: 'optional', type: 'SubscribeResponse', name: 'subresp', id: 18 },
      { rule: 'optional', type: 'bytes', name: 'reason', id: 100 },
      { rule: 'repeated', type: 'ChatRoomMNotify', name: 'multinotify', id: 200 }
    ]
  },
  {
    name: 'ChatRoomPacket',
    fields: [
      { rule: 'required', type: 'bytes', name: 'roomid', id: 1 },
      { rule: 'optional', type: 'ChatRoomUpToServer', name: 'to_server_data', id: 2 },
      { rule: 'optional', type: 'ChatRoomDownToUser', name: 'to_user_data', id: 3 },
      { rule: 'optional', type: 'string', name: 'uuid', id: 4 },
      { rule: 'optional', type: 'uint64', name: 'client_sn', id: 5 },
      { rule: 'optional', type: 'uint32', name: 'appid', id: 6 }
    ]
  }
]

parseProto(messages)

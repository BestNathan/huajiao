const axios = require('axios')
const { isArray } = require('util')

const j = a => a
const tryEval = res => {
  try {
    return eval(res.data)
  } catch (error) {
    return res.data
  }
}
const setCookieParse = cookies => {
  let cookie = ''
  if (!cookies || !cookies.length) {
    return ''
  }

  cookies.forEach(c => {
    cookie += c.split(';')[0] + '; '
  })
  return cookie
}

/**
 *
 * @param {Number} count
 * @param {Number} offset
 * @returns {Promise<{roomId: String, uid: String }[]>}
 */
const getHotLives = (count = 20, offset = 0) => {
  return axios
    .get(
      `http://webh.huajiao.com/live/listcategory?_callback=j&cateid=1000&offset=${offset}&nums=${count}&fmt=jsonp&_=${Date.now()}`
    )
    .then(tryEval)
    .then(res => {
      let lives = []
      res.data &&
        res.data.feeds &&
        res.data.feeds.forEach(live => {
          let roomId = live.feed.relateid
          let uid = live.author.uid
          lives.push({ roomId, uid })
        })
      return lives
    })
}

/**
 *
 * @param {String} roomId
 * @returns {String}
 */
const roomId2Uid = roomId => {
  return axios.get('http://www.huajiao.com/l/' + roomId).then(res => {
    let match = String(res.data).match(/\"uid\":\"(.*?)\"/)
    if (match) {
      return match[1]
    } else {
      throw new Error('roomId is Error')
    }
  })
}

/**
 *
 * @param {String} roomId
 * @returns {String}
 */
const roomId2Flv = roomId => {
  return axios.get('http://www.huajiao.com/l/' + roomId).then(res => {
    let match = String(res.data).match(/\"sn\":\"(.*?)\"/)
    if (match) {
      return match[1]
    } else {
      throw new Error('roomId is Error')
    }
  })
}

/**
 *
 * @param {String} roomId
 * @returns {Promise<String[]>}
 */
const getAudiencesByRoomId = roomId => {
  return roomId2Uid(roomId).then(uid => {
    return getAudiences({ roomId, uid })
  })
}

/**
 *
 * @param {Object} param0
 * @param {String} param0.roomId
 * @param {String} param0.uid
 * @returns {Promise<String[]>}
 */
const getAudiences = ({ roomId, uid }) => {
  return axios
    .get(`http://webh.huajiao.com/live/getAudiences?_callback=j&fmt=jsonp&liveid=${roomId}&uid=${uid}&_=${Date.now()}`)
    .then(tryEval)
    .then(res => {
      let uids = []
      res.data &&
        isArray(res.data.audiences) &&
        res.data.audiences.forEach(user => {
          uids.push(user.uid)
        })
      return uids
    })
}

//type fans online share
/**
 *
 * @param {String} roomId
 * @param {String} type - fans | online | share
 * @returns {Promise<uids: String[]>}
 */
const getRankListByRoomId = (roomId, type = 'fans') => {
  return roomId2Uid(roomId).then(uid => {
    return getRankListByUd(uid, type)
  })
}

/**
 *
 * @param {String} uid
 * @param {String} type - fans | onlien | share
 * @returns {Promise<uids: String[]>}
 */
const getRankListByUd = (uid, type = 'fans') => {
  return axios
    .get(`http://webh.huajiao.com/live/rankList?_callback=j&fmt=jsonp&uid=${uid}&name=${type}&_=${Date.now()}`)
    .then(tryEval)
    .then(res => {
      let uids = []
      isArray(res.data) &&
        res.data.forEach(user => {
          uids.push(user.uid)
        })
      return uids
    })
}

/**
 *
 * @param {Object} param0
 * @param {String} param0.room
 * @param {String} param0.content
 * @param {String} param0.userid
 * @returns {Promise<result: Object>}
 */
const sendChat = ({ room, content, userid }) => {
  if (!room || !content || !userid) {
    return Promise.reject('room, content, cookie are required')
  }
  return axios
    .get(
      `http://www.huajiao.com/api/chatSend?callback=j&taskid=${Date.now()}_1_124&liveid=${room}&topicid=${room}&type=9&content=${encodeURIComponent(
        content
      )}&_=${Date.now()}`,
      { headers: { Cookie: `userid=${userid}` } }
    )
    .then(tryEval)
}

module.exports = {
  sendChat,
  getHotLives,
  getAudiences,
  getAudiencesByRoomId,
  getRankListByRoomId,
  getRankListByUd,
  roomId2Flv
}

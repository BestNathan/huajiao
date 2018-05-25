const Advertiser = require('./advertiser')
const request = require('./request')

const MAX_ADS = 20
const ads = new Map()

const checkLimit = () => {
  return ads.size < MAX_ADS
}

async function randomLive() {
  let count = ads.size + 10
  let lives = await request.getHotLives(count)
  if (!lives) {
    return null
  }

  let random = () => {
    let live = lives[Math.floor(Math.random() * count)]
    if (ads.has(live.roomId)) {
      return random()
    } else {
      return live
    }
  }
  return random()
}

async function createAdvertiser({ roomId, contents, interval, times, mode }) {
  if (!checkLimit()) {
    throw new Error('over ad limit')
  }

  let uid
  if (!roomId) {
    let live = await randomLive()
    if (!live) {
      throw new Error('no lives')
    }
    roomId = live.roomId
    uid = live.uid
  }

  if (ads.has(roomId)) {
    throw new Error('room is has an ad')
  }

  let ad = new Advertiser({
    roomId,
    uid,
    mode,
    contents,
    interval,
    times
  })

  ad.on('stop', () => {
    ads.delete(roomId)
  })

  ads.set(roomId, ad)

  return ad
}

const getAdvertiser = roomId => {
  if (ads.has(roomId)) {
    return ads.get(roomId)
  }
  return null
}

const stopAdvertiser = roomId => {
  if (!ads.has(roomId)) {
    return Promise.reject('noAd')
  }

  return new Promise((resolve, reject) => {
    let ad = ads.get(roomId)
    let timer = setTimeout(() => {
      resolve(false)
    }, 10000)

    ad.on('stop', () => {
      clearTimeout(timer)
      resolve(true)
    })

    ad._stopAd()
  })
}

const pushContent = (roomId, contents) => {
  if (!ads.has(roomId)) {
    return
  }

  let ad = ads.get(roomId)
  ad.addad(contents)
}

module.exports = {
  createAdvertiser,
  getAdvertiser,
  stopAdvertiser,
  pushContent
}

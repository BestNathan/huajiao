const adm = require('./lib/advertiseManager')

adm
  .createAdvertiser({
    roomId: 228209003,
    contents: '轰炸机测试，如有打扰请见谅。。。',
    mode: 'bomb',
    times: 20,
  })
  .then(ad => {
    ad.on('start', roomId => {
      console.log('advertiser start ar room: ' + roomId)
    })
  })

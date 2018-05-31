const crypto = require('crypto')
const zlib = require('zlib')

const ungzip = (buffer, fn) => {
  zlib.gunzip(buffer, fn)
}

const md5 = str => {
  return crypto
    .createHash('md5')
    .update(str, 'utf8')
    .digest('hex')
}

const f = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const randomString = function(e, t) {
  for (var i = [], r = t ? f.slice(0, 10) : f, n = 0; n < e; n++) i.push(r.charAt(Math.floor(Math.random() * r.length)))
  return i.join('')
}

const randomNumber = function(e) {
  return parseInt(randomString(e, !0), 10)
}

const makeVerfCode = function(e) {
  return md5(e + '360tantan@1408$').substring(24)
}

const RC4 = (function() {
  return {
    decode: function(e, t) {
      return this.encode(e, t)
    },
    encode: function(e, t) {
      var i,
        r,
        n,
        o,
        s,
        a = [],
        l = 0,
        f = []
      for (
        e instanceof ArrayBuffer && (e = new Uint8Array(e)),
          o = e instanceof Uint8Array,
          s = o ? e.byteLength : e.length,
          i = 0;
        i < 256;
        i++
      )
        a[i] = i
      for (i = 0; i < 256; i++)
        (l = (l + a[i] + t.charCodeAt(i % t.length)) % 256), (r = a[i]), (a[i] = a[l]), (a[l] = r)
      for (i = 0, l = 0, n = 0; n < s; n++)
        (i = (i + 1) % 256),
          (l = (l + a[i]) % 256),
          (r = a[i]),
          (a[i] = a[l]),
          (a[l] = r),
          (f[n] = (o ? e[n] : e.charCodeAt(n)) ^ a[(a[i] + a[l]) % 256]),
          o || (f[n] = String.fromCharCode(f[n]))
      return o ? new Uint8Array(f) : f.join('')
    }
  }
})()

module.exports = {
  randomString,
  randomNumber,
  RC4,
  makeVerfCode,
  md5,
  ungzip
}
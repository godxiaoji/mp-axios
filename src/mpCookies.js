'use strict';

var setCookie = require('set-cookie-parser');
var utils = require('./utils');

var self = require('./mpApis');

/**
 * 获取当前时间戳
 */
function getNowTime() {
  return (new Date()).getTime();
}

/**
 * 获取本地存储，支付宝需要额外兼容
 * @param {String} key
 */
function getStorageSync(key) {
  if (self.platform === 'my') {
    // 兼容支付宝
    return self.getStorageSync({ key: key }).data;
  }
  return self.getStorageSync(key);
}

var COOKIE_KEY = 'axios-cookie'; // 本地存储key名

var cookiesCache = getStorageSync(COOKIE_KEY) || {}; // 本地存储cookies数据

/**
 * 存储cookies到本地缓存中
 */
function saveCookies2Storage() {
  self.setStorage({
    key: COOKIE_KEY,
    data: cookiesCache
  });
}

/**
 * 获取针对当前url有效的cookies
 * @param {string} domain
 * @param {string} path
 * @param {boolean} isSecure 是否https
 */
function getCookies(domain, path, isSecure) {
  var cookies = [];
  var key = domain + path;
  var now = getNowTime();
  var isClearExpires = false;

  for (var groupKey in cookiesCache) {
    if (cookiesCache.hasOwnProperty(groupKey)) {
      if (key.indexOf(groupKey) !== -1) {
        var map = cookiesCache[groupKey].map;
        for (var name in map) {
          if (map.hasOwnProperty(name)) {
            var cookie = map[name];

            if ((cookie.expires === 'session' || cookie.expires > now) &&
              (!cookie.secure || isSecure)) {
              cookies.push(cookiesCache[groupKey].map[name]);
            } else {
              isClearExpires = true;
              delete cookiesCache[groupKey].map[name];
            }
          }
        }
      }
    }
  }

  if (isClearExpires) {
    saveCookies2Storage();
  }

  return cookies;
}

/**
 * 清理过期的cookies
 */
function clearExpiredCookies() {
  var now = getNowTime();

  for (var groupKey in cookiesCache) {
    if (cookiesCache.hasOwnProperty(groupKey)) {
      var map = cookiesCache[groupKey].map;
      for (var name in map) {
        if (map.hasOwnProperty(name)) {
          var expires = map[name].expires;
          if (expires === 'session' || expires < now) {
            // session是上次存的，可以清除
            delete cookiesCache[groupKey].map[name];
          }
        }
      }

      if (utils.isEmptyObject(cookiesCache[groupKey].map)) {
        delete cookiesCache[groupKey];
      }
    }
  }
  saveCookies2Storage();
}

/**
 * 设置cookie转为对象
 * @param {string} setCookieStr
 */
function setCookie2Array(setCookieStr) {
  return setCookie.parse(setCookie.splitCookiesString(setCookieStr), { decodeValues: true });
}

/**
 * cookie操作原型
 * @param {string} url 根据传入的url确定domain和path
 */
function Cookies(url) {
  var urlObj = utils.urlParse(url);

  this._url = url;
  this._domain = '.' + urlObj.host;
  this._path = '/';

  if (urlObj.pathname) {
    var temp = urlObj.pathname.split('/');
    temp.pop();
    this._path = temp.join('/');
  }

  this._secure = urlObj.protocol === 'https:';
}

Cookies.prototype = {
  write: function write(name, value, expires, path, domain, secure) {
    var cookie = {
      name: name.toString(),
      value: (!utils.isUndefined(value) && value !== null) ? encodeURIComponent(value) : '',
      secure: false,
      expires: 'session',
      path: this._path,
      domain: this._domain
    };

    if (utils.isNumber(expires)) {
      cookie.expires = expires;
      // cookie.push('expires=' + new Date(expires).toGMTString());
    } else if (expires instanceof Date) {
      cookie.expires = expires.getTime();
    }

    if (utils.isString(path)) {
      if (this._path.indexOf(path) !== -1) {
        cookie.path = path;
      }
    }

    if (utils.isString(domain)) {
      var domain2 = domain[0] !== '.' ? ('.' + domain) : domain;

      if (this._domain.indexOf(domain2) !== -1) {
        cookie.domain = domain2;
      }
    }

    if (secure === true) {
      cookie.secure = true;
      // cookie.push('secure');
    }

    var key = cookie.domain + cookie.path;

    if (!cookiesCache[key]) {
      cookiesCache[key] = {
        domain: cookie.domain,
        path: cookie.path,
        map: {}
      };
    }

    cookiesCache[key].map[cookie.name] = cookie;

    saveCookies2Storage();

    return this;
  },

  read: function read(name) {
    var cookies = getCookies(this._domain, this._path, this._secure);

    for (var i = 0, len = cookies.length; i < len; i++) {
      if (name === cookies[i].name) {
        return decodeURIComponent(cookies[i].value);
      }
    }

    return null;
  },

  remove: function remove(name) {
    for (var groupKey in cookiesCache) {
      if (cookiesCache.hasOwnProperty(groupKey)) {
        var map = cookiesCache[groupKey].map;
        if (map[name]) {
          delete cookiesCache[groupKey].map[name];
        }
      }
    }
    saveCookies2Storage();

    this._cookies = getCookies(this._domain, this._path, this._secure);

    return this;
  },

  stringify: function stringify() {
    var cookies = getCookies(this._domain, this._path, this._secure);
    var arr = [];
    cookies.forEach(function pushCookieString(v) {
      arr.push(v.name + '=' + v.value);
    });

    return arr.join('; ');
  }
};

clearExpiredCookies();

module.exports = {
  Cookies: Cookies,
  setCookie2Array: setCookie2Array
};
module.exports.default = Cookies;

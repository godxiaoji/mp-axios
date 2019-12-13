'use strict';

var axios = require('axios');

if (!axios.defaults.adapter) {
  // 有可能是小程序
  var mpApis = require('./mpApis');

  if (mpApis.platform !== 'none') {
    axios.defaults.adapter = require('./mpAdapter');
  }
}

module.exports = axios;
module.exports.default = axios;

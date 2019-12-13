'use strict';

function getMpApis() {
  if (typeof wx !== 'undefined') {
    // 微信
    wx.platform = 'wx';
    return wx;
  } else if (typeof my !== 'undefined') {
    // 阿里支付宝
    my.platform = 'my';
    return my;
  } else if (typeof tt !== 'undefined') {
    // 头条抖音
    tt.platform = 'tt';
    return tt;
  } else if (typeof swan !== 'undefined') {
    // 百度联盟
    swan.platform = 'swan';
    return swan;
  } else if (typeof qq !== 'undefined') {
    // QQ
    qq.platform = 'qq';
    return qq;
  }

  return { platform: 'none' };
}

module.exports = getMpApis();

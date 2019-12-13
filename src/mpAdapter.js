'use strict';

var settle = require('./core/settle');
var buildURL = require('./helpers/buildURL');
var createError = require('./core/createError');
var MpCookies = require('./mpCookies');
var self = require('./mpApis');

module.exports = function mpAdapter(config) {
  return new Promise(function dispatchMpRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;
    var requestUrl = buildURL(config.url, config.params, config.paramsSerializer);
    var requestTask;

    // 小程序不支持设置Referer
    delete requestHeaders.Referer;
    delete requestHeaders.referer;

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    // 模拟cookie来解决
    var cookies = new MpCookies(requestUrl);
    var cookiesStr = cookies.stringify();

    if (cookiesStr) {
      // header带上cookie
      requestHeaders.Cookie = cookiesStr;
    }

    // Add xsrf header
    var xsrfValue = config.withCredentials && config.xsrfCookieName ?
      cookies.read(config.xsrfCookieName) :
      undefined;

    if (xsrfValue) {
      requestHeaders[config.xsrfHeaderName] = xsrfValue;
    }

    // 对responseType映射小程序参数
    var responseType = (config.responseType || 'text').toLowerCase();
    var dataType = 'text';
    if (responseType === 'json') {
      dataType = 'json';
      responseType = 'text';
    } else if (responseType !== 'arraybuffer' && responseType !== 'text') {
      console.warn('The "responseType" only use "arraybuffer" or "text" in MiniProgram. Other will change to "text".');
      responseType = 'text';
    }

    var responseHeaders = null;

    /**
     * 设置响应header头
     * @param {Object|null} header
     */
    function setResponseHeaders(header) {
      if (header) {
        responseHeaders = header;

        // 处理服务端cookie
        if (header['Set-Cookie']) {
          var responseCookies = MpCookies.setCookie2Array(header['Set-Cookie']);

          responseCookies.forEach(function setCookie(v) {
            cookies.write(v.name, v.value, v.expires, v.path, v.domain, v.secure);
          });
        }
      }
    }

    var isTimeout = false;
    var isCancelToken = false;
    var timeoutTimer = null;
    var isDownload = false;
    // var isUpload = false;

    // 请求参数
    var requestConfig = {
      url: buildURL(config.url, config.params, config.paramsSerializer),
      data: requestData,
      method: config.method.toUpperCase(),
      header: requestHeaders,
      responseType: responseType,
      dataType: dataType,
      success: function success(res) {
        if (!requestTask) {
          return;
        }

        setResponseHeaders(res.header || res.headers);

        var responseData;

        if (isDownload) {
          responseData = {
            tempFilePath: res.tempFilePath,
            filePath: res.filePath
          };
        } else {
          responseData = res.data;
        }

        var response = {
          data: responseData,
          status: res.statusCode,
          statusText: res.statusCode.toString(), // 映射表后续补上
          headers: responseHeaders,
          config: config,
          request: requestTask
        };

        settle(resolve, reject, response);

        // Clean up request
        requestTask = null;
        clearTimeout(timeoutTimer);
      },
      fail: function fail(err) {
        if (!requestTask) {
          return;
        }

        var errMsg = err.errMsg;

        function handleTimeout() {
          reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
            requestTask));
        }

        if (errMsg.indexOf('timeout') !== -1) {
          // 程序设置超时
          handleTimeout();
        } else if (errMsg.indexOf('abort') !== -1) {
          // 被中止
          if (isCancelToken) {
            // 这种情况已经自行处理
          } else if (isTimeout) {
            // 插件模拟超时
            handleTimeout();
          } else {
            reject(createError('Request aborted', config, 'ECONNABORTED', requestTask));
          }
        } else {
          reject(createError('Network Error', config, null, requestTask));
        }

        // Clean up request
        requestTask = null;
        clearTimeout(timeoutTimer);
      }
    };

    var requestHandler = self.request;

    if (typeof config.onDownloadProgress === 'function') {
      requestHandler = self.downloadFile;
      isDownload = true;
    }
    // else if (typeof config.onUploadProgress === 'function') {
    //   requestHandler = self.uploadFile;
    //   isUpload = true;
    // }

    requestTask = requestHandler(requestConfig);

    // 接收header值
    // requestTask.onHeadersReceived(function setHeader(res) {
    //   setResponseHeaders(res.header || res.headers);
    // });

    if (isDownload) {
      requestTask.onProgressUpdate(config.onDownloadProgress);
    }
    // else if (isUpload) {
    //   requestTask.onProgressUpdate(config.onUploadProgress);
    // }

    // Set the request timeout in MS
    timeoutTimer = null;
    if (config.timeout > 0) {
      timeoutTimer = setTimeout(function timeoutCallback() {
        if (!requestTask) {
          return;
        }

        isTimeout = true;
        requestTask.abort();
      }, config.timeout);
    }

    // Add withCredentials to request if needed
    // if (config.withCredentials) {
    //   request.withCredentials = true;
    // }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!requestTask) {
          return;
        }

        isCancelToken = true;
        requestTask.abort();
        reject(cancel);
        // Clean up request
        requestTask = null;
        clearTimeout(timeoutTimer);
      });
    }
  });
};

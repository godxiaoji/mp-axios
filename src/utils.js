'use strict';

// utils is a library of generic helper functions non-specific to axios

var object2String = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return object2String.call(val) === '[object Array]';
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * 判断是否空对象
 * @param {object} obj
 */
function isEmptyObject(val) {
  return isObject(val) && JSON.stringify(val) === '{}';
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return object2String.call(val) === '[object Date]';
}

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return object2String.call(val) === '[object Function]';
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * url解析
 * @param {string} url
 */
function urlParse(url) {
  try {
    var temp = url.split('//');
    var protocol = temp[0];

    temp = temp[1].split('/');

    var host = temp.shift();
    var hostname = host.split(':')[0];
    var port = host.split(':')[1] || '';

    temp = temp.join('/').split('?');

    var pathname = '';
    var search = '';
    var hash = '';

    if (temp[1]) {
      // 说明有queryString
      pathname = '/' + temp[0];
      temp = temp[1].split('#');
      search = '?' + temp.shift();
    } else if (temp[0]) {
      temp = temp[0].split('#');
      pathname = '/' + temp.shift();
    }

    if (temp[0]) {
      hash = '#' + temp[0];
    }

    var query = search.substr(1);

    return {
      hash: hash,
      search: search,
      host: host,
      hostname: hostname,
      pathname: pathname,
      protocol: protocol,
      port: port,
      href: url,
      origin: protocol + '//' + host + (port ? (':' + port) : ''),
      query: query
    };
  } catch (e) {
    throw new Error('Invalid URL');
  }
}

module.exports = {
  isArray: isArray,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isEmptyObject: isEmptyObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFunction: isFunction,
  isURLSearchParams: isURLSearchParams,
  forEach: forEach,
  urlParse: urlParse
};

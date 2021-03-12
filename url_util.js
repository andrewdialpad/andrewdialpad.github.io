function objectToUrlParams (params) {
  return Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
}

function parseVersions (hostname = '') {
  const hostParts = hostname.split('-dot-');

  switch (hostParts.length) {
    case 2:
      return {
        appspotVersion: hostParts[0],
      };
    case 3:
      return {
        staticCdnVersion: hostParts[0],
        appspotVersion: hostParts[1],
      };
    default:
      return {};
  }
}

/**
 * Returns the boolean value of the url query parameter, case-insensitive
 * @param {String} : parameter name
 * @param {Any} value : parameter value
 * @param {Boolean} defaultValue : default parameter value
 */
function parseBooleanParamValue (value, defaultValue) {
  if (value === null) {
    return !!defaultValue;
  }

  const strValue = String(value).toLowerCase().trim();
  // When the specified boolean param is considered as True value
  if (['true', 'yes', '1'].includes(strValue)) {
    return true;
  }
  // When the specified boolean param is considered as False value
  if (['false', 'no', '0', 'null', 'nil'].includes(strValue)) {
    return false;
  }
  // In other cases, to use default value
  return !!defaultValue;
}

/**
 * Returns an object of the url query string
 */
function getQueryParamObject (url) {
  const urlStr = url || '';
  const parts = urlStr.split('?');
  const dict = {};

  // No question mark found
  if (parts.length <= 1) {
    return dict;
  }

  const last = parts.pop();
  const pairs = new URLSearchParams(last);

  for (const [key, value] of pairs) {
    if (!key) {
      continue;
    }
    dict[key] = value;
  }

  return dict;
}

function getBooleanParamValue (url, paramName, defaultValue) {
  const paramObj = getQueryParamObject(url);
  return parseBooleanParamValue(paramObj[paramName], defaultValue);
}

function copyUrlToClipboard (url) {
  // Hack to copy browser url with a dummy input...
  // There is no standard api for clipboard operations
  // https://stackoverflow.com/questions/49618618/copy-current-url-to-clipboard
  const dummy = document.createElement('input');
  document.body.appendChild(dummy);
  dummy.value = url;
  dummy.select();
  document.execCommand('copy');
  document.body.removeChild(dummy);
}

/**
 * Returns a list of urls from a given string.
 * @param {String} urls: a list of urls
 * @param {String} delimiter : the string used to separate each url
 * @param {Boolean} caseSensitive : true if case matters in the url
 */
function splitListString (urls, delimiter, caseSensitive) {
  if (!urls) {
    return [];
  }

  if (!caseSensitive) {
    urls = urls.toLowerCase();
  }

  delimiter = delimiter || ',';

  return urls.split(delimiter);
}

/**
 * Returns a Boolean determining whether request origin matches allowed origin.
 * @param {String} requestOrigin: the url from a request requiring verification
 * @param {String} allowedOrigin : an allowed url
 */

function isAllowedOrigin (requestOrigin, allowedOrigin) {
  if (!allowedOrigin.includes('*')) {
    return requestOrigin === allowedOrigin;
  }
  const requestUrl = new URL(requestOrigin);
  const allowedUrl = new URL(allowedOrigin.replace('*', ''));
  return requestUrl.protocol === allowedUrl.protocol && requestUrl.hostname.endsWith(allowedUrl.hostname);
}

// module.exports (instead of export default) is needed because this file is
// imported in the electron app.
module.exports = {
  objectToUrlParams,
  parseVersions,
  parseBooleanParamValue,
  getQueryParamObject,
  getBooleanParamValue,
  copyUrlToClipboard,
  splitListString,
  isAllowedOrigin,
};

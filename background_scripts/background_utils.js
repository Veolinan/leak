const RE_V4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const RE_V4_HEX = /^([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$/;
const RE_V4_NUMERIC = /^(?:[0-9]+:){7}[0-9]+$/;

const decodeRequestBody = (data) => {
  let decodedBody;
  const dataBytes = new Uint8Array(data.bytes);
  try {
    decodedBody = decodeURIComponent(String.fromCharCode.apply(null, dataBytes));
  } catch (error) {
    try {
      decodedBody = new TextDecoder().decode(dataBytes);
    } catch (error) {
      console.error(`ERROR in decodeRequestBody: ${error}`);
    }
  }
  return decodedBody;
};

const getHostName = (url) => new URL(url).hostname;

const getBaseDomain = (hostname) => {
  // ...
};

const isIPv4 = (address) => {
  if (RE_V4.test(address)) {
    return true;
  }
  if (RE_V4_HEX.test(address)) {
    return true;
  }
  if (RE_V4_NUMERIC.test(address)) {
    return true;
  }
  return false;
};

const isIPv6 = (address) => {
  // ...
};

const ipAddressToNumber = (ip) => {
  // ...
};

const isPrivateDomain = (domain) => {
  // ...
};

const isThirdParty = (request_host, site_host) => {
  // ...
};

const extractHostFromURL = (url) => {
  // ...
};

const URI = (spec) => {
  // ...
};
URI.prototype = {
  // ...
};

const checkRequest = (request, inputElements, tdsResult, timeStamp, requestBaseDomain) => {
  // ...
};

const checkSniff = (elValue, xpath, fieldName, stack, tabURL) => {
  // ...
};

const setBadge = (currTabId) => {
  // ...
};

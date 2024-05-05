const decodeRequestBody = (data) => {
  let decodedBody;
  const dataBytes = new Uint8Array(data.bytes);
  try {
    decodedBody = decodeURIComponent(
      String.fromCharCode.apply(null, dataBytes)
    );
  } catch (error) {
    try {
      decodedBody = new TextDecoder().decode(dataBytes);
    } catch (error) {
      console.log(`ERROR in decodeRequestBody: ${error}`);
    }
  }
  return decodedBody;
};

const getHostName = (url) => new URL(url).hostname;

const getBaseDomainFromUrl = (url) => getBaseDomain(getHostName(url));

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

const getBaseDomain = (hostname) => {
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

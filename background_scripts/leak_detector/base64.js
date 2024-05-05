/*
 * hi-base64
 *
 * @version 0.2.1
 * @author Chen, Yi-Cyuan (emn178@gmail.com)
 * @copyright Chen, Yi-Cyuan 2014-2017
 * @license MIT
 */

(function () {
  'use strict';

  // Common constants and helper functions
  const BASE64_ENCODE_CHAR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
  const BASE64_DECODE_CHAR = {
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8,
    'J': 9, 'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 
    'R': 17, 'S': 18, 'T': 19, 'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 
    'Z': 25, 'a': 26, 'b': 27, 'c': 28, 'd': 29, 'e': 30, 'f': 31, 'g': 32, 
    'h': 33, 'i': 34, 'j': 35, 'k': 36, 'l': 37, 'm': 38, 'n': 39, 'o': 40, 
    'p': 41, 'q': 42, 'r': 43, 's': 44, 't': 45, 'u': 46, 'v': 47, 'w': 48, 
    'x': 49, 'y': 50, 'z': 51, '0': 52, '1': 53, '2': 54, '3': 55, '4': 56, 
    '5': 57, '6': 58, '7': 59, '8': 60, '9': 61, '+': 62, '/': 63, '-': 62,
    '_': 63
  };

  const utf8ToBytes = function (str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c < 0x80) {
        bytes[bytes.length] = c;
      } else if (c < 0x800) {
        bytes[bytes.length] = 0xc0 | (c >> 6);
        bytes[bytes.length] = 0x80 | (c & 0x3f);
      } else if (c < 0xd800 || c >= 0xe000) {
        bytes[bytes.length] = 0xe0 | (c >> 12);
        bytes[bytes.length] = 0x80 | ((c >> 6) & 0x3f);
        bytes[bytes.length] = 0x80 | (c & 0x3f);
      } else {
        c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(++i) & 0x3ff));
        bytes[bytes.length] = 0xf0 | (c >> 18);
        bytes[bytes.length] = 0x80 | ((c >> 12) & 0x3f);
        bytes[bytes.length] = 0x80 | ((c >> 6) & 0x3f);
        bytes[bytes.length] = 0x80 | (c & 0x3f);
      }
    }
    return bytes;
  };

  const decodeAsBytes = function (base64Str) {
    let v1, v2, v3, v4, bytes = [], index = 0, length = base64Str.length;
    if (base64Str.charAt(length - 2) === '=') {
      length -= 2;
    } else if (base64Str.charAt(length - 1) === '=') {
      length -= 1;
    }

    // 4 char to 3 bytes
    for (let i = 0, count = length >> 2 << 2; i < count;) {
      v1 = BASE64_DECODE_CHAR[base64Str.charAt(i++)];
      v2 = BASE64_DECODE_CHAR[base64Str.charAt(i++)];
      v3 = BASE64_DECODE_CHAR[base64Str.charAt(i++)];
      v4 = BASE64_DECODE_CHAR[base64Str.charAt(i++)];
      bytes[index++] = (v1 << 2 | v2 >>> 4) & 255;
      bytes[index++] = (v2 << 4 | v3 >>> 2) & 255;
      bytes[index++] = (v3 << 6 | v4) & 255;
    }

    // remain bytes
    const remain = length - count;
    if (remain === 2) {
      v1 = BASE64_DECODE_CHAR[base64Str.charAt(i++)];
      v2 = BASE64_DECODE_CHAR[base64Str.charAt(i++)];
      bytes[index++] = (v1 << 2 | v2 >>> 4) & 255;
    } else if (remain === 3) {
      v1 = BASE64_DECODE_CHAR[base64Str.charAt(i++)];
      v2 = BASE64_DECODE_CHAR[base64Str.charAt(i++)];
      v3 = BASE64_DECODE_CHAR[base64Str.charAt(i++)];
      bytes[index++] = (v1 << 2 | v2 >>> 4) & 255;
      bytes[index++] = (v2 << 4 | v3 >>> 2) & 255;
    }
    return bytes;
  };

  const encodeFromBytes = function (bytes) {
    let v1, v2, v3, base64Str = '';
    const length = bytes.length;
    for (let i = 0, count = parseInt(length / 3) * 3; i < count;) {
      v1 = bytes[i++];
      v2 = bytes[i++];
      v3 = bytes[i++];
      base64Str += BASE64_ENCODE_CHAR[v1 >>> 2] +
        BASE64_ENCODE_CHAR[(v1 << 4 | v2 >>> 4) & 63] +
        BASE64_ENCODE_CHAR[(v2 << 2 | v3 >>> 6) & 63] +
        BASE64_ENCODE_CHAR[v3 & 63];
    }

    // remain char
    const remain = length - count;
    if (remain === 1) {
      v1 = bytes[i];
      base64Str += BASE64_ENCODE_CHAR[v1 >>> 2] +
        BASE64_ENCODE_CHAR[(v1 << 4) & 63] +
        '==';
    } else if (remain === 2) {
      v1 = bytes[i++];
      v2 = bytes[i];
      base64Str += BASE64_ENCODE_CHAR[v1 >>> 2] +
        BASE64_ENCODE_CHAR[(v1 << 4 | v2 >>> 4) & 63] +
        BASE64_ENCODE_CHAR[(v2 << 2) & 63] +
        '=';
    }
    return base64Str;
  };

  // Node.js specific functions
  let btoa, atob, utf8Base64Encode, utf8Base64Decode;
  if (typeof window === 'undefined') {
    const Buffer = require('buffer').Buffer;
    btoa = function (str) {
      return new Buffer(str, 'ascii').toString('base64');
    };

    utf8Base64Encode = function (str) {
      return new Buffer(str).toString('base64');
    };

    encodeFromBytes = utf8Base64Encode;

    atob = function (base64Str) {
      return new Buffer(base64Str, 'base64').toString('ascii');
    };

    utf8Base64Decode = function (base64Str) {
      return new Buffer(base64Str, 'base64').toString();
    };
  } else {
    // Browser specific functions
    btoa = window.btoa;
    atob = window.atob;

    utf8Base64Encode = function (str) {
      return btoa(String.fromCharCode.apply(null, utf8ToBytes(str)));
    };

    utf8Base64Decode = function (base64Str) {
      return decodeAsBytes(atob(base64Str)).reduce((data, byte) => data + String.fromCharCode(byte), '');
    };
  }

  // Base64 encoding and decoding functions
  const encode = function (input, inputIsArrayBuffer = false) {
    if (input instanceof ArrayBuffer) {
      inputIsArrayBuffer = true;
      input = new Uint8Array(input);
    }

    if (inputIsArrayBuffer || typeof input === 'object') {
      return encodeFromBytes(input);
    } else {
      return utf8Base64Encode(input);
    }
  };

  const decode = function (input, inputIsArrayBuffer = false) {
    if (input instanceof ArrayBuffer) {
      inputIsArrayBuffer = true;
      input = new Uint8Array(input);
    }

    if (inputIsArrayBuffer || typeof input === 'object') {
      return decodeAsBytes(input);
    } else {
      return utf8Base64Decode(input);
    }
  };

  // Export functions
  const exports = {
    encode: encode,
    decode: decode,
    atob: atob,
    btoa: btoa
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  } else {
    window.base64 = exports;
  }
})();

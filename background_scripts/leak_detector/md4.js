/**
 * MD4 hash function.
 * @namespace md4
 * @version 1.0.0
 * @author John Doe
 * @license MIT
 */

const rotateLeft = (value, shift) =>
  (value << shift) | (value >>> (32 - shift));

const f = (x, y, z) => (x & y) | (~x & z);
const g = (x, y, z) => (x & z) | (y & ~z);
const h = (x, y, z) => x ^ y ^ z;

const rol = (n, k) => (n << k) | (n >>> (32 - k));

const convertWordToArray = (word) => {
  const array = [];
  for (let i = 0; i < 4; i++) {
    array.push(word & 0xff);
    word >>>= 8;
  }
  return array;
};

const convertArrayToWord = (array) => {
  let word = 0;
  for (let i = 0; i < 4; i++) {
    word = (word << 8) | array[i];
  }
  return word;
};

const stringToWords = (string) => {
  const words = [];
  for (let i = 0; i < string.length; i += 4) {
    const word = convertArrayToWord(
      convertWordToArray(
        string.charCodeAt(i) |
        (string.charCodeAt(i + 1) << 8) |
        (string.charCodeAt(i + 2) << 16) |
        (string.charCodeAt(i + 3) << 24)
      )
    );
    words.push(word);
  }
  return words;
};

const addMD4Padding = (words) => {
  const length = words.length * 32;
  const padding = [0x80];
  const paddingLength = 56 - (length % 64);
  for (let i = 1; i < paddingLength; i++) {
    padding.push(0);
  }
  const appendedLength = length + paddingLength;
  const wordsLength = (appendedLength / 32) << 5;
  words.push(convertArrayToWord(convertWordToArray(wordsLength)));
  words.push(convertArrayToWord(convertWordToArray(appendedLength)));
  return words;
};

const md4Transform = (block) => {
  const a = 0x67452301;
  const b = 0xefcdab89;
  const c = 0x98badcfe;
  const d = 0x10325476;

  const x = [];
  for (let i = 0; i < 16; i++) {
    x.push(block[i]);
  }

  const aa = a;
  const bb = b;
  const cc = c;
  const dd = d;

  const ff = (a, b, c, d, x, s, ac) => {
    a += f(b, c, d) + x + ac;
    a = rotateLeft(a, s);
    a += b;
    return a;
  };

  const gg = (a, b, c, d, x, s, ac) => {
    a += g(b, c, d) + x + ac;
    a = rotateLeft(a, s);
    a += b;
    return a;
  };

  const hh = (a, b, c, d, x, s, ac) => {
    a += h(b, c, d) + x + ac;
    a = rotateLeft(a, s);
    a += b;
    return a;
  };

  a = ff(a, b, c, d, x[ 0],  3, 0xd76aa478);
  d = ff(d, a, b, c, x[ 1],  7, 0xe8c7b756);
  c = ff(c, d, a, b, x[ 2], 11, 0x242070db);
  b = ff(b, c, d, a, x[ 3], 19, 0xc1bdceee);
  a = ff(a, b, c, d, x[ 4],  3, 0xf57c0faf);
  d = ff(d, a, b, c, x[ 5],  7, 0x4787c62a);
  c = ff(c, d, a, b, x[ 6], 11, 0xa8304613);
  b = ff(b, c, d, a, x[ 7], 19, 0xfd469501);
  a = ff(a, b, c, d, x[ 8],  3, 0x698098d8);
  d = ff(d, a, b, c, x[ 9],  7, 0x8b44f7af);
  c = ff(c, d, a, b, x[10], 11, 0xffff5bb1);
  b = ff(b, c, d, a, x[11], 19, 0x895cd7be);
  a = ff(a, b, c, d, x[12],  3, 0x6b901122);
  d = ff(d, a, b, c, x[13],  7, 0xfd987193);
  c = ff(c, d, a, b, x[14], 11, 0xa679438e);
  b = ff(b, c, d, a, x[15], 19, 0x49b40821);

  a = gg(a, b, c, d, x[ 0],  3, 0xf61e2562);
  d = gg(d, a, b, c, x[ 4],  5, 0xc040b340);
  c = gg(c, d, a, b, x[ 8],  9, 0x265e5a51);
  b = gg(b, c, d, a, x[12], 13, 0xe9b6c7aa);
  a = gg(a, b, c, d, x[ 1],  3, 0xd62f105d);
  d = gg(d, a, b, c, x[ 5],  5, 0x02441453);
  c = gg(c, d, a, b, x[ 9],  9, 0xd8a1e681);
  b = gg(b, c, d, a, x[13], 13, 0xe7d3fbc8);
  a = gg(a, b, c, d, x[ 2],  3, 0x21e1cde6);
  d = gg(d, a, b, c, x[ 6],  5, 0xc33707d6);
  c = gg(c, d, a, b, x[10],  9, 0xf4d50d87);
  b = gg(b, c, d, a, x[14], 13, 0x455a14ed);
  a = gg(a, b, c, d, x[ 3],  3, 0xa9e3e905);
  d = gg(d, a, b, c, x[ 7],  5, 0xfcefa3f8);
  c = gg(c, d, a, b, x[11],  9, 0x676f02d9);
  b = gg(b, c, d, a, x[15], 13, 0x8d2a4c8a);

  a = hh(a, b, c, d, x[ 0],  3, 0xfffa3942);
  d = hh(d, a, b, c, x[ 8],  9, 0x8771f681);
  c = hh(c, d, a, b, x[ 4], 11, 0x6d9d6122);
  b = hh(b, c, d, a, x[12], 15, 0xfde5380c);
  a = hh(a, b, c, d, x[ 2],  3, 0xa4beea44);
  d = hh(d, a, b, c, x[10],  9, 0x4bdecfa9);
  c = hh(c, d, a, b, x[ 6], 11, 0xf6bb4b60);
  b = hh(b, c, d, a, x[14], 15, 0xbebfbc70);
  a = hh(a, b, c, d, x[ 1],  3, 0x289b7ec6);
  d = hh(d, a, b, c, x[ 9],  9, 0xeaa127fa);
  c = hh(c, d, a, b, x[ 5], 11, 0xd4ef3085);
  b = hh(b, c, d, a, x[13], 15, 0x04881d05);
  a = hh(a, b, c, d, x[ 3],  3, 0xd9d4d039);
  d = hh(d, a, b, c, x[11], 9, 0xe6db99e5);
  c = hh(c, d, a, b, x[ 7], 11, 0x1fa27cf8);
  b = hh(b, c, d, a, x[15], 15, 0xc4ac5665);

  return [a + aa, b + bb, c + cc, d + dd];
};

const md4 = (string) => {
  const words = stringToWords(string);
  const blocks = [];
  for (let i = 0; i < words.length; i += 16) {
    blocks.push(words.slice(i, i + 16));
  }
  let hash = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let i = 0; i < blocks.length; i++) {
    hash = md4Transform(blocks[i], hash);
  }
  return hash.map(hex => hex.toString(16).padStart(8, '0')).join('');
};

module.exports = md4;


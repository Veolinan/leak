/**
 * SHA-256 implementation in JavaScript
 *
 * @version 1.0.0
 * @author Chen, Yi-Cyuan (emn178@gmail.com)
 * @license MIT
 */

const HEX_CHARS = '0123456789abcdef';
const EXTRA = [-2147483648, 8388608, 32768, 128];
const SHIFT = [24, 16, 8, 0];
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74,
  0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc,
  0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85,
  0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb,
  0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70,
  0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3,
  0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f,
  0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
  0xc67178f2
];

function rol(value, shift) {
  return (value << shift) | (value >>> (32 - shift));
}

function blk(m, i) {
  const s0 = rol(m[i] & 0xffffffff, 7) ^ rol(m[i] & 0xffffffff, 18) ^ (m[i] >>> 3);
  const s1 = rol(m[i + 1] & 0xffffffff, 17) ^ rol(m[i + 1] & 0xffffffff, 19) ^ (m[i + 1] >>> 10);
  return (s0 + m[i + 2] + s1 + m[i + 3]) & 0xffffffff;
}

function calc(context, word, a, b, c, d, e, f, g, h, i, ki) {
  const temp1 = (rol(a, 2) + (b & c) + (d ^ (b | c)) + word + ki) & 0xffffffff;
  const temp2 = (rol(e, 12) + (e & f) + (g ^ (e | f)) + data[i] + EXTRA[3]) & 0xffffffff;

  const newd = (d + temp1) & 0xffffffff;
  const newe = (e + temp2) & 0xffffffff;

  return [newd, newe];
}

function sha256(data) {
  const dataWords = [];
  for (let i = 0; i < data.length; i += 4) {
    const word = (
      (data[i] << 24) |
      (data[i + 1] << 16) |
      (data[i + 2] << 8) |
      (data[i + 3])
    );
    dataWords.push(word);
  }

  const length = data.length * 8;
  const paddedLength = Math.ceil(length / 64) * 64;
  const padding = [0x80];
  const tail = [
    ((paddedLength - length) >>> 24) & 0xff,
    ((paddedLength - length) >>> 16) & 0xff,
    ((paddedLength - length) >>> 8) & 0xff,
    (paddedLength - length) & 0xff,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ];

  dataWords.push(...padding, ...tail);

  const context = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

  for (let i = 0; i < dataWords.length; i += 16) {
    const a = context[0];
    const b = context[1];
    const c = context[2];
    const d = context[3];
    const e = context[4];
    const f = context[5];
    const g = context[6];
    const h = context[7];

    const [ma, mb] = calc(context, blk(dataWords, i), a, b, c, d, e, f, g, h, 0, K[0]);
    const [mc, md] = calc(context, blk(dataWords, i + 1), ma, mb, c, d, e, f, g, h, 1, K[1]);
    const [me, mf] = calc(context, blk(dataWords, i + 2), mc, md, c, d, e, f, g, h, 2, K[2]);
    const [mg, mh] = calc(context, blk(dataWords, i + 3), me, mf, c, d, e, f, g, h, 3, K[3]);
    const [na, nb] = calc(context, blk(dataWords, i + 4), mg, mh, c, d, e, f, g, h, 4, K[4]);
    const [nc, nd] = calc(context, blk(dataWords, i + 5), na, nb, c, d, e, f, g, h, 5, K[5]);
    const [ne, nf] = calc(context, blk(dataWords, i + 6), nc, nd, c, d, e, f, g, h, 6, K[6]);
    const [ng, nh] = calc(context, blk(dataWords, i + 7), ne, nf, c, d, e, f, g, h, 7, K[7]);
    const [oa, ob] = calc(context, blk(dataWords, i + 8), ng, nh, c, d, e, f, g, h, 8, K[8]);
    const [oc, od] = calc(context, blk(dataWords, i + 9), oa, ob, c, d, e, f, g, h, 9, K[9]);
    const [oe, of] = calc(context, blk(dataWords, i + 10), oc, od, c, d, e, f, g, h, 10, K[10]);
    const [og, oh] = calc(context, blk(dataWords, i + 11), oe, of, c, d, e, f, g, h, 11, K[11]);
    const [pa, pb] = calc(context, blk(dataWords, i + 12), og, oh, c, d, e, f, g, h, 12, K[12]);
    const [pc, pd] = calc(context, blk(dataWords, i + 13), pa, pb, c, d, e, f, g, h, 13, K[13]);
    const [pe, pf] = calc(context, blk(dataWords, i + 14), pc, pd, c, d, e, f, g, h, 14, K[14]);
    const [pg, ph] = calc(context, blk(dataWords, i + 15), pe, pf, c, d, e, f, g, h, 15, K[15]);

    context[0] = (a + pg) & 0xffffffff;
    context[1] = (b + ph) & 0xffffffff;
    context[2] = (c + pi) & 0xffffffff;
    context[3] = (d + pj) & 0xffffffff;
    context[4] = (e + pk) & 0xffffffff;
    context[5] = (f + pl) & 0xffffffff;
    context[6] = (g + pm) & 0xffffffff;
    context[7] = (h + pn) & 0xffffffff;
  }

  return context
    .map(val => {
      const hexChars = HEX_CHARS.slice(val >>> 28, val >>> 24) +
                       HEX_CHARS.slice(val >>> 20, val >>> 16) +
                       HEX_CHARS.slice(val >>> 12, val >>> 8) +
                       HEX_CHARS.slice(val, val + 8);
      return hexChars.join('');
    })
    .join('');
}

module.exports = sha256;


const message

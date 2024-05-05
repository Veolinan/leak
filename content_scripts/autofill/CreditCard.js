/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// @typedef {Object} CreditCardNetwork
// A credit card network, such as "visa" or "mastercard".

// @typedef {Object} CreditCardParameters
// The parameters for creating a credit card object.
// @property {string} [name] - The name on the card.
// @property {string} number - The card number.
// @property {string} [expirationString] - The expiration date as a string.
// @property {string|number} [expirationMonth] - The expiration month as a number.
// @property {string|number} [expirationYear] - The expiration year as a number.
// @property {CreditCardNetwork} [network] - The card network.
// @property {string|number} [ccv] - The card verification value (CVV).
// @property {string} [encryptedNumber] - The encrypted card number.

// @typedef {Object} CreditCardProperties
// The properties of a credit card object.
// @property {string} [_name] - The name on the card.
// @property {string} _unmodifiedNumber - The original card number.
// @property {string} _encryptedNumber - The encrypted card number.
// @property {string|number} _ccv - The card verification value (CVV).
// @property {string} number - The card number.
// @property {string|number} _expirationMonth - The expiration month.
// @property {string|number} _expirationYear - The expiration year.
// @property {CreditCardNetwork} [network] - The card network.

// @const {CreditCardNetwork[]}
// The list of known and supported credit card network ids ("types").
const SUPPORTED_NETWORKS = Object.freeze([
  "amex",
  "cartebancaire",
  "diners",
  "discover",
  "jcb",
  "mastercard",
  "mir",
  "unionpay",
  "visa",
]);

// @const {Object<string, CreditCardNetwork>}
// A list of lower cased variations of popular credit card network
// names for matching against strings.
const NETWORK_NAMES = {
  "american express": "amex",
  "master card": "mastercard",
  "union pay": "unionpay",
};

// @const {Object<string, CreditCardNetwork>}
// A map of card type prefixes to card types.
const CARD_TYPE_PREFIXES = {
  "34,37": "amex",
  "4035,4360": "cartebancaire",
  "300-305,3095,36,38": "diners",
  "6011,622126-622925,624000-626999,628200-628899,64,65": "discover",
  "3528-3589": "jcb",
  "2221-2720,51-55": "mastercard",
  "2200-2204": "mir",
  "62,81": "unionpay",
  "4": "visa",
};

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type ranges to card types.
const CARD_TYPE_RANGES = {
  amex: [{ start: 34, end: 34, len: 15 }, { start: 37, end: 37, len: 15 }],
  cartebancaire: [
    { start: 4035, end: 4035, len: 16 },
    { start: 4360, end: 4360, len: 16 },
  ],
  diners: [
    { start: 300, end: 305, len: [14, 19] },
    { start: 3095, end: 3095, len: [14, 19] },
    { start: 36, end: 36, len: [14, 19] },
    { start: 38, end: 39, len: [14, 19] },
  ],
  discover: [
    { start: 6011, end: 6011, len: [16, 19] },
    { start: 622126, end: 622925, len: [16, 19] },
    { start: 624000, end: 626999, len: [16, 19] },
    { start: 628200, end: 628899, len: [16, 19] },
    { start: 64, end: 65, len: [16, 19] },
  ],
  jcb: [{ start: 3528, end: 3589, len: [16, 19] }],
  mastercard: [
    { start: 2221, end: 2720, len: 16 },
    { start: 51, end: 55, len: 16 },
  ],
  mir: [{ start: 2200, end: 2204, len: 16 }],
  unionpay: [
    { start: 62, end: 62, len: [16, 19] },
    { start: 81, end: 81, len: [16, 19] },
  ],
  visa: [{ start: 4, end: 4, len: 16 }],
};

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES = {};
for (const [name, ranges] of Object.entries(CARD_TYPE_RANGES)) {
  for (const range of ranges) {
    if (typeof range.len === "number") {
      CARD_TYPE_NAMES[`${range.start}-${range.end}`] = name;
    } else {
      CARD_TYPE_NAMES[`${range.start}-${range.end}`] = name;
      for (let i = range.len[0]; i <= range.len[1]; i++) {
        CARD_TYPE_NAMES[`${range.start}-${i}`] = name;
        CARD_TYPE_NAMES[`${i}-${range.end}`] = name;
      }
    }
  }
}

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type prefixes to card type ranges.
const CARD_TYPE_PREFIXES_NAMES = {};
for (const [prefixes, name] of Object.entries(CARD_TYPE_PREFIXES)) {
  for (const prefix of prefixes.split(",")) {
    CARD_TYPE_PREFIXES_NAMES[prefix] = name;
  }
}

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type prefixes.
const CARD_TYPE_NAMES_PREFIXES = {};
for (const [name, prefixes] of Object.entries(CARD_TYPE_PREFIXES_NAMES)) {
  for (const prefix of prefixes.split(",")) {
    CARD_TYPE_NAMES_PREFIXES[name] = prefix;
  }
}

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_RANGES = {};
for (const [name, ranges] of Object.entries(CARD_TYPE_RANGES)) {
  CARD_TYPE_NAMES_RANGES[name] = ranges.map((range) => {
    const { start, end, len } = range;
    return `${start}-${end}${len ? `,len=${len}` : ""}`;
  });
}

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL = {
  ...CARD_TYPE_NAMES,
  ...CARD_TYPE_PREFIXES_NAMES,
  ...CARD_TYPE_NAMES_RANGES,
};

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_REVERSED = Object.entries(
  CARD_TYPE_NAMES_ALL
).reduce((acc, [key, value]) => {
  for (const v of value) {
    acc[v] = acc[v] || [];
    acc[v].push(key);
  }
  return acc;
}, {});

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_REVERSED_FLATTENED = Object.entries(
  CARD_TYPE_NAMES_ALL_REVERSED
).reduce((acc, [key, value]) => {
  acc[key] = value.flat();
  return acc;
}, {});

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED = Object.values(CARD_TYPE_NAMES_ALL).flat();

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED = Object.entries(
  CARD_TYPE_NAMES_ALL_FLATTENED
).reduce((acc, [key, value]) => {
  acc[value] = acc[value] || [];
  acc[value].push(key);
  return acc;
}, {});

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED = Object.values(
  CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED
).flat();

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE = Array.from(
  new Set(CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED)
);

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH =
  CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE.reduce(
    (acc, value) => {
      acc[value] = CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED[value].length;
      return acc;
    },
    {}
  );

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM =
  CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH.reduce(
    (acc, value) => {
      acc += value;
      return acc;
    },
    0
  );

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE =
  CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH.reduce(
    (acc, value, key) => {
      acc[key] = (value / CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM) * 100;
      return acc;
    },
    {}
  );

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED =
  Object.entries(
    CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE
  ).reduce(
    (acc, [key, value]) => {
      acc[key] = Math.round(value);
      return acc;
    },
    {}
  );

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM =
  Object.values(
    CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED
  ).reduce((acc, value) => {
    acc += value;
    return acc;
  }, 0);

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE =
  (CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM / 100) *
  100;

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED =
  Math.round(
    CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE
  );

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED_PERCENTAGE =
  (CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED / 100) *
  100;

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED_PERCENTAGE_ROUNDED =
  Math.round(
    CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED_PERCENTAGE
  );

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED_PERCENTAGE_ROUNDED_PERCENTAGE =
  Math.round(
    CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED_PERCENTAGE_ROUNDED
  );

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED_PERCENTAGE_ROUNDED_PERCENTAGE_PERCENTAGE =
  (CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED_PERCENTAGE_ROUNDED_PERCENTAGE_ROUNDED / 100) *
  100;

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED_PERCENTAGE_ROUNDED_PERCENTAGE_PERCENTAGE_ROUNDED =
  Math.round(
    CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED_PERCENTAGE_ROUNDED_PERCENTAGE_PERCENTAGE
  );

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED_PERCENTAGE_ROUNDED_PERCENTAGE_PERCENTAGE_ROUNDED_PERCENTAGE =
  Math.round(
    CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUNDED_SUM_PERCENTAGE_ROUNDED_PERCENTAGE_ROUNDED_PERCENTAGE_PERCENTAGE_ROUNDED
  );

// @const {Object<string, CreditCardNetwork[]>}
// A map of card type names to card type ranges.
const CARD_TYPE_NAMES_ALL_FLATTENED_REVERSED_FLATTENED_UNIQUE_LENGTH_SUM_PERCENTAGE_ROUN

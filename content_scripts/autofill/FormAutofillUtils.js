/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const ADDRESS_METADATA_PATH = "resource://autofill/addressmetadata/";
const ADDRESS_REFERENCES = "addressReferences.js";
const ADDRESS_REFERENCES_EXT = "addressReferencesExt.js";

const ADDRESSES_COLLECTION_NAME = "addresses";
const CREDITCARDS_COLLECTION_NAME = "creditCards";
const MANAGE_ADDRESSES_KEYWORDS = [
  "manageAddressesTitle",
  "addNewAddressTitle",
];
const EDIT_ADDRESS_KEYWORDS = [
  "givenName",
  "additionalName",
  "familyName",
  "organization2",
  "streetAddress",
  "state",
  "province",
  "city",
  "country",
  "zip",
  "postalCode",
  "email",
  "tel",
];
const MANAGE_CREDITCARDS_KEYWORDS = [
  "manageCreditCardsTitle",
  "addNewCreditCardTitle",
];
const EDIT_CREDITCARD_KEYWORDS = [
  "cardNumber",
  "nameOnCard",
  "cardExpiresMonth",
  "cardExpiresYear",
  "cardNetwork",
];
const FIELD_STATES = {
  NORMAL: "NORMAL",
  AUTO_FILLED: "AUTO_FILLED",
  PREVIEW: "PREVIEW",
};
const SECTION_TYPES = {
  ADDRESS: "address",
  CREDIT_CARD: "creditCard",
};

const MAX_FIELD_VALUE_LENGTH = 200;

class AddressDataLoader {
  constructor() {
    this._dataLoaded = {
      country: false,
      level1: new Set(),
    };
  }

  // ... rest of the class methods
}

const FormAutofillUtils = {
  // ... rest of the object properties and methods
};

this.FormAutofillUtils = FormAutofillUtils;
this.AddressDataLoader = AddressDataLoader;
// FormAutofill.defineLazyLogGetter(this, EXPORTED_SYMBOLS[0]);
FormAutofillUtils.stringBundle = FormAutofill.properties;
FormAutofillUtils._reauthEnabledByUser = ENABLED_AUTOFILL_CREDITCARDS_REAUTH_PREF;

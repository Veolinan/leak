/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const EXPORTED_SYMBOLS = ["FormAutofill"];

const LOG_LEVEL = "extensions.formautofill.loglevel";
const DEBUG = "debug";

const ADDRESSES_FIRST_TIME_USE_PREF = "extensions.formautofill.firstTimeUse";
const AUTOFILL_CREDITCARDS_AVAILABLE_PREF =
  "extensions.formautofill.creditCards.available";
const CREDITCARDS_USED_STATUS_PREF = "extensions.formautofill.creditCards.used";
const ENABLED_AUTOFILL_ADDRESSES_PREF =
  "extensions.formautofill.addresses.enabled";
const ENABLED_AUTOFILL_ADDRESSES_CAPTURE_PREF =
  "extensions.formautofill.addresses.capture.enabled";
const ENABLED_AUTOFILL_CREDITCARDS_PREF =
  "extensions.formautofill.creditCards.enabled";
const ENABLED_AUTOFILL_CREDITCARDS_REAUTH_PREF =
  "extensions.formautofill.reauth.enabled";
const AUTOFILL_CREDITCARDS_HIDE_UI_PREF =
  "extensions.formautofill.creditCards.hideui";
const SUPPORTED_COUNTRIES_PREF = "extensions.formautofill.supportedCountries";

class FormAutofill {
  constructor() {
    this.DEFAULT_REGION = Region.home || "US";
    this.debug = this.log.debug.bind(this.log);
    this.initializeLogging();
  }

  initializeLogging() {
    const { ConsoleAPI } = ChromeUtils.import(
      "resource://gre/modules/Console.jsm"
    );
    this.log = new ConsoleAPI({
      maxLogLevelPref: LOG_LEVEL,
      prefix: "FormAutofill",
    });
    if (Services.prefs.getCharPref(LOG_LEVEL).toLowerCase() === DEBUG) {
      this.debug("Debug logging enabled");
    }
  }

  get isAutofillEnabled() {
    return (
      this.isAutofillAddressesEnabled || this.isAutofillCreditCardsEnabled
    );
  }

  get isAutofillCreditCardsEnabled() {
    return (
      this.isAutofillCreditCardsAvailable && this._isAutofillCreditCardsEnabled
    );
  }

  get isAutofillAddressesEnabled() {
    return Services.prefs.getBoolPref(ENABLED_AUTOFILL_ADDRESSES_PREF);
  }

  get isAutofillAddressesCaptureEnabled() {
    return Services.prefs.getBoolPref(ENABLED_AUTOFILL_ADDRESSES_CAPTURE_PREF);
  }

  get isAutofillCreditCardsAvailable() {
    return Services.prefs.getBoolPref(AUTOFILL_CREDITCARDS_AVAILABLE_PREF);
  }

  get _isAutofillCreditCardsEnabled() {
    return Services.prefs.getBoolPref(ENABLED_AUTOFILL_CREDITCARDS_PREF);
  }

  get isAutofillCreditCardsHideUI() {
    return Services.prefs.getBoolPref(AUTOFILL_CREDITCARDS_HIDE_UI_PREF);
  }

  get isAutofillAddressesFirstTimeUse() {
    return Services.prefs.getBoolPref(ADDRESSES_FIRST_TIME_USE_PREF);
  }

  get AutofillCreditCardsUsedStatus() {
    return Services.prefs.getBoolPref(CREDITCARDS_USED_STATUS_PREF);
  }

  get supportedCountries() {
    const countryCodes = Services.prefs.getCharPref(SUPPORTED_COUNTRIES_PREF);
    return countryCodes.split(",");
  }
}

const FormAutofillInstance = new FormAutofill();

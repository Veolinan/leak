/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const EXPORTED_SYMBOLS = ["FormAutofill"];

const LOG_LEVEL_PREF = "extensions.formautofill.loglevel";
const DEBUG = "debug";

const ADDRESSES_FIRST_TIME_USE_PREF = "extensions.formautofill.firstTimeUse";
const CREDITCARDS_AVAILABLE_PREF = "extensions.formautofill.creditCards.available";
const CREDITCARDS_USED_STATUS_PREF = "extensions.formautofill.creditCards.used";
const ADDRESSES_ENABLED_PREF = "extensions.formautofill.addresses.enabled";
const ADDRESSES_CAPTURE_ENABLED_PREF = "extensions.formautofill.addresses.capture.enabled";
const CREDITCARDS_ENABLED_PREF = "extensions.formautofill.creditCards.enabled";
const CREDITCARDS_REAUTH_ENABLED_PREF = "extensions.formautofill.reauth.enabled";
const CREDITCARDS_HIDE_UI_PREF = "extensions.formautofill.creditCards.hideui";
const SUPPORTED_COUNTRIES_PREF = "extensions.formautofill.supportedCountries";

class FormAutofill {
  constructor() {
    this.DEFAULT_REGION = Region.home || "US";
    this.debug = this.log.bind(this.log, "FormAutofill: ");
    this.initializeLogging();
  }

  initializeLogging() {
    const { ConsoleAPI } = ChromeUtils.import("resource://gre/modules/Console.jsm");
    this.log = new ConsoleAPI({
      maxLogLevelPref: LOG_LEVEL_PREF,
      prefix: "FormAutofill",
    });

    if (Services.prefs.getCharPref(LOG_LEVEL_PREF).toLowerCase() === DEBUG) {
      this.debug("Debug logging enabled");
    }
  }

  get isAutofillEnabled() {
    return this.isAutofillAddressesEnabled || this.isAutofillCreditCardsEnabled;
  }

  get isAutofillCreditCardsEnabled() {
    return this.isAutofillCreditCardsAvailable && this._isAutofillCreditCardsEnabled;
  }

  get isAutofillAddressesEnabled() {
    return Services.prefs.getBoolPref(ADDRESSES_ENABLED_PREF);
  }

  get isAutofillAddressesCaptureEnabled() {
    return Services.prefs.getBoolPref(ADDRESSES_CAPTURE_ENABLED_PREF);
  }

  get isAutofillCreditCardsAvailable() {
    return Services.prefs.getBoolPref(CREDITCARDS_AVAILABLE_PREF);
  }

  get _isAutofillCreditCardsEnabled() {
    return Services.prefs.getBoolPref(CREDITCARDS_ENABLED_PREF);
  }

  get isAutofillCreditCardsHideUI() {
    return Services.prefs.getBoolPref(CREDITCARDS_HIDE_UI_PREF);
  }

  get isAutofillAddressesFirstTimeUse() {
    return Services.prefs.getBoolPref(ADDRESSES_FIRST_TIME_USE_PREF);
  }

  get AutofillCreditCardsUsedStatus() {
    return Services.prefs.getBoolPref(CREDITCARDS_USED_STATUS_PREF);
  }

  get supportedCountries() {
    const countryCodes = Services.prefs.getCharPref(SUPPORTED_COUNTRIES_PREF);
    return countryCodes.split(",").map(countryCode => countryCode.trim());
  }
}

const FormAutofillInstance = new FormAutofill();

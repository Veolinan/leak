let currentTab;

// Query the active tab
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  currentTab = tabs[0];
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
  } else {
    onDOMContentLoaded();
  }
});

// Helper function to render sniff or leak list
function renderSniffOrLeakList(listElements, tabType, detailsDivId) {
  const detailsDiv = document.getElementById(detailsDivId);
  const liElements = detailsDiv.getElementsByTagName("li");

  if (liElements.length) {
    let first = detailsDiv.firstElementChild;
    while (first) {
      first.remove();
      first = detailsDiv.firstElementChild;
    }
  }

  if (!listElements) {
    return;
  }

  Object.keys(listElements).forEach((key) => {
    const tracker = listElements[key].trackerDetails;
    const groupedFields = listElements[key].details.reduce((r, a) => {
      r[a.inputField.fieldName] = r[a.inputField.fieldName] || [];
      r[a.inputField.fieldName].push(a);
      return r;
    }, Object.create(null));

    const listEl = document.createElement("li");
    listEl.setAttribute("id", "domain-element");
    listEl.setAttribute("class", "sliding-card__url-list");

    const urlDiv = document.createElement("div");
    urlDiv.setAttribute("class", "url");
    urlDiv.innerText = extractHostFromURL(currentTab.url);

    const categoryDiv = document.createElement("div");
    categoryDiv.setAttribute("class", "category");

    let category = "";
    let categoryRes = ["Analytics", "Advertising", "Social Network"].some((displayCat) => {
      const match = tracker.categories.find((cat) => cat === displayCat);
      if (match) {
        category = match;
        return true;
      }
      return false;
    });

    categoryDiv.innerText = categoryRes ? category : tracker.categories.length ? tracker.categories[0] : listEl.type;

    const findingsDiv = document.createElement("div");
    const fieldsList = document.createElement("ol");
    fieldsList.setAttribute("class", "sliding-card__fields-list");

    Object.keys(groupedFields).forEach((key) => {
      const fieldEl = document.createElement("li");
      fieldEl.setAttribute("class", "sliding-card__field-element");

      const fieldName = document.createElement("div");
      fieldName.setAttribute("class", "leaked-fields");
      const fieldValue = groupedFields[key].slice(-1)[0].inputField.value || `(${groupedFields[key].length}) ${key}`;
      fieldName.innerText = fieldValue;

      fieldEl.appendChild(fieldName);
      fieldsList.appendChild(fieldEl);
    });

    findingsDiv.appendChild(fieldsList);
    listEl.appendChild(urlDiv);
    listEl.appendChild(categoryDiv);
    listEl.appendChild(findingsDiv);
    detailsDiv.appendChild(listEl);
  });
}

// Add slider view
function addSliderView(tabType) {
  chrome.storage.local.get([tabType + "_" + currentTab.id], (listEls) => {
    const listElsInTab = listEls[tabType + "_" + currentTab.id];
    renderURL(extractHostFromURL(currentTab.url));
    renderSniffOrLeakList(listElsInTab, tabType, tabType + "-domain-list");
    document
      .getElementById(`${tabType}-card`)
      .classList.add("sliding-card--open");
    document
      .getElementById("popup-container")
      .classList.add("sliding-subview--open");
    document
      .getElementById(`${tabType}-js-hero-close`)
      .addEventListener("click", () => removeSliderView(tabType), false);
  });
}

// Remove slider view
function removeSliderView(tabType) {
  document
    .getElementById("popup-container")
    .classList.remove("sliding-subview--open");
  document
    .getElementById(`${tabType}-card`)
    .classList.remove("sliding-card--open");
}

// Render URL
function renderURL(tabURL) {
  const titleElements = document.getElementsByClassName("hero__title");
  for (const titleElement of titleElements) {
    titleElement.textContent = tabURL;
  }
}

// Handle messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const views = chrome.extension.getViews({ type: "popup" });
  if (request.type === "BGToPopupSniff" && views.length > 0) {
    const leak_details_div = document.getElementById("sniff-details");
    chrome.storage.local.get("sniffs_" + currentTab.id, (listElsInTab) => {
      const sniffs = listElsInTab["sniffs_" + currentTab.id];
      if (sniffs) {
        document.getElementById("sniffs_text").textContent = `${
          Object.keys(sniffs).length > 0
            ? Object.values(sniffs)
                .map((el) => el.details)
                .map((el) => el.length)
                .reduce((partialSum, a) => partialSum + a, 0)
            : 0
        } Sniff Attempts`;

        if (leak_details_div !== null) {
          renderSniffOrLeakList(sniffs, "sniffs", "sniff-details");
        }
      }
    });
  } else if (request.type === "BGToPopupLeak" && views.length > 0) {
    const sniff_details_div = document.getElementById("leak-details");
    chrome.storage.local.get("leaky_requests_" + currentTab.id, (listElsInTab) => {
      const reqs = listElsInTab["leaky_requests_" + currentTab.id];
      if (reqs) {
        document.getElementById("leaky_req_text").textContent = `${
          Object.keys(reqs).length > 0
            ? Object.values(reqs)
                .map((el) => el.details)
                .map((el) => el.length)
                .reduce((partialSum, a) => partialSum + a, 0)
            : 0
        } Leaky Requests`;

        if (sniff_details_div !== null) {
          renderSniffOrLeakList(reqs, "leaky_requests", "leak-details");
        }
      }
    });
  }
});

// Initialize and toggle button control
function initializeStorage(storageId, buttonId) {
  chrome.storage.local.get(storageId, (items) => {
    if (items[storageId]) {
      chrome.storage.local.set({ [storageId]: true }, () => {
        document.getElementById(buttonId).ariaPressed = true;
        document
          .getElementById(buttonId)
          .classList.remove("toggle-button--is-active-false");
        document
          .getElementById(buttonId)
          .classList.add("toggle-button--is-active-true");
      });
    } else {
      chrome.storage.local.set({ [storageId]: false }, () => {
        document.getElementById(buttonId).ariaPressed = false;
        document
          .getElementById(buttonId)
          .classList.remove("toggle-button--is-active-true");
        document
          .getElementById(buttonId)
          .classList.add("toggle-button--is-active-false");
      });
    }
  });
}

function toggleButtonControl(storageId, buttonId) {
  chrome.storage.local.get(storageId, (items) => {
    if (items[storageId]) {
      chrome.storage.local.set({ [storageId]: false }, () => {
        document.getElementById(buttonId).ariaPressed = false;
        document
          .getElementById(buttonId)
          .classList.remove("toggle-button--is-active-true");
        document
          .getElementById(buttonId)
          .classList.add("toggle-button--is-active-false");

        if (storageId === "requestControl") {
          chrome.runtime.sendMessage({
            type: "requestControl",
            storageId,
            value: false,
          });
        } else if (storageId === "thirdPartyControl") {
          chrome.tabs.query(
            { currentWindow: true, active: true },
            function (tabs) {
              const activeTab = tabs[0];
              chrome.tabs.sendMessage(activeTab.id, {
                message: "thirdPartyControl",
                value: false,
              });
            }
          );
        }
      });
    } else {
      chrome.storage.local.set({ [storageId]: true }, () => {
        document.getElementById(buttonId).ariaPressed = true;
        document
          .getElementById(buttonId)
          .classList.remove("toggle-button--is-active-false");
        document
          .getElementById(buttonId)
          .classList.add("toggle-button--is-active-true");

        if (storageId === "requestControl") {
          chrome.runtime.sendMessage({
            type: "requestControl",
            storageId,
            value: true,
          });
        } else if (storageId === "thirdPartyControl") {
          chrome.tabs.query(
            { currentWindow: true, active: true },
            function (tabs) {
              const activeTab = tabs[0];
              chrome.tabs.sendMessage(activeTab.id, {
                message: "thirdPartyControl",
                value: true,
              });
            }
          );
        }
      });
    }
  });
}

// Initialize DOM content loaded
function onDOMContentLoaded() {
  renderURL(extractHostFromURL(currentTab.url));
  initializeStorage("thirdPartyControl", "sniffer-blocker-button");
  initializeStorage("requestControl", "request-blocker-button");

  document
    .getElementById("sniffer-blocker-button")
    .addEventListener("click", () =>
      toggleButtonControl("thirdPartyControl", "sniffer-blocker-button")
    );

  document
    .getElementById("request-blocker-button")
    .addEventListener("click", () =>
      toggleButtonControl("requestControl", "request-blocker-button")
    );

  chrome.storage.local.get("sniffs_" + currentTab.id, (sniffList) => {
    const sniffs = sniffList["sniffs_" + currentTab.id];
    if (sniffs) {
      document.getElementById("sniffs_text").textContent = `${
        Object.keys(sniffs).length > 0
          ? Object.values(sniffs)
              .map((el) => el.details)
              .map((el) => el.length)
              .reduce((partialSum, a) => partialSum + a, 0)
          : 0
      } Sniff Attempts`;
    }
  });

  chrome.storage.local.get("leaky_requests_" + currentTab.id, (leakList) => {
    const leaks = leakList["leaky_requests_" + currentTab.id];
    if (leaks) {
      document.getElementById("leaky_req_text").textContent = `${
        Object.keys(leaks).length > 0
          ? Object.values(leaks)
              .map((el) => el.details)
              .map((el) => el.length)
              .reduce((partialSum, a) => partialSum + a, 0)
          : 0
      } Leaky Requests`;
    }
  });

  initSwitchButton();
  addSliderListener("request-leaks-info", "leaky_requests");
  addSliderListener("sniffs-info", "sniffs");

  document.getElementById("switch_button").onclick = toggleExtensionControl;

  // Detect browser
  const isChrome = !!window.chrome && !!window.chrome.webstore;
  if (isChrome) {
    document.getElementById("extension-body").classList.add("is-browser--chrome");
  }
}

// Initialize switch button
function initSwitchButton() {
  const storageId = "extension_switch";
  chrome.storage.local.get(storageId, (items) => {
    if (items[storageId]) {
      document.getElementById("switch_button").classList.add("switch-active");
    } else {
      document
        .getElementById("control-buttons")
        .classList.add("control-buttons-disable");
    }
  });
}

// Switch on/off
function switchOnOff(boolValue) {
  const elementInfo = [
    { storageId: "thirdPartyControl", buttonId: "sniffer-blocker-button" },
    { storageId: "requestControl", buttonId: "request-blocker-button" },
  ];

  for (const element of elementInfo) {
    if (!boolValue) {
      chrome.storage.local.set({ [element.storageId]: false }, () => {
        document.getElementById(element.buttonId).ariaPressed = false;
        document
          .getElementById(element.buttonId)
          .classList.remove("toggle-button--is-active-true");
        document
          .getElementById(element.buttonId)
          .classList.add("toggle-button--is-active-false");

        if (element.storageId === "requestControl") {
          chrome.runtime.sendMessage({
            type: "requestControl",
            storageId: element.storageId,
            value: false,
          });
        } else if (element.storageId === "thirdPartyControl") {
          chrome.tabs.query(
            { currentWindow: true, active: true },
            function (tabs) {
              const activeTab = tabs[0];
              chrome.tabs.sendMessage(activeTab.id, {
                message: "thirdPartyControl",
                value: false,
              });
            }
          );
        }
      });
    } else {
      chrome.storage.local.set({ [element.storageId]: true }, () => {
        document.getElementById(element.buttonId).ariaPressed = true;
        document
          .getElementById(element.buttonId)
          .classList.remove("toggle-button--is-active-false");
        document
          .getElementById(element.buttonId)
          .classList.add("toggle-button--is-active-true");

        if (element.storageId === "requestControl") {
          chrome.runtime.sendMessage({
            type: "requestControl",
            storageId: element.storageId,
            value: true,
          });
        } else if (element.storageId === "thirdPartyControl") {
          chrome.tabs.query(
            { currentWindow: true, active: true },
            function (tabs) {
              const activeTab = tabs[0];
              chrome.tabs.sendMessage(activeTab.id, {
                message: "thirdPartyControl",
                value: true,
              });
            }
          );
        }
      });
    }
  }
}

// Toggle extension control
function toggleExtensionControl() {
  const storageId = "extension_switch";
  chrome.storage.local.get(storageId, (items) => {
    if (items[storageId]) {
      chrome.storage.local.set({ [storageId]: false }, () => {
        switchOnOff(false);
        document
          .getElementById("switch_button")
          .classList.remove("switch-active");
        document
          .getElementById("control-buttons")
          .classList.add("control-buttons-disable");
      });
    } else {
      chrome.storage.local.set({ [storageId]: true }, () => {
        switchOnOff(true);
        document.getElementById("switch_button").classList.add("switch-active");
        document
          .getElementById("control-buttons")
          .classList.remove("control-buttons-disable");
      });
    }
  });
}

// Add slider listener
function addSliderListener(elId, tabType) {
  document.getElementById(elId).addEventListener("click", () => {
    addSliderView(tabType);
  });
}

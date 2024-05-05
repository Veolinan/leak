// Define constants
const SCRIPT_NAMES = [
  "page_scripts/page_script.js"
];
const EXTENSION_STORAGE_KEY = "extension_switch";
const MESSAGE_TYPES = {
  GET_TAB_ID: "getTabId",
  INPUT_SNIFFED: "inputSniffed",
  REQ_LEAK_OCCURRED: "reqLeakOccurred",
  INPUT_FIELD_CHANGED: "inputFieldChanged"
};

// Check if the extension is enabled
chrome.storage.local.get([EXTENSION_STORAGE_KEY], (items) => {
  if (items[EXTENSION_STORAGE_KEY]) {
    injectScripts();
    addEventListeners();
  }
});

// Inject scripts
function injectScripts() {
  for (const script of SCRIPT_NAMES) {
    const scriptPath = chrome.runtime.getURL(script);
    injectPageScript(scriptPath);
  }
}

// Inject a single script
function injectPageScript(scriptPath) {
  const s = document.createElement("script");
  s.src = scriptPath;
  s.async = false;
  s.type = "text/javascript";
  s.onload = () => s.remove();
  document.head.appendChild(s);
}

// Get the tab ID
function getTabId() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_TAB_ID }, (tabId) => {
      resolve(tabId);
    });
  });
}

// Add event listeners
async function addEventListeners() {
  const tabId = await getTabId();
  document.addEventListener("inputSniffed", (e) => {
    const data = e.detail;
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.INPUT_SNIFFED,
      sniffDetails: { tabId, data },
    });
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === MESSAGE_TYPES.REQ_LEAK_OCCURRED) {
      handleLeakOccurred(request.xpaths);
    }
  });
}

// Handle leak occurred
function handleLeakOccurred(xpaths) {
  xpaths.forEach((xpath) => {
    document.dispatchEvent(new CustomEvent("leakOccured", { detail: xpath }));
  });
}

// Add event handler to an element
function addEventHandlerToEl(inputEl, eventType, eventHandler) {
  inputEl.addEventListener(eventType, eventHandler);
}

// Record input
function recordInput(event) {
  const inputFields = [];
  const url = document.location.href;
  const PII_FIELDS = document.querySelectorAll("[leaky-field-name]");

  for (const inputField of PII_FIELDS) {
    const value = inputField.value;
    if (value.length < 5) continue;
    const xpath = getXPath(inputField);
    const fieldName = inputField.getAttribute("leaky-field-name");
    inputFields.push({ value, fieldName, xpath });
  }

  if (inputFields.length) {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.INPUT_FIELD_CHANGED,
      data: { url, inputFields },
    });
  }
}

// Add sniff listener to existing elements
function addSniffListener2ExistingElements() {
  const shownInputFields = getAllPIIFields(true);

  for (const inputEl of shownInputFields) {
    const xpath = getXPath(inputEl.element);
    inputEl.element.setAttribute("leaky-field-name", inputEl.fieldName);
    document.dispatchEvent(
      new CustomEvent("modifyInputElementSetterGetter", { detail: xpath })
    );
    addEventHandlerToEl(inputEl.element, "input", recordInput);
  }
}

// Debounce
function debounce(func, wait, immediate) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    const later = function () {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait || 1000);
    if (callNow) {
      func.apply(context, args);
    }
  };
}

// Monitor PII elements
function monitorPiiElements() {
  const shownInputFields = getAllPIIFields(true);

  for (const inputEl of shownInputFields) {
    const xpath = getXPath(inputEl.element);
    inputEl.element.setAttribute("leaky-field-name", inputEl.fieldName);
    document.dispatchEvent(
      new CustomEvent("modifyInputElementSetterGetter", { detail: xpath })
    );
    addEventHandlerToEl(inputEl.element, "input", recordInput);
  }
}

// Add sniff listener to dynamically added elements
function addSniffListener2DynamicallyAddedElements() {
  const debouncedMonitorPiiEls = debounce(monitorPiiElements, 500);
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const addedInputEl = mutation.addedNodes[i];
        if (addedInputEl.tagName && addedInputEl.tagName.toLowerCase() === "input") {
          debouncedMonitorPiiEls();
        }
      }
    });
  });

  observer.observe(document, { childList: true, subtree: true });
}

addSniffListener2DynamicallyAddedElements();
addSniffListener2ExistingElements();

let input_elements = {};
let leaky_requests = {};
let sniffs = {};
let activeTabId, lastUrl, lastTitle;
const BADGE_TYPE_GOOD = 'good';
const BADGE_TYPE_BAD = 'bad';

let tds = new Trackers();
tds.setLists([tds_tracker_info]);

function afterReloadAndNewTab(tabId) {
  input_elements[tabId] = undefined;
  leaky_requests[tabId] = {};

  chrome.storage.local.set({ ["leaky_requests_" + tabId]: {} });
  chrome.storage.local.set({ ["sniffs_" + tabId]: {} });

  sniffs[tabId] = {};

  chrome.storage.local.get("thirdPartyControl", items => {
    window.thirdPartyControl = items["thirdPartyControl"];
  });
  chrome.storage.local.get("requestControl", items => {
    window.requestControl = items["requestControl"];
  });
  chrome.browserAction.setIcon({
    path: `../icons/logo_min.png`,
  });
  setBadge(tabId);
}

function setBadge(tabId) {
  // Set badge based on leaky_requests and sniffs
}

chrome.tabs.onActivated.addListener(function (tab) {
  chrome.tabs.get(tab.tabId, function (tab) {
    activeTabId = tab.id;
    lastUrl = tab.url;
    lastTitle = tab.title;

    getStoredData(tab.id);
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  activeTabId = tab.id;
  lastUrl = tab.url;
  lastTitle = tab.title;

  if (changeInfo.status === "loading" && lastUrl === 'chrome://newtab/') {
    console.log(`Tab initialized, ${tabId}`);
    afterReloadAndNewTab(tabId);
  }
});

function getStoredData(tabId) {
  chrome.storage.local.get(["leaky_requests_" + tabId, "sniffs_" + tabId], (storageRes) => {
    if (storageRes["leaky_requests_" + tabId] || storageRes["sniffs_" + tabId]) {
      if (storageRes["leaky_requests_" + tabId]) {
        console.log(`Tab changed (${tabId}) - found leaks`);
      }
      if (storageRes["sniffs_" + tabId]) {
        console.log(`Tab changed (${tabId}) - found sniffs`);
      }
      setBadge(tabId);
    } else {
      console.log(`Tab changed (${tabId}) - no leaks or sniffs`);
    }
  });
}

// ... (rest of the code)

chrome.runtime.onInstalled.addListener(function (details) {
  chrome.storage.local.set({ requestControl: true }, function () {
    console.log('Req control initialized!');
  });
  chrome.storage.local.set({ thirdPartyControl: true }, function () {
    console.log('Sniffer control initialized!');
  });
  chrome.storage.local.set({ extension_switch: true }, function () {
    console.log('Extension switch initialized!');
  });
  if (typeof(chrome.browserAction.setBadgeBackgroundColor)!=="function") {
    chrome.browserAction.setBadgeBackgroundColor=function(){}; // create "NOOP" polyfill
  }
});

const BADGE_TYPE_GOOD = 'good';
const BADGE_TYPE_BAD = 'bad';
let tds;
let activeTabId;
let lastUrl, lastTitle;

function initializeTabData(tabId) {
  const input_elements = {};
  const leaky_requests = {};
  const sniffs = {};

  return { input_elements, leaky_requests, sniffs };
}

function updateTabData(tabId, storageRes) {
  const { leaky_requests, sniffs } = storageRes;

  if (leaky_requests || sniffs) {
    if (leaky_requests) {
      console.log(`Tab changed (${tabId}) - found leaks`);
    }
    if (sniffs) {
      console.log(`Tab changed (${tabId}) - found sniffs`);
    }
    setBadge(tabId);
  } else {
    console.log(`Tab changed (${tabId}) - no leaks or sniffs`);
  }
}

function afterReloadAndNewTab(tabId) {
  const tabData = initializeTabData(tabId);

  chrome.storage.local.set({ ["leaky_requests_" + tabId]: {} });
  chrome.storage.local.set({ ["sniffs_" + tabId]: {} });

  sniffs[tabId] = tabData.sniffs;
  leaks[tabId] = tabData.leaky_requests;
  input_elements[tabId] = undefined;

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

const tabManagement = {
  onActivated: (tab) => {
    chrome.tabs.get(tab.tabId, (tab) => {
      activeTabId = tab.id;
      lastUrl = tab.url;
      lastTitle = tab.title;

      getStoredData(tab.id);
    });
  },
  onUpdated: (tabId, changeInfo, tab) => {
    activeTabId = tab.id;
    lastUrl = tab.url;
    lastTitle = tab.title;

    if (changeInfo.status === "loading" && lastUrl === 'chrome://newtab/') {
      console.log(`Tab initialized, ${tabId}`);
      afterReloadAndNewTab(tabId);
    }
  }
};

function getStoredData(tabId) {
  chrome.storage.local.get(["leaky_requests_" + tabId, "sniffs_" + tabId], (storageRes) => {
    updateTabData(tabId, tabData);
  });
}

tds = new Trackers();
tds.setLists([tds_tracker_info]);

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

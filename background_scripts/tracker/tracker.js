(function () {
  class Trackers {
    constructor() {
      this.entityList = {};
      this.trackerList = {};
      this.domains = [];
      this.cnames = [];
      this.surrogateList = {};
    }

    setLists(lists) {
      lists.forEach((list) => {
        if (list.name === "tds") {
          this.entityList = this.processEntityList(list.data.entities);
          this.trackerList = this.processTrackerList(list.data.trackers);
          this.domains = list.data.domains;
          this.cnames = list.data.cnames;
        } else if (list.name === "surrogates") {
          this.surrogateList = this.processSurrogateList(list.data);
        }
      });
    }

    processTrackerList(data) {
      for (const [name, tracker] of Object.entries(data)) {
        if (tracker.rules) {
          for (const [i, rule] of tracker.rules.entries()) {
            tracker.rules[i].rule = new RegExp(rule.rule, "ig");
          }
        }
      }
      return data;
    }

    processEntityList(data) {
      const processed = {};
      for (const [entity, details] of Object.entries(data)) {
        details.domains.forEach((domain) => {
          processed[domain] = entity;
        });
      }
      return processed;
    }

    processSurrogateList(text) {
      const b64dataheader = "data:application/javascript;base64,";
      const surrogateList = {};
      const splitSurrogateList = text.trim().split("\n\n");

      splitSurrogateList.forEach((sur) => {
        // remove comment lines
        const lines = sur.split("\n").filter((line) => {
          return !/^#.*/.test(line);
        });

        // remove first line, store it
        const firstLine = lines.shift();

        // take identifier from first line
        const pattern = firstLine.split(" ")[0].split("/")[1];
        const b64surrogate = Buffer.from(
          lines.join("\n").toString(),
          "binary"
        ).toString("base64");
        surrogateList[pattern] = b64dataheader + b64surrogate;
      });
      return surrogateList;
    }

    resolveCname(url) {
      let hostname = getHostName(url);
      const parsed = psl.parse(hostname);
      let finalURL = url;
      let fromCname;
      if (parsed && this.cnames) {
        let domain = parsed.domain;
        if (parsed.subdomain) {
          domain = parsed.subdomain + "." + domain;
        }
        const finalDomain = this.cnames[domain] || domain;
        finalURL = finalURL.replace(domain, finalDomain);
        if (finalDomain !== domain) {
          fromCname = domain;
        }
      }
      return {
        fromCname,
        finalURL,
      };
    }

    getTrackerData(urlToCheck, siteUrl, request) {
      if (!this.entityList || !this.trackerList) {
        throw new Error("tried to detect trackers before rules were loaded");
      }

      const requestData = {
        siteUrl,
        request,
        siteDomain: getBaseDomainFromUrl(siteUrl),
        siteUrlSplit: extractHostFromURL(siteUrl).split("."),
        urlToCheck,
        urlToCheckDomain: getBaseDomainFromUrl(urlToCheck),
        urlToCheckSplit: extractHostFromURL(urlToCheck).split("."),
      };

      const tracker = this.findTracker(requestData);

      if (!tracker) {
        const cnameResolution = this.resolveCname(urlToCheck);
        urlToCheck = cnameResolution.finalURL;
        requestData.urlToCheck = urlToCheck;
        requestData.urlToCheckDomain = getBaseDomainFromUrl(urlToCheck);
        requestData.urlToCheckSplit = extractHostFromURL(urlToCheck).split(".");
        tracker = this.findTracker(requestData);

        if (!tracker) {
          return null;
        }
      }

      const matchedRule = this.findRule(tracker, requestData);

      const redirectUrl = matchedRule && matchedRule.surrogate ? false : false;

      const matchedRuleException = matchedRule
        ? this.matchesRuleDefinition(matchedRule, "exceptions", requestData)
        : false;

      const trackerOwner = this.findTrackerOwner(requestData.urlToCheckDomain);

      const websiteOwner = this.findWebsiteOwner(requestData);

      const firstParty =
        trackerOwner && websiteOwner ? trackerOwner === websiteOwner : false;

      const fullTrackerDomain = requestData.urlToCheckSplit.join(".");

      const { action, reason } = this.getAction({
        firstParty,
        matchedRule,
        matchedRuleException,
        defaultAction: tracker.default,
        redirectUrl,
      });

      return {
        action,
        reason,
        firstParty,
        redirectUrl,
        matchedRule,
        matchedRuleException,
        tracker,
        fullTrackerDomain,
        fromCname: cnameResolution.fromCname,
      };
    }

    findTracker(requestData) {
      const urlList = Array.from(requestData.urlToCheckSplit);

      while (urlList.length > 1) {
        const trackerDomain = urlList.join(".");
        urlList.shift();

        const matchedTracker = this.trackerList[trackerDomain];
        if (matchedTracker) {
          return matchedTracker;
        }
      }
    }

    findTrackerOwner(trackerDomain) {
      return this.entityList[trackerDomain];
    }

    findWebsiteOwner(requestData) {
      const siteUrlList = Array.from(requestData.siteUrlSplit);

      while (siteUrlList.length > 1) {
        const siteToCheck = siteUrlList.join(".");
        siteUrlList.shift();

        if (this.entityList[siteToCheck]) {
          return this.entityList[siteToCheck];
        }
      }
    }

    findRule(tracker, requestData) {
      return tracker.rules.find((ruleObj) =>
        this.requestMatchesRule(requestData, ruleObj)
      );
    }

    requestMatchesRule(requestData, ruleObj) {
      return (
        ruleObj.rule.test(requestData.urlToCheck) &&
        this.matchesRuleDefinition(ruleObj, "options", requestData)
      );
    }

    matchesRuleDefinition(rule, type, requestData) {
      if (!rule[type]) {
        return false;
      }

      const ruleDefinition = rule[type];

      const matchTypes =
        ruleDefinition.types && ruleDefinition.types.includes(requestData.request.type);

      const matchDomains =
        ruleDefinition.domains &&
        ruleDefinition.domains.some((domain) => domain.match(requestData.siteDomain));

      return matchTypes && matchDomains;
    }

    getAction(tracker) {
      if (tracker.firstParty) {
        return { action: "ignore", reason: "first party" };
      }

      if (tracker.matchedRuleException) {
        return { action: "ignore", reason: "matched rule - exception" };
      }

      if (!tracker.matchedRule && tracker.defaultAction === "ignore") {
        return { action: "ignore", reason: "default ignore" };
      }

      if (
        tracker.matchedRule &&
        tracker.matchedRule.action === "ignore"
      ) {
        return { action: "ignore", reason: "matched rule - ignore" };
      }

      if (!tracker.matchedRule && tracker.defaultAction === "block") {
        return { action: "block", reason: "default block" };
      }

      if (tracker.matchedRule) {
        if (tracker.redirectUrl) {
          return { action: "redirect", reason: "matched rule - surrogate" };
        } else {
          return { action: "block", reason: "matched rule - block" };
        }
      }
    }
  }

  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = Trackers;
  } else {
    window.Trackers = Trackers;
  }
})();

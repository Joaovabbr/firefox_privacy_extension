let tabData = {};

function initTabData(tabId, url) {
    let mainDomain = new URL(url).hostname;
    tabData[tabId] = {
        mainDomain: mainDomain,
        thirdPartyRequests: [],
        thirdPartyDomains: new Set(),
        supercookies: [],
        redirects: [],
        suspiciousScripts: [],
        fingerprinting: [],
        cookies: { firstParty: 0, thirdParty: 0, session: 0, persistent: 0 },
        storage: { local: 0, session: 0, indexedDB: 0 },
        score: 100
    };
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url && tab.url.startsWith('http')) {
        initTabData(tabId, tab.url);
    }
});

browser.tabs.onRemoved.addListener((tabId) => {
    delete tabData[tabId];
});

// Analyze Requests for 3rd party connections and resource types
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        let tabId = details.tabId;
        if (tabId === -1 || !tabData[tabId]) return;

        try {
            let requestUrl = new URL(details.url);
            let requestDomain = requestUrl.hostname;
            let mainDomain = tabData[tabId].mainDomain;

            // Simple check for 3rd party
            if (!requestDomain.endsWith(mainDomain) && !mainDomain.endsWith(requestDomain)) {
                tabData[tabId].thirdPartyDomains.add(requestDomain);
                tabData[tabId].thirdPartyRequests.push({
                    domain: requestDomain,
                    type: details.type,
                    url: details.url
                });
            }
        } catch (e) {
            console.error("Invalid URL", details.url);
        }
    },
    { urls: ["<all_urls>"] }
);

// Analyze Headers for Supercookies (ETag, HSTS)
browser.webRequest.onHeadersReceived.addListener(
    (details) => {
        let tabId = details.tabId;
        if (tabId === -1 || !tabData[tabId]) return;

        let hasETag = false;
        let hasHSTS = false;

        if (details.responseHeaders) {
            for (let header of details.responseHeaders) {
                let name = header.name.toLowerCase();
                if (name === 'etag') hasETag = true;
                if (name === 'strict-transport-security') hasHSTS = true;
            }
        }

        try {
            let requestDomain = new URL(details.url).hostname;
            if (hasETag || hasHSTS) {
                // If it's a third party domain sending these, it could be a supercookie
                if (!requestDomain.endsWith(tabData[tabId].mainDomain)) {
                    tabData[tabId].supercookies.push({
                        domain: requestDomain,
                        type: hasHSTS ? 'HSTS' : 'ETag'
                    });
                }
            }
        } catch (e) {}
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
);

// Analyze Hijacking / Redirects
browser.webRequest.onBeforeRedirect.addListener(
    (details) => {
        let tabId = details.tabId;
        if (tabId === -1 || !tabData[tabId]) return;
        
        tabData[tabId].redirects.push({
            from: details.url,
            to: details.redirectUrl
        });
    },
    { urls: ["<all_urls>"] }
);

// Listen to Content Script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let tabId = sender.tab ? sender.tab.id : (message.tabId || null);
    if (!tabId || !tabData[tabId]) return;

    if (message.type === 'FINGERPRINTING') {
        tabData[tabId].fingerprinting.push(message.data);
    } else if (message.type === 'STORAGE_DATA') {
        tabData[tabId].storage = message.data;
    } else if (message.type === 'COOKIES_DATA') {
        tabData[tabId].cookies = message.data;
    } else if (message.type === 'SUSPICIOUS_SCRIPT') {
        tabData[tabId].suspiciousScripts.push(message.data);
    } else if (message.type === 'GET_DATA') {
        // Compute Score
        let data = tabData[message.tabId];
        if (data) {
            let score = 100;
            score -= data.thirdPartyDomains.size * 1;
            score -= data.fingerprinting.length * 15;
            score -= data.cookies.thirdParty * 2;
            if (data.storage.local > 0 || data.storage.indexedDB > 0) score -= 5;
            score -= data.redirects.length * 20;
            score -= data.supercookies.length * 10;
            data.score = Math.max(0, score);
            sendResponse(data);
        } else {
            sendResponse(null);
        }
    }
});

// content.js - Injected into every page

// 1. Inject the injected.js script into the main world to override APIs
let script = document.createElement('script');
script.src = browser.runtime.getURL('injected.js');
script.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

// 2. Listen for messages from injected.js (Fingerprinting alerts)
window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data && event.data.type === 'FINGERPRINTING') {
        browser.runtime.sendMessage({
            type: 'FINGERPRINTING',
            data: event.data.data
        });
    }
});

// 3. Analyze Web Storage and IndexedDB
function analyzeStorage() {
    let storageData = {
        local: 0,
        session: 0,
        indexedDB: 0,
        localKeys: [],
        sessionKeys: []
    };

    // localStorage
    try {
        storageData.local = Object.keys(localStorage).length;
        for (let i = 0; i < localStorage.length; i++) {
            storageData.localKeys.push(localStorage.key(i));
        }
    } catch(e) {}

    // sessionStorage
    try {
        storageData.session = Object.keys(sessionStorage).length;
        for (let i = 0; i < sessionStorage.length; i++) {
            storageData.sessionKeys.push(sessionStorage.key(i));
        }
    } catch(e) {}

    // IndexedDB - We just check if databases exist (requires async wrapper)
    try {
        if (indexedDB.databases) {
            indexedDB.databases().then(dbs => {
                storageData.indexedDB = dbs.length;
                sendStorageData(storageData);
            }).catch(() => sendStorageData(storageData));
        } else {
            sendStorageData(storageData);
        }
    } catch(e) {
        sendStorageData(storageData);
    }
}

function sendStorageData(data) {
    browser.runtime.sendMessage({
        type: 'STORAGE_DATA',
        data: data
    });
}

// 4. Count 1st party cookies from document.cookie
function analyzeCookies() {
    let cookieCount = 0;
    try {
        if (document.cookie) {
            cookieCount = document.cookie.split(';').length;
        }
    } catch(e) {}
    
    browser.runtime.sendMessage({
        type: 'COOKIES_DATA',
        data: {
            firstParty: cookieCount,
            thirdParty: 0, // thirdParty is better detected via background.js or webRequest, but for simplicity here we approximate
            session: cookieCount, // without background API, we can't easily know if session or persistent
            persistent: 0 
        }
    });
}

// 5. Detect suspicious external scripts (Hijacking / Hooking attempts)
function detectSuspiciousScripts() {
    let scripts = document.querySelectorAll('script[src]');
    scripts.forEach(s => {
        let src = s.src;
        // Known hooking/hijacking frameworks like BeEF usually have specific patterns,
        // we flag unknown or weird domains.
        if (src.includes('hook.js') || src.includes('beef')) {
            browser.runtime.sendMessage({
                type: 'SUSPICIOUS_SCRIPT',
                data: { src: src, reason: 'Possible Hijacking/BeEF hook' }
            });
        }
    });
}

// Run analysis after a short delay to let the page load
setTimeout(() => {
    analyzeStorage();
    analyzeCookies();
    detectSuspiciousScripts();
}, 2000);

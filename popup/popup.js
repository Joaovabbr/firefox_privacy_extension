document.addEventListener("DOMContentLoaded", () => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        let activeTab = tabs[0];
        
        browser.runtime.sendMessage({ type: "GET_DATA", tabId: activeTab.id }).then((response) => {
            if (response) {
                updateUI(response);
            } else {
                document.getElementById('current-domain').textContent = "Página não monitorada";
            }
        });
    });
});

function updateUI(data) {
    // Domain
    document.getElementById('current-domain').textContent = data.mainDomain;

    // Score
    let score = data.score;
    document.getElementById('score-text').textContent = score;
    
    let circle = document.getElementById('score-progress');
    let offset = 339.292 - (339.292 * score) / 100;
    circle.style.strokeDashoffset = offset;

    if (score >= 80) {
        circle.style.stroke = "var(--success-color)";
    } else if (score >= 50) {
        circle.style.stroke = "var(--warning-color)";
    } else {
        circle.style.stroke = "var(--danger-color)";
    }

    // Stats
    document.getElementById('third-party-count').textContent = data.thirdPartyDomains.size;
    document.getElementById('cookie-count').textContent = data.cookies.firstParty;
    let totalStorage = data.storage.local + data.storage.session + data.storage.indexedDB;
    document.getElementById('storage-count').textContent = totalStorage;
    document.getElementById('fingerprint-count').textContent = data.fingerprinting.length;

    // Threats List
    let threatList = document.getElementById('threat-list');
    threatList.innerHTML = ''; // Clear safe state

    let threats = [];

    if (data.thirdPartyDomains.size > 0) {
        threats.push({ type: 'warning', text: `${data.thirdPartyDomains.size} domínios de terceira parte contatados.` });
    }
    
    data.fingerprinting.forEach(fp => {
        threats.push({ type: 'danger', text: `Fingerprint via ${fp.api} (${fp.method})` });
    });

    data.supercookies.forEach(sc => {
        threats.push({ type: 'danger', text: `Supercookie detectado via ${sc.type} (${sc.domain})` });
    });

    data.redirects.forEach(rd => {
        threats.push({ type: 'warning', text: `Redirecionamento detectado.` });
    });

    data.suspiciousScripts.forEach(script => {
        threats.push({ type: 'danger', text: `Script suspeito: ${script.reason}` });
    });

    if (threats.length === 0) {
        threatList.innerHTML = '<li class="safe-state">Nenhuma ameaça detectada ainda.</li>';
    } else {
        threats.forEach(t => {
            let li = document.createElement('li');
            li.className = `threat-item ${t.type}`;
            li.textContent = t.text;
            threatList.appendChild(li);
        });
    }
}

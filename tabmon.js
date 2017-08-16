
function nt (newtab) {
	function waitForURL(tabId, changeInfo, tab) {
		if (changeInfo.title === '@NewTab') {
			browser.storage.local.get('newtaburl').then(function (ntu) {
				browser.tabs.onUpdated.removeListener(waitForURL);
				if (ntu.newtaburl == null) {
					browser.storage.local.set({
						newtaburl: 'about:blank'
					});
					ntu.newtaburl = 'about:blank';
				}
				browser.storage.local.get('active').then(function (act) {
					if (act.active) {
						browser.tabs.create({
							'url': ntu.newtaburl
						});
						browser.tabs.remove(newtab.id);
					} else {
						browser.tabs.update(tabId, {
							'url': ntu.newtaburl
						});
					}
				});
			});
		}
		browser.tabs.onUpdated.removeListener(waitForURL);
	}
	browser.tabs.onUpdated.addListener(waitForURL);
}

browser.tabs.onCreated.addListener(nt);

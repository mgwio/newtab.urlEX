
function nt (newtab) {
	function waitForURL(tabId, changeInfo, tab) {
		console.log(changeInfo);
		if (changeInfo.title === '@NewTab') {
			browser.storage.local.get('newtaburl').then(function (ntu) {
				browser.tabs.onUpdated.removeListener(waitForURL);
				browser.storage.local.get('active').then(function (act) {
					if (act.active) {
						browser.tabs.remove(newtab.id);
						browser.tabs.create({
							'url': ntu.newtaburl
						})
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

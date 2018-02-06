const bookmarknav = 'bookmarks.html';
const newtaburlEX = {
	async idleCaptive(newtab) {
    	browser.tabs.onUpdated.addListener(newtaburlEX.forward);
	},

	async forward(tabId, changeInfo, tab) {
		if (changeInfo.title === '@NewTab') {
			let nturl = await newtaburlEX.getForwardUrl();
			let ntu = await browser.storage.local.get();
			if (ntu.active) {
				browser.tabs.create({
					url: nturl
				});
			    await browser.tabs.remove(tabId)
				let closed = await browser.sessions.getRecentlyClosed();
				if (Object.prototype.hasOwnProperty.call(closed[0], 'tab') &&
					closed[0].tab.title === '@NewTab') {
					browser.sessions.forgetClosedTab(
						closed[0].tab.windowId,
						closed[0].tab.sessionId.toString()
					);
				}
			} else {
				await browser.tabs.update(tabId, {
					url: nturl
				});
			}
		}
        browser.tabs.onUpdated.removeListener(newtaburlEX.forward);
	},

	async getForwardUrl() {
		let newtaburl = await browser.storage.local.get();
		if (!Object.keys(newtaburl).length || newtaburl.ntu === null) {
			return bookmarknav;
		} else {
			return (newtaburl.usetype === 'usebookmark') ? bookmarknav : newtaburl.ntu;
		}
	}
};

browser.tabs.onCreated.addListener(newtaburlEX.idleCaptive);

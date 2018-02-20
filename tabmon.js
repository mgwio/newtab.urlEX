
async function tabComms (p) {
	async function expungeClosedTab(tab) {
		let tabId = tab.tabId;
        await browser.tabs.remove(tabId);
        let closed = await browser.sessions.getRecentlyClosed();
        if (Object.prototype.hasOwnProperty.call(closed[0], 'tab') &&
            closed[0].tab.title === '@NewTab') {
            browser.sessions.forgetClosedTab(
                closed[0].tab.windowId,
                closed[0].tab.sessionId.toString()
            );
        }
	}
	p.onMessage.addListener(expungeClosedTab);
}

browser.runtime.onConnect.addListener(tabComms);

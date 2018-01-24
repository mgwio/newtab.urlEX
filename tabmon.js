
const newtaburlEX = {
    async idleCaptive(newtab) {
        browser.tabs.onUpdated.addListener(newtaburlEX.forward);
    },

    async forward(tabId, changeInfo, tab) {
        console.log("wewled");
        if (changeInfo.title === '@NewTab') {
            let ntu = await newtaburlEX.getForwardUrl();
            let makeactive = await browser.storage.local.get('active');
            if (makeactive.active) {
                browser.tabs.create({
                    'url': ntu
                });
                await browser.tabs.remove(tabId)
                let closed = await browser.sessions.getRecentlyClosed();
                if (Object.prototype.hasOwnProperty.call(closed[0],'tab') &&
                    closed[0].tab.title === '@NewTab') {
                    browser.sessions.forgetClosedTab(
                        closed[0].tab.windowId,
                        closed[0].tab.sessionId.toString()
                    );
                }
            } else {
                await browser.tabs.update(tabId, {
                    'url': ntu
                });

            }
        }
        browser.tabs.onUpdated.removeListener(newtaburlEX.forward);
    },

    async getForwardUrl() {
        let ntu = await browser.storage.local.get('newtaburl');
        if (ntu.newtaburl == null) {
            return 'about:blank';
        } else {
            return ntu.newtaburl;
        }
    }
}

browser.tabs.onCreated.addListener(newtaburlEX.idleCaptive);

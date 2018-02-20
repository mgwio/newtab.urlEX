const bookmarknav = 'bookmarks.html';
const newtaburlEX = {
    handleInstall(details) {
        return;
    },

    async forward() {
        let thisTab = await browser.tabs.getCurrent();
        let nturl = await newtaburlEX.getForwardUrl();
        let ntu = await browser.storage.local.get();
        if (ntu.active && !(nturl === bookmarknav)) {
            await newtaburlEX.activeForward(thisTab, nturl);
        } else {
            await newtaburlEX.updateForward(thisTab, nturl);
        }
    },

    async activeForward(thisTab, target) {
        let comms = await browser.runtime.connect();
        let blah = await browser.tabs.create({
            url: target
        });
        comms.postMessage({tabId: thisTab.id});
    },

    async updateForward(thisTab, target) {
        await browser.tabs.update(thisTab.id, {
            url: target,
            loadReplace: true
        });
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

browser.runtime.onInstalled.addListener(newtaburlEX.handleInstall);
newtaburlEX.forward();

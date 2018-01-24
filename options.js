
const SAVE_TEXT = 'Save';
const SETTINGS_ACTIVE = 'Settings active';
const FILE_WARNING = `Hold up! WebExtensions don't currently support\
'file:///' schemes :(`;

const optionsHandler = {
	async enableSave() {
		document.querySelector('#submitbutton').textContent = SAVE_TEXT;
		document.querySelector('#submitbutton').style.fontStyle = 'normal';
		document.querySelector('#submitbutton').disabled = false;
		if (document.querySelector('#ntu').value !== optionsHandler.storedValues.ntu && !document.querySelector('#sync').checked) {
			document.querySelector('#revert').style.visibility = 'visible';
		} else {
			document.querySelector('#revert').style.visibility = 'hidden';
		}
	},

	async disableSave() {
		document.querySelector('#submitbutton').textContent = SETTINGS_ACTIVE;
		document.querySelector('#submitbutton').style.fontStyle = 'italic';
		document.querySelector('#submitbutton').disabled = true;
		document.querySelector('#revert').style.visibility = 'hidden';
	},

	async updateLocalStored() {
		let ntu = await browser.storage.local.get();
		optionsHandler.storedValues = ntu;
		optionsHandler.disableSave();
	},

	async saveOptions(e) {
		e.preventDefault();
		let ntumod = document.querySelector('#ntu').value;
		ntumod = await optionsHandler.fixURL(ntumod);
		document.querySelector('#ntu').value = ntumod;
		await browser.storage.local.set({
			//newtaburl: {
				ntu: ntumod,
				active: document.querySelector('#active').checked,
				sync: document.querySelector('#sync').checked
			//}
	    });
		await optionsHandler.updateLocalStored();
	},

	async fixURL(url) {
		let fixedUrl;
		if (!url) {
			fixedUrl = 'about:home';
		} else if (
			(url.toLowerCase().startsWith('about:')) ||
			(url.toLowerCase().startsWith('chrome:'))
		) {
			fixedUrl = url;
		} else {
			let validUrl;
			try {
				fixedUrl = new URL(url).href;
			} catch (err) {
				console.error(err);
				if (!fixedUrl || fixedUrl.protocol === null) {
					fixedUrl = new URL('http://' + url).href;
				}
			}
		}
		return fixedUrl;
	},

	async getUserHome() {
		let home = await browser.browserSettings.homepageOverride.get({});
		home = await optionsHandler.fixURL(home.value.split("|")[0].trim());
		return home;
	},

	async restoreOptions() {
		try {
			let newtaburl = await browser.storage.local.get();
			let syncing = document.querySelector('#sync').checked = newtaburl.sync || false;
			let ntuField = document.querySelector('#ntu');
			ntuField.disabled = syncing;
			if (syncing) {
				let home = await optionsHandler.getUserHome();
				ntuField.value = home;
			} else {
				ntuField.value = newtaburl.ntu || 'about:home';
			}
			document.querySelector('#active').checked = newtaburl.active || false;
		} catch (err) {
			console.error(err);
		}
		await optionsHandler.updateLocalStored();
	},

	async modSave(e) {
		if (e.target.value.toLowerCase().startsWith('file:')) {
			document.querySelector('#warning').textContent = FILE_WARNING;
		} else {
			document.querySelector('#warning').textContent = '';
		}
		if (e.target.id === 'sync') {
			let ntuField = document.querySelector('#ntu');
			ntuField.disabled = e.target.checked;
			if (e.target.checked) {
				let userHome = await optionsHandler.getUserHome();
				ntuField.value = userHome;
			} else {
				ntuField.value = optionsHandler.storedValues.ntu;
			}
		}
		let ntuField = document.querySelector('#ntu');
		let activeField = document.querySelector('#active');
		let syncField = document.querySelector('#sync');
		if (ntuField.value === optionsHandler.storedValues.ntu &&
		    activeField.checked == optionsHandler.storedValues.active &&
		    syncField.checked == optionsHandler.storedValues.sync) {
			optionsHandler.disableSave();
		} else {
			optionsHandler.enableSave();
		}
	},

	async cancelEdit(e) {
		document.querySelector('#ntu').value = optionsHandler.storedValues.ntu || 'about:blank';
		document.querySelector('#revert').style.visibility = 'hidden';
		optionsHandler.disableSave();
	}

}

document.addEventListener('DOMContentLoaded', optionsHandler.restoreOptions);
document.querySelector('#options').addEventListener('input', optionsHandler.modSave);
document.querySelector('form').addEventListener('submit', optionsHandler.saveOptions);
document.querySelector('#revert').addEventListener('click', optionsHandler.cancelEdit);

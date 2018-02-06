const SAVE_TEXT = 'Save';
const SETTINGS_ACTIVE = 'Settings active';
const FILE_WARNING = `Hold up! WebExtensions don't currently support \
'file:///' schemes :(`;
const ABOUT_HOME = 'about:home';
const ntuField = document.querySelector('#ntu');
const syncField = document.querySelector('#sync');
const activeField = document.querySelector('#active');
const submitButton = document.querySelector('#submitbutton');
const revert = document.querySelector('#revert');

const optionsHandler = {
	async enableSave() {
		submitButton.textContent = SAVE_TEXT;
		submitButton.style.fontStyle = 'normal';
		submitButton.disabled = false;
		if (ntuField.value !== optionsHandler.storedValues.ntu && !syncField.checked) {
			revert.style.visibility = 'visible';
		} else {
			revert.style.visibility = 'hidden';
		}
	},

	async disableSave() {
		submitButton.textContent = SETTINGS_ACTIVE;
		submitButton.style.fontStyle = 'italic';
		submitButton.disabled = true;
		revert.style.visibility = 'hidden';
	},

	storedValues: {
		usetype: 'usebookmark',
		ntu: ABOUT_HOME,
		active: false,
		sync: false
	},
	async updateLocalStored() {
		let ntu = await browser.storage.local.get();
		Object.assign(optionsHandler.storedValues, ntu);
		optionsHandler.disableSave();
	},

	async saveOptions(e) {
		e.preventDefault();
		let usetypeField = document.querySelector('input[name="NtuType"]:checked');
		ntuField.value = await optionsHandler.fixURL(ntuField.value);
		await browser.storage.local.set({
			usetype: usetypeField.id,
			ntu: ntuField.value,
			active: activeField.checked,
			sync: syncField.checked
	    });
		optionsHandler.updateLocalStored();
	},

	async fixURL(url) {
		let fixedUrl;
		if (!url) {
			fixedUrl = ABOUT_HOME;
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

	async toggleSubopts() {
		document.querySelectorAll('.subopt input').forEach(i => {
			i.disabled = true;
		});
		let activeType = document.querySelector('input[name="NtuType"]:checked');
		document.querySelectorAll('.' + activeType.id + 'subopt input').forEach(i => {
			i.disabled = false;
		});
		if (activeType.id === 'usentu') {
			ntuField.disabled = syncField.checked;
		}
	},

	async restoreOptions() {
		await optionsHandler.updateLocalStored();
		document.querySelector('[value="' + optionsHandler.storedValues.usetype + '"]').checked = true;
		ntuField.value = optionsHandler.storedValues.ntu;
		syncField.checked = ntuField.disabled = optionsHandler.storedValues.sync;
		activeField.checked = optionsHandler.storedValues.active;
		optionsHandler.toggleSubopts();
	},

	async modSave(e) {
		if (e.target.value.toLowerCase().startsWith('file:')) {
			document.querySelector('#warning').textContent = FILE_WARNING;
		} else {
			document.querySelector('#warning').textContent = '';
		}
		if (e.target.name === 'NtuType') {
			optionsHandler.toggleSubopts();
		}
		if (e.target.id === 'sync') {
			ntuField.disabled = e.target.checked;
			if (e.target.checked) {
				let userHome = await optionsHandler.getUserHome();
				ntuField.value = userHome;
			} else {
				ntuField.value = optionsHandler.storedValues.ntu;
			}
		}
		optionsHandler.updateSaveButton();
	},

	async updateSaveButton() {
		let usentuField = document.querySelector('input[name="NtuType"]:checked');
		if (usentuField.id === optionsHandler.storedValues.usetype &&
		    ntuField.value === optionsHandler.storedValues.ntu &&
		    activeField.checked === optionsHandler.storedValues.active &&
		    syncField.checked === optionsHandler.storedValues.sync) {
			optionsHandler.disableSave();
		} else {
			optionsHandler.enableSave();
		}
	},

	async cancelEdit(e) {
		ntuField.value = optionsHandler.storedValues.ntu;
		revert.style.visibility = 'hidden';
		optionsHandler.updateSaveButton();
	}

}

document.addEventListener('DOMContentLoaded', optionsHandler.restoreOptions);
window.onunload = function(){};
document.querySelector('#options').addEventListener('input', optionsHandler.modSave);
document.querySelector('form').addEventListener('submit', optionsHandler.saveOptions);
document.querySelector('#revert').addEventListener('click', optionsHandler.cancelEdit);


const saveText = "Save";
const settingsActiveText = "Settings active";

var storedValues;

function updateLocalStored() {
	browser.storage.local.get().then(function(v) {
		storedValues = v;
	});
	document.querySelector('#submitbutton').innerText = settingsActiveText;
	document.querySelector('#submitbutton').style.fontStyle = "italic";
	document.querySelector('#submitbutton').disabled = true;
}

function saveOptions(e) {
	e.preventDefault();

	var ntumod = document.querySelector('#newtaburl').value;
	if (!(ntumod.toLowerCase().startsWith("about:")) && !(ntumod.toLowerCase().startsWith("http://") ||
	      ntumod.toLowerCase().startsWith("https://"))) {
		ntumod = "http://" + ntumod;
		document.querySelector('#newtaburl').value = ntumod;
	}

	browser.storage.local.set({
		newtaburl: ntumod,
		active: document.querySelector('#active').checked
		// sync: document.querySelector('#sync').checked
    });

	updateLocalStored();
}

function restoreOptions() {
	// Set stored values or defaults to options page
	function setNTU(result) {
      	document.querySelector('#newtaburl').value = result.newtaburl || 'about:home';
    }

	function setActive(result) {
		if (result.active != null) {
	      	document.querySelector('#active').checked = result.active;
		} else {
	    	document.querySelector('#active').checked = true;
		}
    }

	// function setSync(result) {
 //      	document.querySelector('#sync').checked = result.sync || false;
 //    }

	function onError(error) {
    	console.log(`error: ${error}`);
    }

    // Check storage for current values
	var getNTU = browser.storage.local.get('newtaburl');
	getNTU.then(setNTU, onError);

	var active = browser.storage.local.get('active');
	active.then(setActive, onError);

	// var sync = browser.storage.local.get('sync');
	// sync.then(setSync, onError);

	updateLocalStored();
}

function modSave(e) {
	if (((e.target.type === 'checkbox') &&
	     (storedValues[e.target.id] !== e.target.checked)) ||
	    ((e.target.type === 'text') &&
	     (storedValues[e.target.id] !== e.target.value))) {
			document.querySelector('#submitbutton').textContent = saveText;
			document.querySelector('#submitbutton').style.fontStyle = "normal";
			document.querySelector('#submitbutton').disabled = false;
	} else {
			document.querySelector('#submitbutton').innerText = settingsActiveText;
			document.querySelector('#submitbutton').style.fontStyle = "italic";
			document.querySelector('#submitbutton').disabled = true;
	}
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('#options').addEventListener('input', modSave)
document.querySelector('form').addEventListener('submit', saveOptions);

// Core UI interactions, layout toggles, and logging

function setTab (element, selectedTab) {
	const tabs = Array.prototype.slice.call(document.getElementsByClassName('tab'));
	tabs.forEach(function (tab) {
		tab.style.display = 'none';
	});
	document.getElementById(selectedTab).style.display = 'block';
	
	const tabButtons = document.getElementsByClassName('tabButton');
	for (const tabButton of tabButtons) {
		tabButton.classList.remove('btn-active');
	}
	element.classList.add('btn-active');
}

// Update UI visibility based on unlocks
function applyUnlocksUI () {
	if (gameData.unlocks.shop) {
		document.getElementById('shopTabButton').classList.remove('hidden');
	} else {
		document.getElementById('shopTabButton').classList.add('hidden');
	}
	
	if (gameData.unlocks.skills) {
		document.getElementById('skillTabButton').classList.remove('hidden');
	} else {
		document.getElementById('skillTabButton').classList.add('hidden');
	}
	
	if (gameData.unlocks.writing) {
		document.getElementById('writingTabButton').classList.remove('hidden');
		document.getElementById('workWritingSliderContainer').classList.remove('hidden');
	} else {
		document.getElementById('writingTabButton').classList.add('hidden');
		document.getElementById('workWritingSliderContainer').classList.add('hidden');
	}
}

function updateWorkWritingBalance (value) {
	gameData.workWritingBalance = parseInt(value);
	document.getElementById('workPercentage').textContent = 100 - gameData.workWritingBalance;
	document.getElementById('writingPercentage').textContent = gameData.workWritingBalance;
	if (typeof updateUI === 'function') updateUI();
}

function setLightDarkMode () {
	const body = document.getElementById('body');
	body.classList.contains('dark') ? body.classList.remove('dark') : body.classList.add('dark');
}

function logEvent (message) {
	const logContainer = document.getElementById('logContainer');
	if (!logContainer) return;
	const entry = document.createElement('div');
	entry.className = 'log-entry';
	const age = daysToYears(gameData.days);
	const day = String(getDay()).padStart(3, '0');
	entry.innerHTML = `<b style="color: #875F9A">[Age ${age}.${day} days]</b> ${message}`;
	logContainer.prepend(entry);
}

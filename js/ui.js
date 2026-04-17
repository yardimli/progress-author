// Core UI interactions, layout toggles, and logging

function setTab(element, selectedTab) {
	const tabs = Array.prototype.slice.call(document.getElementsByClassName('tab'));
	tabs.forEach(function (tab) {
		tab.style.display = 'none';
	});
	
	// Modified: store the selected tab element so we can reset its scroll position.
	const selectedTabElement = document.getElementById(selectedTab);
	selectedTabElement.style.display = 'block';
	
	const tabButtons = document.getElementsByClassName('tabButton');
	for (const tabButton of tabButtons) {
		tabButton.classList.remove('btn-active');
	}
	element.classList.add('btn-active');
	
	// Added: reset the main scrollable content area to the top whenever the tab changes.
	const scrollContainer = document.querySelector('.scroll-container');
	if (scrollContainer) {
		scrollContainer.scrollTop = 0;
	}
	
	// Added: also reset the tab itself in case it ever becomes independently scrollable.
	if (selectedTabElement) {
		selectedTabElement.scrollTop = 0;
	}
}

// Update UI visibility based on unlocks
function applyUnlocksUI() {
	// Toggle overlay visibility instead of hiding the tab buttons completely
	const shopOverlay = document.getElementById('shopLockedOverlay');
	if (shopOverlay) {
		shopOverlay.style.display = gameData.unlocks.shop ? 'none' : 'flex';
	}
	
	const skillsOverlay = document.getElementById('skillsLockedOverlay');
	if (skillsOverlay) {
		skillsOverlay.style.display = gameData.unlocks.skills ? 'none' : 'flex';
	}
	
	const writingOverlay = document.getElementById('writingLockedOverlay');
	if (writingOverlay) {
		writingOverlay.style.display = gameData.unlocks.writing ? 'none' : 'flex';
	}
	
	// The slider should still be hidden until writing is actually unlocked
	if (gameData.unlocks.writing) {
		document.getElementById('workWritingSliderContainer').classList.remove('hidden');
	} else {
		document.getElementById('workWritingSliderContainer').classList.add('hidden');
	}
}

function updateWorkWritingBalance(value) {
	gameData.workWritingBalance = parseInt(value);
	document.getElementById('workPercentage').textContent = 100 - gameData.workWritingBalance;
	document.getElementById('writingPercentage').textContent = gameData.workWritingBalance;
	if (typeof updateUI === 'function') updateUI();
}

function setLightDarkMode() {
	const body = document.getElementById('body');
	body.classList.contains('dark') ? body.classList.remove('dark') : body.classList.add('dark');
}

function logEvent(message) {
	const logContainer = document.getElementById('logContainer');
	if (!logContainer) return;
	const entry = document.createElement('div');
	entry.className = 'log-entry';
	const age = daysToYears(gameData.days);
	const day = String(getDay()).padStart(3, '0');
	entry.innerHTML = `<b style="color: #875F9A">[Age ${age}.${day} days]</b> ${message}`;
	logContainer.prepend(entry);
}

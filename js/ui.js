// Core UI interactions, layout toggles, and logging

// Added: Function to handle switching tabs on mobile layout
function switchMobileTab (tabId, btnElement) {
	// Hide all columns
	const columns = document.querySelectorAll('.panel-column');
	columns.forEach(col => col.classList.remove('active-mobile'));
	
	// Show the selected column
	const selectedCol = document.getElementById(tabId);
	if (selectedCol) {
		selectedCol.classList.add('active-mobile');
	}
	
	// Update active state on navigation buttons
	const navBtns = document.querySelectorAll('.mobile-nav-btn');
	navBtns.forEach(btn => btn.classList.remove('active'));
	
	if (btnElement) {
		btnElement.classList.add('active');
	}
}

// Update UI visibility based on unlocks
function applyUnlocksUI () {
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

// Added: Function to quickly set the writing balance from the overlay button
function setInitialWritingBalance () {
	updateWorkWritingBalance(30);
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

// Added: Event listener for author image click to handle mobile badge modal
document.addEventListener('DOMContentLoaded', (event) => {
	const authorImage = document.getElementById('authorImage');
	if (authorImage) {
		authorImage.addEventListener('click', () => {
			if (window.innerWidth <= 768) {
				showMobileBadgeModal();
			}
		});
	}
});

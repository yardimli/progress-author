// Core UI interactions, layout toggles, and logging

function switchMobileTab (tabId, btnElement) {
	const columns = document.querySelectorAll('.panel-column');
	columns.forEach(col => col.classList.remove('active-mobile'));
	
	const selectedCol = document.getElementById(tabId);
	if (selectedCol) {
		selectedCol.classList.add('active-mobile');
	}
	
	const navBtns = document.querySelectorAll('.mobile-nav-btn');
	navBtns.forEach(btn => btn.classList.remove('active'));
	
	if (btnElement) {
		btnElement.classList.add('active');
	}
}

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
	const age = daysToYears(gameData.days);
	const day = String(getDay()).padStart(3, '0');
	const timestampedMessage = `<b style="color: #875F9A">[Age ${age}.${day} days]</b> ${message}`;
	
	gameData.logHistory.unshift(timestampedMessage);
	
	if (gameData.logHistory.length > 200) {
		gameData.logHistory.pop();
	}
}

const authorImageContainer = document.getElementById('authorImageContainer');
if (authorImageContainer) {
	authorImageContainer.addEventListener('click', () => {
		showAuthorProfileModal();
	});
}

function switchProfileTab (tabId, btnElement) {
	const contents = document.querySelectorAll('.profile-modal-tab-content');
	contents.forEach(content => content.classList.remove('active'));
	
	const buttons = document.querySelectorAll('.profile-modal-tabs .tab-btn');
	buttons.forEach(btn => btn.classList.remove('active'));
	
	const selectedContent = document.getElementById(`profileTab-${tabId}`);
	if (selectedContent) {
		selectedContent.classList.add('active');
	}
	
	if (btnElement) {
		btnElement.classList.add('active');
	}
	
	if (tabId === 'chart') {
		renderAuthorChart();
	}
}

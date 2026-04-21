// Helper functions, formatting, math

function getBaseLog (x, y) {
	return Math.log(y) / Math.log(x);
}

function daysToYears (days) {
	return Math.floor(days / 365);
}

function getDay () {
	return Math.floor(gameData.days - daysToYears(gameData.days) * 365);
}

// Format numbers with thousand separators up to 1000, then use suffixes
function format (number, decimals = 2) {
	// 1. Handle numbers below 1000 (now showing decimals)
	if (Math.abs(number) < 1000) {
		// Check if rounding to the specified decimals bumps it up to 1000
		const fixedNum = Number(Math.abs(number).toFixed(decimals));
		
		if (fixedNum < 1000) {
			// Returns with exact decimals (e.g., 5 becomes "5,00")
			return number.toFixed(decimals).replace('.', ',');
		}
		// If it rounded to 1000 (e.g., 999.996), let it fall through to become "1,00K"
		number = number < 0 ? -fixedNum : fixedNum;
	}
	
	const tier = Math.floor(Math.log10(Math.abs(number)) / 3);
	const suffix = units[tier] || '';
	const scale = Math.pow(10, tier * 3);
	const scaled = number / scale;
	
	// 2. Format with fixed decimals (keeps the zeros, e.g., "1.00" or "5.00")
	const formattedScaled = scaled.toFixed(decimals);
	
	// 3. Replace dot with comma
	return formattedScaled.replace('.', ',') + suffix;
}

function formatMoney (money, element) {
	element.innerHTML = `<span>$${format(money)}</span>`;
	element.style.color = '#219ebc';
}

function getElementsByClass (className) {
	return document.getElementsByClassName(removeSpaces(className));
}

function removeSpaces (string) {
	return string.replace(/ /g, '');
}

function getKeyOfLowestValueFromDict (dict) {
	const values =[];
	for (const key in dict) {
		values.push(dict[key]);
	}
	values.sort(function (a, b) { return a - b; });
	
	for (const key in dict) {
		if (dict[key] === values[0]) {
			return key;
		}
	}
}

// Added: Helper function to build categories from base data
function buildCategories (baseData) {
	const categories = {};
	for (const key in baseData) {
		const item = baseData[key];
		const cat = item.category;
		if (cat) {
			if (!categories[cat]) {
				categories[cat] = [];
			}
			categories[cat].push(key);
		}
	}
	return categories;
}

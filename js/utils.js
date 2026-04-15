// Helper functions, formatting, math

function getBaseLog(x, y) {
	return Math.log(y) / Math.log(x);
}

function daysToYears(days) {
	return Math.floor(days / 365);
}

function getDay() {
	return Math.floor(gameData.days - daysToYears(gameData.days) * 365);
}

// Format numbers with thousand separators up to 10,000, then use suffixes
function format(number, decimals = 1) {
	// 1. Handle numbers below 1000 (no decimals should be shown)
	if (Math.abs(number) < 1000) {
		const rounded = Math.round(number);
		
		// If rounding didn't bump it up to 1000, just return the whole number
		if (Math.abs(rounded) < 1000) {
			return rounded.toString();
		}
		// If it rounded to 1000 (e.g., 999.6), let it fall through to become "1K"
		number = rounded;
	}
	
	const tier = Math.floor(Math.log10(Math.abs(number)) / 3);
	const suffix = units[tier] || '';
	const scale = Math.pow(10, tier * 3);
	const scaled = number / scale;
	
	let formattedScaled;
	
	// 2. Pad with zeros if decimals > 1, otherwise strip trailing zeros
	if (decimals > 1) {
		// Keeps the zeros (e.g., "1.00", "1.20")
		formattedScaled = scaled.toFixed(decimals);
	} else {
		// Strips trailing zeros for 1 or 0 decimals (e.g., "1", "1.2")
		formattedScaled = Number(scaled.toFixed(decimals)).toString();
	}
	
	// 3. Replace dot with comma
	return formattedScaled.replace('.', ',') + suffix;
}


function formatMoney(money, element) {
	element.innerHTML = `<span>$${format(money)}</span>`;
	element.style.color = "#219ebc";
}

function getElementsByClass(className) {
	return document.getElementsByClassName(removeSpaces(className));
}

function removeSpaces(string) {
	return string.replace(/ /g, "");
}

function getKeyOfLowestValueFromDict(dict) {
	let values = [];
	for (let key in dict) {
		values.push(dict[key]);
	}
	values.sort(function(a, b){return a - b;});
	
	for (let key in dict) {
		if (dict[key] == values[0]) {
			return key;
		}
	}
}

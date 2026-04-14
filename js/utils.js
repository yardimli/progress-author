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
	const formatWithCommas = (num) => {
		const numStr = Number(num.toFixed(decimals)).toString();
		let parts = numStr.split('.');
		let intPart = parts[0];
		const fracPart = parts.length > 1 ? '.' + parts[1] : '';
		
		let sign = '';
		if (intPart[0] === '-') {
			sign = '-';
			intPart = intPart.slice(1);
		}
		
		let formattedInt = '';
		while (intPart.length > 3) {
			formattedInt = ',' + intPart.slice(-3) + formattedInt;
			intPart = intPart.slice(0, -3);
		}
		
		return sign + intPart + formattedInt + fracPart;
	};
	
	if (number < 10000) {
		return formatWithCommas(number);
	}
	
	const tier = Math.floor(Math.log10(number) / 3);
	
	if (tier === 0) return formatWithCommas(number);
	
	const suffix = units[tier];
	const scale = Math.pow(10, tier * 3);
	const scaled = number / scale;
	
	return scaled.toFixed(decimals) + suffix;
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

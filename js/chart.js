// js/chart.js

/**
 * Draws a custom chart on a canvas element.
 * @param {string} canvasId The ID of the canvas element.
 * @param {Array<object>} chartData The array of data points to plot.
 */
function drawAuthorChart (canvasId, chartData) {
	const canvas = document.getElementById(canvasId);
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	
	// 1. DPI Scaling for crispness
	const dpr = window.devicePixelRatio || 1;
	const rect = canvas.getBoundingClientRect();
	canvas.width = rect.width * dpr;
	canvas.height = rect.height * dpr;
//	ctx.scale(dpr, dpr);
	const { width, height } = rect;
	
	// 2. Chart Configuration
	const padding = { top: 30, right: 60, bottom: 50, left: 70 };
	const chartWidth = width - padding.left - padding.right;
	const chartHeight = height - padding.top - padding.bottom;
	const colors = {
		background: '#fff',
		grid: '#eee',
		axis: '#ccc',
		text: '#555',
		income: '#4CAF50',
		expense: '#f44336',
		royalties: '#219ebc',
		words: '#ffc107'
	};
	// Dark mode check
	if (document.body.classList.contains('dark')) {
		Object.assign(colors, {
			background: '#1a1a1a',
			grid: '#333',
			axis: '#555',
			text: '#aaa'
		});
	}
	
	// 3. Clear Canvas
	ctx.fillStyle = colors.background;
	ctx.fillRect(0, 0, width, height);
	
	// 4. Data Analysis
	const minAge = 20;
	const maxAge = 70;
	let maxMoney = 1000; // Minimum value to avoid division by zero
	let maxWords = 50000; // Minimum value
	
	chartData.forEach(d => {
		maxMoney = Math.max(maxMoney, d.income, d.expense, d.royalties);
		maxWords = Math.max(maxWords, d.wordsWritten);
	});
	
	// Make the max values "nice" numbers for the axes
	maxMoney = getNiceMaxValue(maxMoney);
	maxWords = getNiceMaxValue(maxWords);
	
	// 5. Helper Functions for coordinates
	const getX = (age) => padding.left + ((age - minAge) / (maxAge - minAge)) * chartWidth;
	const getYMoney = (value) => padding.top + chartHeight - (value / maxMoney) * chartHeight;
	const getYWords = (value) => padding.top + chartHeight - (value / maxWords) * chartHeight;
	
	// 6. Draw Grid and Axes
	ctx.lineWidth = 1;
	ctx.strokeStyle = colors.grid;
	ctx.font = '10px Georgia';
	ctx.fillStyle = colors.text;
	ctx.textAlign = 'right';
	
	// Horizontal grid lines and Left Y-axis labels (for money)
	const moneyTicks = 5;
	for (let i = 0; i <= moneyTicks; i++) {
		const value = (maxMoney / moneyTicks) * i;
		const y = getYMoney(value);
		ctx.beginPath();
		ctx.moveTo(padding.left, y);
		ctx.lineTo(padding.left + chartWidth, y);
		ctx.stroke();
		ctx.fillText(format(value, 0), padding.left - 8, y + 3);
	}
	
	// Right Y-axis labels (for words)
	ctx.textAlign = 'left';
	for (let i = 0; i <= moneyTicks; i++) {
		const value = (maxWords / moneyTicks) * i;
		const y = getYWords(value);
		ctx.fillText(format(value, 0), padding.left + chartWidth + 8, y + 3);
	}
	
	// Vertical grid lines and X-axis labels (for age)
	ctx.textAlign = 'center';
	for (let age = minAge; age <= maxAge; age++) {
		const x = getX(age);
		// Major lines with labels (every 5 years)
		if (age % 5 === 0) {
			ctx.strokeStyle = colors.axis;
			ctx.beginPath();
			ctx.moveTo(x, padding.top);
			ctx.lineTo(x, padding.top + chartHeight);
			ctx.stroke();
			ctx.fillText(age, x, height - padding.bottom + 20);
		} else { // Minor lines (every year)
			ctx.strokeStyle = colors.grid;
			ctx.beginPath();
			ctx.moveTo(x, padding.top + chartHeight);
			ctx.lineTo(x, padding.top + chartHeight + 5); // small tick
			ctx.stroke();
		}
		
		// Unlabeled month lines
		if (age < maxAge) {
			for (let month = 1; month < 12; month++) {
				const monthX = getX(age + month / 12);
				ctx.strokeStyle = colors.grid;
				ctx.globalAlpha = 0.5;
				ctx.beginPath();
				ctx.moveTo(monthX, padding.top + chartHeight);
				ctx.lineTo(monthX, padding.top + chartHeight + 3); // smaller tick
				ctx.stroke();
				ctx.globalAlpha = 1.0;
			}
		}
	}
	
	// Axis titles
	ctx.save();
	ctx.fillStyle = colors.text;
	ctx.font = '12px Georgia';
	ctx.textAlign = 'center';
	ctx.fillText('Age', padding.left + chartWidth / 2, height - 10);
	
	ctx.rotate(-Math.PI / 2);
	ctx.fillText('Money ($)', -(padding.top + chartHeight / 2), 20);
	ctx.fillText('Words', -(padding.top + chartHeight / 2), width - 20);
	ctx.restore();
	
	// 7. Draw Data Lines
	const datasets = [
		{ dataKey: 'income', color: colors.income, yFunc: getYMoney },
		{ dataKey: 'expense', color: colors.expense, yFunc: getYMoney },
		{ dataKey: 'royalties', color: colors.royalties, yFunc: getYMoney },
		{ dataKey: 'wordsWritten', color: colors.words, yFunc: getYWords }
	];
	
	ctx.lineWidth = 2;
	datasets.forEach(dataset => {
		if (chartData.length > 0) {
			ctx.strokeStyle = dataset.color;
			ctx.beginPath();
			chartData.forEach((d, i) => {
				const x = getX(d.age);
				const y = dataset.yFunc(d[dataset.dataKey]);
				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});
			ctx.stroke();
		}
	});
	
	// 8. Draw Legend
	const legendItems = [
		{ label: 'Income', color: colors.income },
		{ label: 'Expense', color: colors.expense },
		{ label: 'Royalties', color: colors.royalties },
		{ label: 'Words', color: colors.words }
	];
	let legendX = padding.left;
	ctx.font = '12px Georgia';
	ctx.textAlign = 'left';
	legendItems.forEach(item => {
		ctx.fillStyle = item.color;
		ctx.fillRect(legendX, padding.top - 20, 10, 10);
		ctx.fillStyle = colors.text;
		ctx.fillText(item.label, legendX + 15, padding.top - 12);
		legendX += ctx.measureText(item.label).width + 35;
	});
}

/**
 * Helper to get a "nice" rounded max value for an axis.
 * @param {number} value The maximum value from the data.
 * @returns {number} A rounded-up value for the axis maximum.
 */
function getNiceMaxValue (value) {
	if (value <= 0) return 10;
	const exponent = Math.floor(Math.log10(value));
	const powerOf10 = Math.pow(10, exponent);
	const mantissa = value / powerOf10; // a value between 1 and 10
	
	let niceMantissa;
	if (mantissa <= 1) niceMantissa = 1;
	else if (mantissa <= 1.5) niceMantissa = 1.5;
	else if (mantissa <= 2) niceMantissa = 2;
	else if (mantissa <= 3) niceMantissa = 3;
	else if (mantissa <= 5) niceMantissa = 5;
	else niceMantissa = 10;
	
	return niceMantissa * powerOf10;
}

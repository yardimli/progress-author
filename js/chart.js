// CSS-pixel chart coordinates are scaled once for high-DPI screens.
let authorChartObserver;
let authorChartFrame = 0;
function requestAuthorChartDraw() {
    if (authorChartFrame) return;
    authorChartFrame = requestAnimationFrame(() => {
        authorChartFrame = 0;
        drawAuthorChart('authorChart', gameData.monthlyChartData);
    });
}
function observeAuthorChart() {
    if (authorChartObserver) return;
    const canvas = document.getElementById('authorChart');
    if (!canvas) return;
    authorChartObserver = new ResizeObserver(requestAuthorChartDraw);
    authorChartObserver.observe(canvas.parentElement);
    window.addEventListener('resize', requestAuthorChartDraw);
}
function getChartRange(chartData) {
    const data = chartData.filter(d => Number.isFinite(d.age)).slice().sort((a, b) => a.age - b.age);
    const minAge = data.length ? Math.floor(data[0].age) : 20;
    const maxAge = Math.max(minAge + 1, data.length ? Math.ceil(data[data.length - 1].age) : 21);
    let money = 100, words = 1000;
    for (const point of data) {
        for (const key of ['income', 'expense', 'royalties']) money = Math.max(money, Number(point[key]) || 0);
        words = Math.max(words, Number(point.wordsWritten) || 0);
    }
    return { data, minAge, maxAge, maxMoney: getNiceMaxValue(money), maxWords: getNiceMaxValue(words) };
}
function drawAuthorChart(canvasId, chartData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (width < 100 || height < 100) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(canvas);
    const color = name => css.getPropertyValue(name).trim();
    const compact = width < 500;
    const pad = { top: 32, right: compact ? 44 : 64, bottom: 36, left: compact ? 48 : 66 };
    const w = width - pad.left - pad.right, h = height - pad.top - pad.bottom;
    const { data, minAge, maxAge, maxMoney, maxWords } = getChartRange(chartData);
    const x = age => pad.left + (age - minAge) / (maxAge - minAge) * w;
    const y = (value, maximum) => pad.top + h - Math.max(0, Number(value) || 0) / maximum * h;
    const number = value => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
    const text = color('--journal-muted');
    ctx.fillStyle = color('--chart-paper'); ctx.fillRect(0, 0, width, height);
    ctx.font = `${compact ? 10 : 12}px Georgia`;
    ctx.textBaseline = 'middle'; ctx.fillStyle = text;
    ctx.textAlign = 'left'; ctx.fillText('Monthly $', pad.left, 13);
    ctx.textAlign = 'right'; ctx.fillText('Words / month', width - pad.right, 13);
    const ticks = compact ? 3 : 5;
    for (let i = 0; i <= ticks; i++) {
        const yy = pad.top + h - h * i / ticks;
        ctx.strokeStyle = color('--chart-grid'); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad.left, yy); ctx.lineTo(pad.left + w, yy); ctx.stroke();
        ctx.fillStyle = text;
        ctx.textAlign = 'right'; ctx.fillText(number(maxMoney * i / ticks), pad.left - 8, yy);
        ctx.textAlign = 'left'; ctx.fillText(number(maxWords * i / ticks), pad.left + w + 8, yy);
    }
    const ageTicks = Math.max(2, Math.min(6, Math.floor(w / 85)));
    ctx.textAlign = 'center';
    for (let i = 0; i <= ageTicks; i++) {
        const age = minAge + (maxAge - minAge) * i / ageTicks;
        ctx.fillText(`Age ${Number(age.toFixed(1))}`, x(age), height - 15);
    }
    const series = [
        ['income', '--chart-income', maxMoney, []],
        ['expense', '--chart-expense', maxMoney, [5, 4]],
        ['royalties', '--chart-royalties', maxMoney, [2, 3]],
        ['wordsWritten', '--chart-words', maxWords, [8, 3, 2, 3]]
    ];
    ctx.save(); ctx.beginPath(); ctx.rect(pad.left - 3, pad.top - 3, w + 6, h + 6); ctx.clip();
    for (const [key, token, maximum, dash] of series) {
        ctx.strokeStyle = color(token); ctx.fillStyle = color(token); ctx.lineWidth = 2;
        ctx.setLineDash(dash); ctx.beginPath();
        data.forEach((point, i) => {
            if (i === 0) ctx.moveTo(x(point.age), y(point[key], maximum));
            else ctx.lineTo(x(point.age), y(point[key], maximum));
        });
        ctx.stroke();
        if (data.length === 1) {
            ctx.beginPath(); ctx.arc(x(data[0].age), y(data[0][key], maximum), 3, 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.restore();
    if (!data.length) {
        ctx.fillStyle = color('--chart-paper'); ctx.fillRect(pad.left, pad.top + h / 2 - 32, w, 64);
        ctx.fillStyle = text; ctx.textAlign = 'center';
        ctx.fillText('Your first chapter is still unfolding.', pad.left + w / 2, pad.top + h / 2 - 10);
        ctx.fillText('Return after one game month.', pad.left + w / 2, pad.top + h / 2 + 12);
    }
    const summary = document.getElementById('chartSummary');
    if (summary) {
        const last = data[data.length - 1];
        summary.textContent = last
            ? `${data.length} months recorded · Latest month: $${number(last.income || 0)} income, $${number(last.expense || 0)} expenses, $${number(last.royalties || 0)} royalties, ${number(last.wordsWritten || 0)} words. Royalties are included in income.`
            : 'Monthly income, expenses, royalties and words will appear as your career develops.';
    }
}
function getNiceMaxValue(value) {
    if (!Number.isFinite(value) || value <= 0) return 10;
    const power = 10 ** Math.floor(Math.log10(value));
    return [1, 1.5, 2, 3, 5, 10].find(n => n >= value / power) * power;
}

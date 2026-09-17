// Apply before the game renders. Preference is independent of save resets.
const deviceTheme = window.matchMedia('(prefers-color-scheme: dark)');
let gameThemePreference = 'system';
try {
    const saved = localStorage.getItem('authorsJourneyTheme');
    if (['light', 'dark', 'system'].includes(saved)) gameThemePreference = saved;
} catch (_) { /* Storage can be unavailable in private browsing. */ }
function syncThemeControl() {
    const control = document.getElementById('themePreference');
    if (control) control.value = gameThemePreference;
}
function applyGameTheme() {
    const dark = gameThemePreference === 'dark' || (gameThemePreference === 'system' && deviceTheme.matches);
    document.body.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    syncThemeControl();
    if (typeof requestAuthorChartDraw === 'function') requestAuthorChartDraw();
}
function setGameTheme(preference) {
    if (!['system', 'light', 'dark'].includes(preference)) return;
    gameThemePreference = preference;
    try { localStorage.setItem('authorsJourneyTheme', preference); } catch (_) {}
    applyGameTheme();
}
deviceTheme.addEventListener('change', () => {
    if (gameThemePreference === 'system') applyGameTheme();
});
applyGameTheme();
document.addEventListener('DOMContentLoaded', syncThemeControl, { once: true });

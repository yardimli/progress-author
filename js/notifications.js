// Durable, passive notifications. Rendering never opens a dialog or moves focus.
function addGameNotification(entry) {
    gameData.notifications ||= [];
    if (entry.type !== 'book' && gameData.notifications.some(n => n.type === entry.type && n.name === entry.name && !n.read)) return;
    gameData.notifications.unshift({ ...entry, read: false, age: gameData.days });
    gameData.notifications = gameData.notifications.slice(0, 150);
    if (typeof isCatchingUp === 'undefined' || !isCatchingUp) updateNotificationBadge();
}

function updateNotificationBadge() {
    const count = (gameData.notifications || []).filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');
    if (badge && badge.textContent !== String(count)) badge.textContent = String(count);
    const button = document.getElementById('notificationButton');
    if (button) button.classList.toggle('has-unread', count > 0);
}

function openNotifications() {
    renderNotifications();
    const modal = document.getElementById('notificationsModal');
    modal.style.display = 'flex';
    modal.onkeydown = event => {
        if (event.key === 'Escape') { event.preventDefault(); closeNotifications(); }
        if (event.key === 'Tab') {
            const buttons = [...modal.querySelectorAll('button:not(:disabled)')];
            const first = buttons[0], last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    };
    document.getElementById('closeNotificationsButton').focus();
}

function closeNotifications() {
    document.getElementById('notificationsModal').style.display = 'none';
    document.getElementById('notificationButton').focus();
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    list.replaceChildren();
    if (!gameData.notifications?.length) {
        const empty = document.createElement('p');
        empty.textContent = 'Your unlocks, achievements and published books will appear here. Your journey keeps moving while you read.';
        list.append(empty);
    }
    for (const entry of gameData.notifications || []) {
        const row = document.createElement('article'); row.className = 'notification-entry';
        const title = document.createElement('h3');
        title.textContent = `${entry.type === 'book' ? 'Published' : entry.type === 'badge' ? 'Achievement' : entry.type === 'summary' ? 'Journal' : 'Unlocked'} · ${entry.name}`;
        const detail = document.createElement('p');
        const item = gameData.itemData[entry.name];
        detail.textContent = entry.message || (entry.type === 'book' ? `${entry.quality.toFixed(1)}% quality · +$${format(entry.royalty)}/day ${BALANCE.writing.salesEnabled ? 'at launch, declining over two years' : 'in royalties'}` :
            item ? `${item.getEffectDescription()} · $${format(getPurchasePrice(item.name))} upfront · $${format(item.getExpense())}/day upkeep` : 'Ready when you are. View the details or choose your next step.');
        row.append(title, detail);
        const button = (label, action) => {
            const el = document.createElement('button'); el.className = 'btn'; el.textContent = label;
            el.onclick = action; row.append(el);
        };
        if (entry.type !== 'summary') button('Details', () => {
            closeNotifications();
            if (entry.type === 'book') showBookFinishedModal(entry.bookId, entry.quality, entry.royalty, entry);
            else if (entry.type === 'badge') {
                const id = Object.keys(badgeBaseData).find(id => badgeBaseData[id].name === entry.name);
                if (id) showBadgeModal(id);
            } else {
                const data = (entry.type === 'job' ? jobBaseData : entry.type === 'skill' ? skillBaseData : entry.type === 'item' ? itemBaseData : potionsBaseData)[entry.name];
                if (data) showModal({ src: `img/${data.filefolder}256/${data.filename.replace('.png', '.jpg')}`, getAttribute: key => key === 'data-name' ? entry.name : entry.type });
            }
        });
        if (['job', 'skill', 'item'].includes(entry.type) && gameData.unlocks[entry.name]) {
            button(entry.type === 'job' ? 'Work here' : entry.type === 'skill' ? 'Train skill' : getPurchasePrice(entry.name) ? 'Buy & equip' : 'Equip', () => {
                if (!gameData.unlocks[entry.name]) return;
                if (entry.type !== 'item') setTask(entry.name);
                else if (item.baseData.category === 'Properties') setProperty(entry.name);
                else if (item.baseData.category === 'Transportation') setTransportation(entry.name);
                else if (!gameData.currentMisc.includes(item)) setMisc(entry.name);
                closeNotifications(); updateUI();
            });
        }
        if (entry.type === 'book' && !gameData.currentBook) {
            button('Write another in this genre', () => {
                if (gameData.currentBook || !isAlive()) return;
                gameData.selectedGenre = booksBaseData[entry.bookId]?.genre || gameData.selectedGenre;
                closeNotifications(); startWritingBook();
            });
        }
        entry.read = true;
        list.append(row);
    }
    updateNotificationBadge();
}

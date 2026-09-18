const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame } = require('./helpers/headless-game.cjs');
function game() {
    const g = createGame({ profile: 'career' });
    g.booksBaseData = { example: { title: 'Test book', genre: 'Romance', wordCount: 100 } };
    g.sceneTypesBaseData = { Romance: { Dialogue: {} } };
    g.gameData.selectedGenre = 'Romance';
    g.gameData.workWritingBalance = 50;
    g.gameData.currentJob.increaseXp = () => {};
    g.gameData.currentSkill.increaseXp = () => {};
    return g;
}
function start(g, editor = 'none', fallback = 'pause') {
    g.gameData.draftPlan = { approach: 'balanced', editor, editorFallback: fallback };
    g.setBookQueue('1'); g.startQueuedBook();
}
test('sales integrate to a finite total and stop exactly at the end of the contract', () => {
    const g = game(), book = { sales: { startDay: 10, duration: 730, launchRate: 100 } };
    assert.equal(g.bookSalesRate(book, 10), 100);
    assert.equal(g.bookSalesRate(book, 375), 50);
    assert.equal(g.bookSalesRate(book, 740), 0);
    assert.equal(g.bookSalesBetween(book, 0, 10000), 36500);
    assert.ok(Math.abs(g.bookSalesBetween(book, 0, 375) + g.bookSalesBetween(book, 375, 10000) - 36500) < 1e-8);
});
test('publication earns audience once and switching jobs cannot reprice existing books', () => {
    const g = game(); start(g); g.finishBook();
    const book = g.gameData.completedBooks[0], audience = g.gameData.readership;
    assert.ok(audience > 0); assert.equal(book.lifetimeReceipts, 0);
    const rate = g.bookSalesRate(book);
    g.gameData.currentJob = g.gameData.taskData['Commissioned Author'];
    g.gameData.workWritingBalance = 100;
    assert.equal(g.bookSalesRate(book), rate);
    g.finishBook(); assert.equal(g.gameData.readership, audience);
    g.saveGameData(); g.loadGameData();
    assert.equal(g.gameData.readership, audience);
    assert.equal(g.bookSalesRate(g.gameData.completedBooks[0]), rate);
});
test('online and away simulation agree across publication and a year boundary', () => {
    const live = game(), away = game();
    for (const g of [live, away]) {
        g.gameData.days = 365 * 21 - 2;
        start(g);
        g.gameData.lastProgressAt = 1000000; g.gameData.offlineEligible = true;
    }
    for (let i = 0; i < 100; i++) live.advanceWritingEconomy(.1);
    away.advanceAwayProgress(1010000);
    assert.equal(live.gameData.booksPublished, away.gameData.booksPublished);
    assert.ok(Math.abs(live.gameData.coins - away.gameData.coins) < 1e-6);
    assert.ok(Math.abs(live.gameData.completedBooks[0].lifetimeReceipts - away.gameData.completedBooks[0].lifetimeReceipts) < 1e-6);
    const coins = away.gameData.coins;
    away.advanceAwayProgress(1010000);
    assert.equal(away.gameData.coins, coins);
});
test('editor waits without blocking work, uses a locked quote and charges exactly once', () => {
    const g = game(); start(g, 'paid');
    const fee = g.gameData.manuscript.editorFee;
    g.gameData.wordsWritten = g.getBookLength();
    g.finishBook();
    assert.equal(g.gameData.manuscript.awaitingEditor, true);
    assert.equal(g.gameData.booksPublished, 0);
    assert.equal(g.getWritingSpeed(), 0);
    g.gameData.readership = 10000;
    g.saveGameData(); g.loadGameData();
    assert.equal(g.gameData.manuscript.editorFee, fee);
    g.gameData.coins = fee;
    g.finishBook(); g.finishBook();
    assert.equal(g.gameData.booksPublished, 1);
    assert.equal(g.gameData.coins, 0);
    assert.equal(g.gameData.journalFinance.filter(row => row.kind === 'purchase').length, 1);
    assert.equal(g.gameData.completedBooks[0].story.editorPaid, true);
});
test('unaffordable editing can fall back to a free release without charges', () => {
    const g = game(); start(g, 'paid', 'free'); g.finishBook();
    assert.equal(g.gameData.booksPublished, 1);
    assert.equal(g.gameData.coins, 0);
    assert.equal(g.gameData.completedBooks[0].story.editor, 'none');
});
test('waiting editor eventually gets paid from work and explicit free publication is available', () => {
    const g = game(); start(g, 'paid'); g.gameData.wordsWritten = g.getBookLength(); g.finishBook();
    g.advanceWritingEconomy(10);
    assert.equal(g.gameData.booksPublished, 1);
    const h = game(); start(h, 'paid'); h.finishBook(); h.publishWithoutEditor();
    assert.equal(h.gameData.booksPublished, 1);
    assert.equal(h.gameData.coins, 0);
});
test('legacy royalty conversion preserves initial income, bounds its tail and does not repeat', () => {
    const g = game();
    g.gameData.bookSalesVersion = 0;
    g.gameData.completedBooks = [{ id: 'example', quality: 30, royalties: 8 }];
    g.gameData.royalties = 10;
    g.migrateBookSales();
    assert.equal(g.gameData.royalties, 10);
    assert.equal(g.gameData.completedBooks.length, 2);
    assert.ok(g.localStorage.getItem(g.gameSaveKey() + '-before-book-sales-1'));
    g.gameData.days += 365;
    g.migrateBookSales();
    assert.equal(g.gameData.royalties, 0);
    assert.equal(g.gameData.completedBooks.length, 2);
});

test('sales and publication handle the existing lifespan boundary without changing retirement rules', () => {
    const g = game(); start(g);
    const remainingDays = g.getBookLength() / g.getWritingSpeed();
    g.gameData.days = g.getLifespan() - remainingDays;
    g.advanceWritingEconomy(remainingDays / g.getGameSpeed() + 5);
    assert.equal(g.gameData.days, g.getLifespan());
    assert.equal(g.gameData.booksPublished, 1);
    assert.equal(g.gameData.completedBooks[0].lifetimeReceipts, 0);
});

test('legacy preview saves missing the new version field migrate instead of receiving fresh-save defaults', () => {
    const g = game();
    const saved = JSON.parse(JSON.stringify(g.gameData));
    delete saved.bookSalesVersion;
    saved.completedBooks = [{ id: 'example', quality: 20, royalties: 5 }]; saved.royalties = 5;
    g.localStorage.setItem(g.gameSaveKey(), JSON.stringify(saved));
    g.loadGameData();
    assert.equal(g.gameData.completedBooks[0].sales.duration, 365);
    assert.equal(g.gameData.royalties, 5);
    g.gameData.days += 365;
    g.saveGameData(); g.loadGameData();
    assert.equal(g.gameData.royalties, 0);
});

test('continuous paid editing prepares a new quote for each book and preserves its preset on reload', () => {
    const g = game(); g.gameData.coins = 1000000;
    start(g, 'paid'); g.setBookQueue('continuous');
    for (let i = 0; i < 3; i++) g.finishBook();
    assert.equal(g.gameData.booksPublished, 3);
    assert.equal(g.gameData.journalFinance.filter(row => row.kind === 'purchase').length, 3);
    assert.equal(g.gameData.manuscript.editorPaid, false);
    assert.equal(g.gameData.manuscript.editor, 'paid');
    const quote = g.gameData.manuscript.editorFee;
    g.saveGameData(); g.loadGameData();
    assert.equal(g.gameData.manuscript.editorFee, quote);
    assert.equal(g.gameData.queueMode, 'continuous');
});

'use strict';

// CR#15 — Sistema de Temas (Marcos Winicios)
// O cenario muda de tonalidade conforme a pontuacao avanca:
// 0-24 = day, 25-49 = sunset, 50+ = night.

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

test('CR#15: themeForSteps retorna "day" para steps < 25', function () {
    var ctx = loader.freshProject();
    assert.strictEqual(ctx.game.themeForSteps(0), 'day');
    assert.strictEqual(ctx.game.themeForSteps(10), 'day');
    assert.strictEqual(ctx.game.themeForSteps(24), 'day');
});

test('CR#15: themeForSteps retorna "sunset" para 25 <= steps < 50', function () {
    var ctx = loader.freshProject();
    assert.strictEqual(ctx.game.themeForSteps(25), 'sunset');
    assert.strictEqual(ctx.game.themeForSteps(35), 'sunset');
    assert.strictEqual(ctx.game.themeForSteps(49), 'sunset');
});

test('CR#15: themeForSteps retorna "night" para steps >= 50', function () {
    var ctx = loader.freshProject();
    assert.strictEqual(ctx.game.themeForSteps(50), 'night');
    assert.strictEqual(ctx.game.themeForSteps(120), 'night');
});

test('CR#15: themeColor retorna strings de cor validas', function () {
    var ctx = loader.freshProject();
    assert.match(ctx.game.themeColor('day'), /^#[0-9a-fA-F]{3,8}$/);
    assert.match(ctx.game.themeColor('sunset'), /^#[0-9a-fA-F]{3,8}$/);
    assert.match(ctx.game.themeColor('night'), /^#[0-9a-fA-F]{3,8}$/);
});

test('CR#15: themeAlpha cresce conforme o tema escurece', function () {
    var ctx = loader.freshProject();
    var day = ctx.game.themeAlpha('day');
    var sunset = ctx.game.themeAlpha('sunset');
    var night = ctx.game.themeAlpha('night');
    assert.strictEqual(day, 0, 'dia nao aplica overlay');
    assert.ok(sunset > day, 'entardecer > dia');
    assert.ok(night > sunset, 'noite > entardecer');
    assert.ok(night <= 1, 'alpha permanece no intervalo [0,1]');
});

test('CR#15: HUD.ThemeOverlay atualiza game.data.theme baseado em steps', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var overlay = new ctx.game.HUD.ThemeOverlay();

    ctx.game.data.steps = 10;
    overlay.update();
    assert.strictEqual(ctx.game.data.theme, 'day');

    ctx.game.data.steps = 30;
    overlay.update();
    assert.strictEqual(ctx.game.data.theme, 'sunset');

    ctx.game.data.steps = 80;
    overlay.update();
    assert.strictEqual(ctx.game.data.theme, 'night');
});

test('CR#15: Play reseta tema para "day" ao iniciar nova partida', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.game.data.theme = 'night';
    ctx.me.state.change(ctx.me.state.PLAY);
    assert.strictEqual(ctx.game.data.theme, 'day', 'tema reseta ao entrar no Play');
});

test('CR#15: HUD.ThemeOverlay.draw chama save e restore para proteger o estado do renderer', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var overlay = new ctx.game.HUD.ThemeOverlay();

    ctx.me.state.change(ctx.me.state.PLAY);
    ctx.game.data.theme = 'night';

    var calls = [];
    var mockRenderer = {
        save: function () { calls.push('save'); },
        setColor: function (c) { calls.push('setColor:' + c); },
        setGlobalAlpha: function (a) { calls.push('setGlobalAlpha:' + a); },
        fillRect: function (x, y, w, h) { calls.push('fillRect'); },
        restore: function () { calls.push('restore'); }
    };

    overlay.draw(mockRenderer);

    assert.deepStrictEqual(calls, [
        'save',
        'setColor:#0b1a3a',
        'setGlobalAlpha:0.45',
        'fillRect',
        'restore'
    ], 'deve chamar save e restore para proteger o renderer de poluicao de cor');
});

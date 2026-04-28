'use strict';

// CR#2 — Botao de Mute (Carla Mezzomo)
// Alem da tecla M (BackgroundLayer), deve haver um botao clicavel no HUD
// que alterna game.data.muted e reflete isso no me.audio.

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

test('CR#2: HUD.MuteButton existe e e construido pelo HUD.Container', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    assert.ok(ctx.game.HUD.MuteButton, 'HUD.MuteButton deve estar exposto');
    var hud = new ctx.game.HUD.Container();
    var hasButton = hud.children.some(function (c) { return c && c.name === 'mute-button'; });
    assert.ok(hasButton, 'HUD.Container deve incluir o botao de mute');
});

test('CR#2: clique no botao alterna game.data.muted e me.audio._disabled', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var button = new ctx.game.HUD.MuteButton(840, 20);
    assert.strictEqual(ctx.game.data.muted, false);

    button.onClick();
    assert.strictEqual(ctx.game.data.muted, true, 'primeiro clique muta');
    assert.strictEqual(ctx.me.audio._disabled, true, 'audio deve ficar desabilitado');

    button.onClick();
    assert.strictEqual(ctx.game.data.muted, false, 'segundo clique desmuta');
    assert.strictEqual(ctx.me.audio._disabled, false, 'audio deve ficar habilitado');
});

test('CR#2: containsPoint identifica corretamente cliques dentro e fora', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var button = new ctx.game.HUD.MuteButton(100, 100);
    assert.strictEqual(button.containsPoint(110, 110), true, 'dentro da area do botao');
    assert.strictEqual(button.containsPoint(90, 100), false, 'fora da area do botao');
    assert.strictEqual(button.containsPoint(150, 150), false, 'fora da area do botao');
});

test('CR#2: tecla M ainda alterna mute via BackgroundLayer (retrocompatibilidade)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.PLAY);
    var bg = ctx.me.game.world._children.filter(function (c) {
        return c && c.settings && c.settings.image === 'bg';
    })[0];
    assert.ok(bg, 'BackgroundLayer deve existir na tela de Play');
    ctx.me.input._press('mute');
    bg.update();
    ctx.me.input._release('mute');
    assert.strictEqual(ctx.game.data.muted, true, 'tecla M ainda ativa mute');
});

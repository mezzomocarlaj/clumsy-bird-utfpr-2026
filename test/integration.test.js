'use strict';

// Teste de integracao: percorre MENU -> PLAY -> GAME_OVER -> MENU garantindo
// que todas as telas se configuram e destroem sem erros, e que os estados
// globais principais retornam a um ponto consistente.

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

test('Integracao: ciclo MENU -> PLAY -> GAME_OVER -> MENU sem excecoes', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();

    assert.doesNotThrow(function () { ctx.me.state.change(ctx.me.state.MENU); });
    assert.doesNotThrow(function () { ctx.me.state.change(ctx.me.state.PLAY); });
    ctx.game.data.steps = 12;
    assert.doesNotThrow(function () { ctx.me.state.change(ctx.me.state.GAME_OVER); });
    assert.doesNotThrow(function () { ctx.me.state.change(ctx.me.state.MENU); });
});

test('Integracao: pool registra todas as entidades esperadas', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ['clumsy', 'pipe', 'hit', 'ground'].forEach(function (name) {
        assert.ok(ctx.me.pool._registry[name], 'pool deve registrar ' + name);
    });
});

test('Integracao: onload registra todas as acoes de input esperadas', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var keys = ctx.me.input._bindings.keys;
    assert.ok(keys.fly && keys.fly.length >= 3, 'fly deve ter SPACE/UP/W');
    assert.ok(keys.mute && keys.mute.length >= 1, 'mute deve ter tecla M');
    assert.ok(keys.pause && keys.pause.length >= 2, 'pause deve ter P e ESC');
});

test('Integracao: resources inclui as tres skins referenciadas', function () {
    var ctx = loader.freshProject();
    var names = ctx.game.resources.map(function (r) { return r.name; });
    ctx.game.skins.forEach(function (skin) {
        assert.ok(names.indexOf(skin) >= 0, 'resources deve incluir skin ' + skin);
    });
});

test('Integracao: GameOver exibe steps e topSteps persistidos', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.game.data.steps = 33;
    ctx.me.state.change(ctx.me.state.GAME_OVER);
    assert.strictEqual(ctx.me.save.steps, 33, 'save.steps gravado');
    assert.strictEqual(ctx.me.save.topSteps, 33, 'save.topSteps gravado');
});

test('Integracao: PlayScreen reseta contadores a cada nova partida', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.game.data.steps = 99;
    ctx.game.data.start = true;
    ctx.me.state.change(ctx.me.state.PLAY);
    assert.strictEqual(ctx.game.data.steps, 0, 'steps zerado');
    assert.strictEqual(ctx.game.data.start, false, 'partida comeca em "get ready"');
});

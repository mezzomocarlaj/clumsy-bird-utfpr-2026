'use strict';

// CR#12 — Teclas W / Seta para Cima (Leonardo Santos)
// Alem de SPACE, as teclas W e Arrow Up devem disparar a mesma acao "fly".

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

test('CR#12: tecla SPACE continua bindada a "fly"', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var bindings = ctx.me.input._bindings.keys.fly || [];
    assert.ok(bindings.indexOf(ctx.me.input.KEY.SPACE) >= 0);
});

test('CR#12: tecla UP (seta para cima) esta bindada a "fly"', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var bindings = ctx.me.input._bindings.keys.fly || [];
    assert.ok(bindings.indexOf(ctx.me.input.KEY.UP) >= 0,
        'Arrow Up deve disparar fly');
});

test('CR#12: tecla W esta bindada a "fly"', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var bindings = ctx.me.input._bindings.keys.fly || [];
    assert.ok(bindings.indexOf(ctx.me.input.KEY.W) >= 0,
        'W deve disparar fly');
});

test('CR#12: PlayScreen re-vincula UP e W ao entrar no Play', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    // Simula estado fresco de bindings
    ctx.me.input._bindings.keys.fly = [];
    ctx.me.state.change(ctx.me.state.PLAY);
    var bindings = ctx.me.input._bindings.keys.fly || [];
    assert.ok(bindings.indexOf(ctx.me.input.KEY.SPACE) >= 0, 'SPACE rebindada');
    assert.ok(bindings.indexOf(ctx.me.input.KEY.UP) >= 0, 'UP rebindada');
    assert.ok(bindings.indexOf(ctx.me.input.KEY.W) >= 0, 'W rebindada');
});

test('CR#12: pressionar "fly" (qualquer tecla) faz BirdEntity voar', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.game.data.start = true;
    var bird = ctx.me.pool.pull('clumsy', 60, 300);
    ctx.me.input._press('fly');
    var yBefore = bird.pos.y;
    bird.update(1);
    ctx.me.input._release('fly');
    // O tween e startado, mas o audio de wing tambem deve ter sido acionado
    assert.strictEqual(ctx.me.audio._playing.wing, true, 'wing sfx tocou');
    assert.strictEqual(bird.flyTween.started, true, 'flyTween iniciado');
});

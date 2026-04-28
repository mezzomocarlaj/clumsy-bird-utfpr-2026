'use strict';

// CR#4 — Sistema de Pausa (Gabriel de Oliveira)
// Tecla P ou ESC pausa durante o jogo; entidades param de atualizar; overlay PAUSED aparece.

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

function playingContext() {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.PLAY);
    ctx.game.data.start = true;
    return ctx;
}

test('CR#4: teclas P e ESC sao mapeadas para "pause" no onload', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var pauseBindings = ctx.me.input._bindings.keys.pause || [];
    assert.ok(pauseBindings.indexOf(ctx.me.input.KEY.P) >= 0, 'tecla P bindada');
    assert.ok(pauseBindings.indexOf(ctx.me.input.KEY.ESC) >= 0, 'tecla ESC bindada');
});

test('CR#4: game.data.paused inicia false e alterna via togglePause', function () {
    var ctx = playingContext();
    var screen = ctx.me.state._current || null;
    var play = new ctx.game.PlayScreen();
    play.onResetEvent();
    ctx.game.data.start = true;

    assert.strictEqual(ctx.game.data.paused, false);
    play.togglePause();
    assert.strictEqual(ctx.game.data.paused, true, 'togglePause liga');
    play.togglePause();
    assert.strictEqual(ctx.game.data.paused, false, 'togglePause desliga');
});

test('CR#4: evento KEYDOWN "pause" aciona toggle quando game.data.start=true', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.PLAY);
    ctx.game.data.start = true;
    ctx.game.data.paused = false;
    ctx.me.event.publish(ctx.me.event.KEYDOWN, ['pause', ctx.me.input.KEY.P, true]);
    assert.strictEqual(ctx.game.data.paused, true, 'publish pause -> pausa o jogo');
});

test('CR#4: togglePause chama me.state.pause() e me.state.resume()', function () {
    var ctx = playingContext();
    var play = new ctx.game.PlayScreen();
    play.onResetEvent();
    ctx.game.data.start = true;

    play.togglePause();
    assert.strictEqual(ctx.me.state.isPaused(), true, 'estado deve estar pausado');
    play.togglePause();
    assert.strictEqual(ctx.me.state.isPaused(), false, 'estado deve ser retomado');
});

test('CR#4: PipeGenerator nao gera novos canos enquanto pausado', function () {
    var ctx = playingContext();
    var gen = new ctx.game.PipeGenerator();
    var sizeBefore = ctx.me.game.world._children.length;
    ctx.game.data.paused = true;
    for (var i = 0; i < 300; i++) { gen.update(1); }
    var sizeAfter = ctx.me.game.world._children.length;
    assert.strictEqual(sizeAfter, sizeBefore, 'nenhum cano foi adicionado durante pausa');
});

test('CR#4: BirdEntity.update nao processa fisica quando pausado', function () {
    var ctx = playingContext();
    var bird = ctx.me.pool.pull('clumsy', 60, 300);
    var yBefore = bird.pos.y;
    var gravBefore = bird.gravityForce;
    ctx.game.data.paused = true;
    bird.update(1);
    assert.strictEqual(bird.pos.y, yBefore, 'posicao Y nao muda');
    assert.strictEqual(bird.gravityForce, gravBefore, 'gravidade acumulada nao muda');
});

test('CR#4: HUD.PauseOverlay e renderizado no HUD.Container', function () {
    var ctx = playingContext();
    var hud = new ctx.game.HUD.Container();
    var has = hud.children.some(function (c) { return c && c.name === 'pause-overlay'; });
    assert.ok(has, 'HUD deve incluir overlay de pausa');
});

test('CR#4: sair do PlayScreen reseta estado pausado (nao vaza para menu)', function () {
    var ctx = playingContext();
    var play = new ctx.game.PlayScreen();
    play.onResetEvent();
    ctx.game.data.start = true;
    play.togglePause();
    assert.strictEqual(ctx.game.data.paused, true);
    play.onDestroyEvent();
    assert.strictEqual(ctx.game.data.paused, false, 'onDestroy zera flag de pausa');
});

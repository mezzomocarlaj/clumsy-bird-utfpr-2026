'use strict';

// CR#1 — High Score Persistente (Carla Mezzomo)
// Verifica que a pontuacao maxima e persistida atraves de me.save.topSteps,
// atualizada apenas quando superada, e exibida no TitleScreen e GameOverScreen.

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

test('CR#1: game.onload inicializa topSteps com 0 quando nao existe', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    assert.strictEqual(ctx.me.save.topSteps, 0, 'topSteps deve iniciar em 0');
});

test('CR#1: GameOverScreen grava novo recorde quando steps supera topSteps', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.set(ctx.me.state.GAME_OVER, new ctx.game.GameOverScreen());
    ctx.game.data.steps = 42;
    ctx.me.state.change(ctx.me.state.GAME_OVER);
    assert.strictEqual(ctx.me.save.topSteps, 42, 'deve persistir novo recorde');
    assert.strictEqual(ctx.game.data.newHiScore, true, 'deve sinalizar recorde batido');
});

test('CR#1: GameOverScreen nao rebaixa topSteps quando pontuacao e menor', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.save.topSteps = 100;
    ctx.me.state.set(ctx.me.state.GAME_OVER, new ctx.game.GameOverScreen());
    ctx.game.data.steps = 5;
    ctx.me.state.change(ctx.me.state.GAME_OVER);
    assert.strictEqual(ctx.me.save.topSteps, 100, 'recorde anterior deve ser preservado');
    assert.strictEqual(ctx.game.data.newHiScore, false, 'nao deve sinalizar recorde novo');
});

test('CR#1: TitleScreen exibe topSteps como label persistente no HUD', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.save.topSteps = 77;
    ctx.me.state.change(ctx.me.state.MENU);
    var children = ctx.me.game.world._children;
    var label = children.filter(function (c) { return c && c.name === 'hiscore-label'; })[0];
    assert.ok(label, 'TitleScreen deve adicionar hiscore-label ao world');
});

test('CR#1: topSteps sobrevive a multiplas partidas (mesma sessao)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.set(ctx.me.state.GAME_OVER, new ctx.game.GameOverScreen());

    ctx.game.data.steps = 10;
    ctx.me.state.change(ctx.me.state.GAME_OVER);
    assert.strictEqual(ctx.me.save.topSteps, 10);

    ctx.game.data.steps = 3;
    ctx.me.state.change(ctx.me.state.GAME_OVER);
    assert.strictEqual(ctx.me.save.topSteps, 10, 'recorde permanece apos partida pior');

    ctx.game.data.steps = 25;
    ctx.me.state.change(ctx.me.state.GAME_OVER);
    assert.strictEqual(ctx.me.save.topSteps, 25, 'recorde atualiza apos partida melhor');
});

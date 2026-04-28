'use strict';

// CR#9 — Screen Shake na colisao (Gabriel Guarnieri)
// BirdEntity.endAnimation deve chamar me.game.viewport.shake antes do fadeOut.

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

function pullBird(ctx) {
    return ctx.me.pool.pull('clumsy', 60, 300);
}

test('CR#9: endAnimation registra chamada a viewport.shake', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var bird = pullBird(ctx);
    bird.endAnimation();
    assert.strictEqual(ctx.me.game.viewport._shakes.length, 1, 'um shake registrado');
    var shake = ctx.me.game.viewport._shakes[0];
    assert.ok(shake.intensity > 0, 'intensidade > 0');
    assert.ok(shake.duration > 0, 'duracao > 0');
});

test('CR#9: duracao do shake esta em faixa perceptivel (200-1000ms)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var bird = pullBird(ctx);
    bird.endAnimation();
    var shake = ctx.me.game.viewport._shakes[0];
    assert.ok(shake.duration >= 200 && shake.duration <= 1000,
        'duracao ' + shake.duration + 'ms dentro da faixa');
});

test('CR#9: intensidade calibrada para nao ultrapassar limites do viewport (<=20px)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var bird = pullBird(ctx);
    bird.endAnimation();
    var shake = ctx.me.game.viewport._shakes[0];
    assert.ok(shake.intensity <= 20, 'intensidade razoavel: ' + shake.intensity);
});

test('CR#9: onCollision com pipe ainda dispara vibrate (feedback haptico preservado)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var bird = pullBird(ctx);
    ctx.me.device._vibrated = false;
    bird.onCollision({ b: { type: 'pipe' } });
    assert.strictEqual(ctx.me.device._vibrated, true, 'vibrate deve ter sido chamado');
    assert.strictEqual(bird.collided, true, 'colisao com pipe marca bird.collided');
});

test('CR#9: fadeOut continua sendo chamado apos o shake (sequencia shake+flash)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var bird = pullBird(ctx);
    bird.endAnimation();
    assert.strictEqual(ctx.me.game.viewport._fades.length, 1, 'fadeOut preservado');
    assert.strictEqual(ctx.me.game.viewport._fades[0].color, '#fff');
});

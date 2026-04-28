'use strict';

// CR#10 — Refinamento de Hitboxes (Leonardo Santos)
// O hitbox do passaro deve ser MENOR que o sprite (85x60) para evitar colisoes
// aparentemente injustas. O hitbox do cano deve ter folga lateral.

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

test('CR#10: BirdEntity tem exatamente uma shape (Ellipse) apos init', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var bird = ctx.me.pool.pull('clumsy', 60, 200);
    assert.strictEqual(bird.body.shapes.length, 1, 'apenas uma shape no body');
    assert.strictEqual(bird.body.shapes[0].type, 'ellipse', 'shape e ellipse');
});

test('CR#10: hitbox do passaro e menor que o sprite (85x60)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var bird = ctx.me.pool.pull('clumsy', 60, 200);
    var shape = bird.body.shapes[0];
    assert.ok(shape.width < 85, 'largura do hitbox < 85 (sprite). Foi ' + shape.width);
    assert.ok(shape.height < 60, 'altura do hitbox < 60 (sprite). Foi ' + shape.height);
});

test('CR#10: hitbox do passaro mais permissivo que a versao original (71x51)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var bird = ctx.me.pool.pull('clumsy', 60, 200);
    var shape = bird.body.shapes[0];
    assert.ok(shape.width <= 71, 'largura <= original');
    assert.ok(shape.height <= 51, 'altura <= original');
    // pelo menos uma dimensao deve ter sido reduzida alem do original
    assert.ok(shape.width < 71 || shape.height < 51,
        'pelo menos uma dimensao reduzida alem do original');
});

test('CR#10: hitbox do cano tem folga lateral (largura < 148)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var pipe = ctx.me.pool.pull('pipe', 900, 400);
    var shape = pipe.body.shapes[pipe.body.shapes.length - 1];
    assert.ok(shape, 'pipe possui shape de colisao');
    assert.ok(shape.width < 148, 'largura ' + shape.width + ' < 148 (sprite)');
});

test('CR#10: hitbox do HitEntity mantem folga de 30px (nao regrediu)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var hit = ctx.me.pool.pull('hit', 900, 400);
    var shape = hit.body.shapes[hit.body.shapes.length - 1];
    assert.strictEqual(shape.width, 148 - 30, 'largura 118 (margem permissiva)');
    assert.strictEqual(shape.height, 60 - 30, 'altura 30 (margem permissiva)');
});

'use strict';

// Entrega 6 — Gabriel Felipe Guarnieri
// Trava o comportamento das quatro refatoracoes:
//   (A) Codigo Duplicado -> Extract Method (game.isFrozen).
//   (B) Codigo Duplicado -> Form Template Method / Pull Up Method
//       (game.FreezableEntity / game.FreezableRenderable, hook updateActive).
//   (C) Numeros Magicos -> Replace Magic Number with Symbolic Constant
//       (gravidade, impulso do pulo, teto, hitbox do passaro, dimensoes do cano).
//   (D) Extract Variable -> screenHeight em PipeGenerator.updateActive.

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

// ---------------------------------------------------------------------------
// (A) Codigo Duplicado: Extract Method + Template Method
// ---------------------------------------------------------------------------

test('E6-A: game.isFrozen reflete game.data.paused', function () {
    var ctx = loader.freshProject();
    ctx.game.data.paused = false;
    assert.strictEqual(ctx.game.isFrozen(), false);
    ctx.game.data.paused = true;
    assert.strictEqual(ctx.game.isFrozen(), true);
});

test('E6-A: bases Freezable existem e as entidades sao reconstruidas sobre elas', function () {
    var ctx = loader.freshProject();
    assert.strictEqual(typeof ctx.game.FreezableEntity, 'function');
    assert.strictEqual(typeof ctx.game.FreezableRenderable, 'function');
    // o hook do Template Method existe nas instancias
    ctx.game.onload();
    var bird = ctx.me.pool.pull('clumsy', 60, 300);
    var gen = new ctx.game.PipeGenerator();
    assert.strictEqual(typeof bird.updateActive, 'function');
    assert.strictEqual(typeof gen.updateActive, 'function');
});

test('E6-A: update() congelado NAO executa updateActive (passaro)', function () {
    var ctx = playingContext();
    var bird = ctx.me.pool.pull('clumsy', 999, 300); // pos.x proposital != 60
    ctx.game.data.paused = true;
    bird.update(1);
    // se updateActive tivesse rodado, pos.x viraria 60
    assert.strictEqual(bird.pos.x, 999, 'congelado: updateActive nao roda');
});

test('E6-A: update() ativo delega para updateActive (passaro)', function () {
    var ctx = playingContext();
    var bird = ctx.me.pool.pull('clumsy', 999, 300);
    ctx.game.data.paused = false;
    ctx.game.data.start = false; // ramo "get ready": updateActive forca pos.x = 60
    bird.update(1);
    assert.strictEqual(bird.pos.x, 60, 'ativo: updateActive rodou e fixou pos.x');
});

test('E6-A: PipeEntity, HitEntity e Ground congelam quando pausado', function () {
    var ctx = playingContext();
    var pipe = ctx.me.pool.pull('pipe', 500, 100);
    var hit = ctx.me.pool.pull('hit', 500, 100);
    var ground = ctx.me.pool.pull('ground', 500, 100);
    var px = pipe.pos.x, hx = hit.pos.x, gx = ground.pos.x;
    ctx.game.data.paused = true;
    pipe.update(1); hit.update(1); ground.update(1);
    assert.strictEqual(pipe.pos.x, px, 'cano nao se move pausado');
    assert.strictEqual(hit.pos.x, hx, 'hitbox de score nao se move pausada');
    assert.strictEqual(ground.pos.x, gx, 'chao nao se move pausado');
});

test('E6-A: entidades ativas voltam a se mover quando despausadas', function () {
    var ctx = playingContext();
    var pipe = ctx.me.pool.pull('pipe', 500, 100);
    ctx.game.data.paused = false;
    pipe.update(1);
    assert.notStrictEqual(pipe.pos.x, 500, 'cano se move quando ativo (body.vel = -5)');
});

// ---------------------------------------------------------------------------
// (B) Numeros Magicos: Replace Magic Number with Symbolic Constant
// ---------------------------------------------------------------------------

test('E6-B: hitbox do passaro mantem 12,10,60,40 via constante', function () {
    var ctx = playingContext();
    var bird = ctx.me.pool.pull('clumsy', 60, 300);
    var shape = bird.body.shapes[0];
    assert.strictEqual(shape.type, 'ellipse');
    assert.deepStrictEqual(
        { x: shape.x, y: shape.y, w: shape.width, h: shape.height },
        { x: 12, y: 10, w: 60, h: 40 }
    );
});

test('E6-B: impulso do pulo continua deslocando 72px para cima', function () {
    var ctx = playingContext();
    var bird = ctx.me.pool.pull('clumsy', 60, 300);
    var startY = bird.pos.y;
    bird.jump();
    var step = bird.flyTween._steps[bird.flyTween._steps.length - 1];
    assert.strictEqual(step.props.y, startY - 72, 'flyTween mira em startY - JUMP_IMPULSE');
    assert.strictEqual(bird.gravityForce, 0.2, 'pulo reseta gravidade para GRAVITY');
});

test('E6-B: gravidade acumula 0.2 por tick na queda', function () {
    var ctx = playingContext();
    var bird = ctx.me.pool.pull('clumsy', 60, 300);
    bird.gravityForce = 0;
    bird.fall();
    assert.strictEqual(bird.gravityForce, 0.2, 'fall soma GRAVITY');
    assert.strictEqual(bird.body.gravity, 0.2, 'body.gravity usa GRAVITY');
});

test('E6-B: dimensoes do cano e tamanho do vao usam constantes', function () {
    var ctx = playingContext();
    var pipe = ctx.me.pool.pull('pipe', 500, 100);
    var gen = new ctx.game.PipeGenerator();
    assert.strictEqual(pipe.renderable.height, 1664, 'corpo do cano = PIPE_BODY_HEIGHT');
    assert.strictEqual(gen.pipeHoleSize, 1240, 'vao entre canos = PIPE_GAP');
});

// ---------------------------------------------------------------------------
// (D) Extract Variable: screenHeight em PipeGenerator.updateActive
// ---------------------------------------------------------------------------

test('E6-D: Extract Variable preserva o vao vertical do par de canos', function () {
    var ctx = playingContext();
    var gen = new ctx.game.PipeGenerator();
    var before = ctx.me.game.world._children.length;
    gen.generate = 0; // forca a geracao de canos neste tick (0 % pipeFrequency == 0)
    gen.updateActive(1);
    var novos = ctx.me.game.world._children.slice(before);
    var canos = novos.filter(function (c) { return c.type === 'pipe'; });
    assert.strictEqual(canos.length, 2, 'gera o par de canos (topo e base)');
    // posY - posY2 = screenHeight + pipeHoleSize, independentemente do posY aleatorio:
    // a variavel extraida (screenHeight) deve valer o mesmo nas duas leituras.
    var diff = Math.abs(canos[0].pos.y - canos[1].pos.y);
    assert.strictEqual(
        diff,
        ctx.game.viewportHeight() + gen.pipeHoleSize,
        'distancia entre canos = altura da tela + vao'
    );
});

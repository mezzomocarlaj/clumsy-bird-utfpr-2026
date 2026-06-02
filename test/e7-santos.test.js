'use strict';

// Entrega 7 — Leonardo Santos
// Trava o comportamento das quatro refatoracoes (todas behavior-preserving):
//   (L1) Primitive Obsession / Data Clumps -> Combine Functions into Class
//        (game.GameState agrupa os dados e a funcao reset() que opera sobre eles).
//   (L2) Message Chains -> Hide Delegate
//        (game.viewportWidth/Height escondem o delegado me.game.viewport).
//   (L3) Codigo Duplicado -> Replace Constructor with Factory Function
//        (game.createGround concentra a criacao do chao das 3 telas).
//   (L4) Acesso Disperso -> Encapsulate Variable
//        (game.topScore() unifica a leitura do recorde persistido me.save.topSteps).

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

// ---------------------------------------------------------------------------
// (L1) Combine Functions into Class — game.GameState
// ---------------------------------------------------------------------------

test('L1: game.data e uma instancia de game.GameState', function () {
    var ctx = loader.freshProject();
    assert.strictEqual(typeof ctx.game.GameState, 'function');
    assert.ok(ctx.game.data instanceof ctx.game.GameState);
});

test('L1: GameState nasce com os defaults originais', function () {
    var ctx = loader.freshProject();
    var d = ctx.game.data;
    assert.deepStrictEqual(
        { score: d.score, steps: d.steps, start: d.start, newHiScore: d.newHiScore,
          muted: d.muted, paused: d.paused, skin: d.skin, theme: d.theme },
        { score: 0, steps: 0, start: false, newHiScore: false,
          muted: false, paused: false, skin: 'clumsy', theme: 'day' }
    );
});

test('L1: a funcao reset() combinada na classe zera campos por-partida e preserva muted/skin', function () {
    var ctx = loader.freshProject();
    var d = ctx.game.data;
    assert.strictEqual(typeof d.reset, 'function', 'reset vive na classe');
    d.score = 50; d.steps = 9; d.start = true; d.newHiScore = true;
    d.paused = true; d.theme = 'night';
    d.muted = true; d.skin = 'clumsy_red';

    d.reset();

    assert.strictEqual(d.score, 0);
    assert.strictEqual(d.steps, 0);
    assert.strictEqual(d.start, false);
    assert.strictEqual(d.newHiScore, false);
    assert.strictEqual(d.paused, false);
    assert.strictEqual(d.theme, 'day');
    // preservados entre partidas:
    assert.strictEqual(d.muted, true, 'mute persiste');
    assert.strictEqual(d.skin, 'clumsy_red', 'skin persiste');
});

test('L1: PlayScreen.onResetEvent usa reset() (zera steps, mantem skin/mute)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.game.data.muted = true;
    ctx.game.data.skin = 'clumsy_blue';
    ctx.game.data.steps = 99;

    var play = new ctx.game.PlayScreen();
    play.onResetEvent();

    assert.strictEqual(ctx.game.data.steps, 0, 'partida zera steps');
    assert.strictEqual(ctx.game.data.start, false);
    assert.strictEqual(ctx.game.data.muted, true, 'mute preservado entre partidas');
    assert.strictEqual(ctx.game.data.skin, 'clumsy_blue', 'skin preservada entre partidas');
});

// ---------------------------------------------------------------------------
// (L2) Hide Delegate — acessores de viewport
// ---------------------------------------------------------------------------

test('L2: viewportWidth/Height escondem o delegado me.game.viewport', function () {
    var ctx = loader.freshProject();
    assert.strictEqual(ctx.game.viewportWidth(), ctx.me.game.viewport.width);
    assert.strictEqual(ctx.game.viewportHeight(), ctx.me.game.viewport.height);
});

test('L2: os acessores coincidem com renderer.getWidth/Height (mesma dimensao de tela)', function () {
    var ctx = loader.freshProject();
    assert.strictEqual(ctx.game.viewportWidth(), ctx.me.video.renderer.getWidth());
    assert.strictEqual(ctx.game.viewportHeight(), ctx.me.video.renderer.getHeight());
});

test('L2: entidades de HUD usam os acessores (PauseOverlay cobre a tela)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.PLAY);
    var hud = new ctx.game.HUD.Container();
    var overlay = hud.children.filter(function (c) { return c && c.name === 'pause-overlay'; })[0];
    assert.ok(overlay, 'overlay existe');
    assert.strictEqual(overlay.width, ctx.game.viewportWidth());
    assert.strictEqual(overlay.height, ctx.game.viewportHeight());
});

// ---------------------------------------------------------------------------
// (L3) Replace Constructor with Factory Function — game.createGround
// ---------------------------------------------------------------------------

test('L3: a fabrica posiciona o chao na linha de piso (viewportHeight - GROUND_OFFSET)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    assert.strictEqual(ctx.game.GROUND_OFFSET, 96, 'offset do piso num unico lugar');

    var floor = ctx.game.viewportHeight() - ctx.game.GROUND_OFFSET;
    var g0 = ctx.game.createGround(0);
    var gW = ctx.game.createGround(ctx.game.viewportWidth());

    assert.strictEqual(g0.pos.x, 0);
    assert.strictEqual(g0.pos.y, floor, 'chao da esquerda na linha de piso');
    assert.strictEqual(gW.pos.x, ctx.game.viewportWidth());
    assert.strictEqual(gW.pos.y, floor, 'chao da direita na mesma linha de piso');
});

test('L3: as telas montam o par de chao pela fabrica (mesma linha de piso)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var floor = ctx.game.viewportHeight() - ctx.game.GROUND_OFFSET;

    var play = new ctx.game.PlayScreen();
    play.onResetEvent();
    assert.strictEqual(play.ground1.pos.x, 0);
    assert.strictEqual(play.ground1.pos.y, floor);
    assert.strictEqual(play.ground2.pos.x, ctx.game.viewportWidth());
    assert.strictEqual(play.ground2.pos.y, floor);

    var title = new ctx.game.TitleScreen();
    title.onResetEvent();
    assert.strictEqual(title.ground1.pos.y, floor, 'title usa a mesma fabrica/piso');
});

// ---------------------------------------------------------------------------
// (L4) Encapsulate Variable — game.topScore()
// ---------------------------------------------------------------------------

test('L4: topScore() devolve 0 quando o recorde nao foi persistido', function () {
    var ctx = loader.freshProject();
    assert.strictEqual(typeof ctx.me.save.topSteps, 'undefined');
    assert.strictEqual(ctx.game.topScore(), 0);
});

test('L4: topScore() devolve o recorde persistido', function () {
    var ctx = loader.freshProject();
    ctx.me.save.topSteps = 42;
    assert.strictEqual(ctx.game.topScore(), 42);
});

test('L4: HiScoreLabel le o recorde pelo acesso encapsulado', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.save.topSteps = 7;

    var label = new ctx.game.HUD.HiScoreLabel();
    var captured = null;
    label.font.draw = function (r, text) { captured = text; };
    label.draw({});
    assert.strictEqual(captured, 'HIGH SCORE: 7', 'texto vem de game.topScore()');
});

test('L4: o dialogo de GameOver le o recorde pelo acesso encapsulado', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.game.data.steps = 0;
    ctx.me.save.topSteps = 13;

    var go = new ctx.game.GameOverScreen();
    go.onResetEvent();
    assert.strictEqual(go.dialog.topSteps, 'Higher Step: 13');
});

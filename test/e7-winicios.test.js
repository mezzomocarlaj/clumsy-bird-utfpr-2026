'use strict';

// Entrega 7 — Marcos Winicios
// Trava o comportamento das quatro refatoracoes (todas behavior-preserving):
//   (M1) Repeated Switch Statements -> Replace Conditional with Lookup Table
//        (game.THEMES alimenta themeForSteps/themeColor/themeAlpha).
//   (M2) Dead Code / Speculative Generality -> Remove Dead Code
//        (parametro "speed" do BackgroundLayer; bindings fadeOut/logoTween/that).
//   (M3) Condicionais-guarda repetidas -> Consolidate Conditional Expression
//        (ThemeOverlay.draw: dois testes com o mesmo resultado unificados num if).
//   (M4) Laco imperativo -> Replace Loop with Pipeline
//        (themeForSteps: forEach com acumuladores -> filter + reduce).

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

function countingRenderer() {
    return {
        fills: 0,
        setColor: function () {},
        setGlobalAlpha: function () {},
        fillRect: function () { this.fills++; }
    };
}

// ---------------------------------------------------------------------------
// (M1) Replace Conditional with Lookup Table — game.THEMES
// ---------------------------------------------------------------------------

test('M1: game.THEMES define day/sunset/night com minSteps/color/alpha', function () {
    var ctx = loader.freshProject();
    var t = ctx.game.THEMES;
    ['day', 'sunset', 'night'].forEach(function (name) {
        assert.ok(t[name], 'tema ' + name + ' existe');
        assert.strictEqual(typeof t[name].minSteps, 'number');
        assert.strictEqual(typeof t[name].color, 'string');
        assert.strictEqual(typeof t[name].alpha, 'number');
    });
});

test('M1: themeColor e themeAlpha leem da tabela (e caem em day p/ desconhecido)', function () {
    var ctx = loader.freshProject();
    assert.strictEqual(ctx.game.themeColor('night'), ctx.game.THEMES.night.color);
    assert.strictEqual(ctx.game.themeAlpha('sunset'), ctx.game.THEMES.sunset.alpha);
    // tema desconhecido -> fallback day (preserva o "else" dos switches antigos)
    assert.strictEqual(ctx.game.themeColor('???'), ctx.game.THEMES.day.color);
    assert.strictEqual(ctx.game.themeAlpha('???'), ctx.game.THEMES.day.alpha);
});

test('M1: adicionar um tema e UMA entrada (sem tocar nas 3 funcoes)', function () {
    var ctx = loader.freshProject();
    ctx.game.THEMES.dawn = { minSteps: 10, color: '#ffd9a0', alpha: 0.15 };
    assert.strictEqual(ctx.game.themeForSteps(10), 'dawn', 'novo limiar reconhecido');
    assert.strictEqual(ctx.game.themeForSteps(24), 'dawn');
    assert.strictEqual(ctx.game.themeColor('dawn'), '#ffd9a0');
    assert.strictEqual(ctx.game.themeAlpha('dawn'), 0.15);
    assert.strictEqual(ctx.game.themeForSteps(9), 'day');
    assert.strictEqual(ctx.game.themeForSteps(25), 'sunset');
});

// ---------------------------------------------------------------------------
// (M2) Remove Dead Code
// ---------------------------------------------------------------------------

test('M2: BackgroundLayer.init perdeu o parametro morto "speed" (arity 2)', function () {
    var ctx = loader.freshProject();
    assert.strictEqual(typeof ctx.BackgroundLayer, 'function');
    assert.strictEqual(ctx.BackgroundLayer.prototype.init.length, 2,
        'init agora recebe apenas (image, z)');
});

test('M2: telas continuam montando apos remover os bindings mortos', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();

    // title.onResetEvent mantinha um "var logoTween"/"var that" nunca lidos
    assert.doesNotThrow(function () { ctx.me.state.change(ctx.me.state.MENU); });
    var titleScreen = new ctx.game.TitleScreen();
    assert.doesNotThrow(function () { titleScreen.onResetEvent(); });
    assert.ok(titleScreen.logo, 'logo ainda criado (efeito do tween preservado)');

    // play.onResetEvent mantinha um "var fadeOut" nunca lido
    var play = new ctx.game.PlayScreen();
    assert.doesNotThrow(function () { play.onResetEvent(); });
    assert.ok(play.getReady, 'getReady ainda criado (efeito do fade preservado)');
});

// ---------------------------------------------------------------------------
// (M3) Consolidate Conditional Expression — ThemeOverlay.draw
// ---------------------------------------------------------------------------

test('M3: fora da tela PLAY o overlay de tema nao desenha nada', function () {
    var ctx = loader.freshProject();
    ctx.game.onload(); // estado corrente termina em MENU
    var overlay = new ctx.game.HUD.ThemeOverlay();
    ctx.game.data.theme = 'night'; // alpha > 0, mas nao estamos em PLAY

    var r = countingRenderer();
    overlay.draw(r);
    assert.strictEqual(r.fills, 0, 'condicao unica barra o desenho fora de PLAY');
});

test('M3: em PLAY com tema sem opacidade (day) o overlay nao desenha', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.PLAY);
    ctx.game.data.theme = 'day'; // alpha == 0

    var r = countingRenderer();
    new ctx.game.HUD.ThemeOverlay().draw(r);
    assert.strictEqual(r.fills, 0, 'mesma condicao unica barra o desenho com alpha 0');
});

test('M3: em PLAY com tema opaco (night) o overlay desenha', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.PLAY);
    ctx.game.data.theme = 'night'; // alpha == 0.45

    var r = countingRenderer();
    new ctx.game.HUD.ThemeOverlay().draw(r);
    assert.strictEqual(r.fills, 1, 'passando a condicao unica, pinta o overlay');
});

// ---------------------------------------------------------------------------
// (M4) Replace Loop with Pipeline — themeForSteps
// ---------------------------------------------------------------------------

test('M4: themeForSteps mantem os limiares originais (25 e 50)', function () {
    var ctx = loader.freshProject();
    var f = ctx.game.themeForSteps;
    assert.strictEqual(f(0), 'day');
    assert.strictEqual(f(24), 'day');
    assert.strictEqual(f(25), 'sunset');
    assert.strictEqual(f(49), 'sunset');
    assert.strictEqual(f(50), 'night');
    assert.strictEqual(f(120), 'night');
});

test('M4: o pipeline escolhe o tema de MAIOR limiar atingido', function () {
    var ctx = loader.freshProject();
    // 100 >= minSteps de day(0), sunset(25) e night(50); deve vencer o maior (night)
    assert.strictEqual(ctx.game.themeForSteps(100), 'night');
});

test('M4: sem estado mutavel vazando entre chamadas', function () {
    var ctx = loader.freshProject();
    assert.strictEqual(ctx.game.themeForSteps(50), 'night');
    // se houvesse acumulador compartilhado, esta chamada poderia "lembrar" night
    assert.strictEqual(ctx.game.themeForSteps(0), 'day', 'cada chamada e independente');
});

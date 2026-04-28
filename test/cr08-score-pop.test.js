'use strict';

// CR#8 — Animacao de Pop no Score (Gabriel Guarnieri)
// O ScoreItem detecta incrementos em game.data.steps e dispara um tween de escala
// a partir de 1.5 voltando para 1.0.

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

test('CR#8: ScoreItem inicia com scale=1.0 e lastSteps sincronizado', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.game.data.steps = 0;
    var s = new ctx.game.HUD.ScoreItem(5, 5);
    assert.strictEqual(s.scale, 1.0);
    assert.strictEqual(s.lastSteps, 0);
});

test('CR#8: incremento em steps ativa pulso (scale sobe para 1.5)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.game.data.steps = 0;
    var s = new ctx.game.HUD.ScoreItem(5, 5);
    ctx.game.data.steps = 1;
    var changed = s.update(16);
    assert.strictEqual(changed, true, 'update retorna true no incremento');
    assert.strictEqual(s.scale, 1.5, 'scale sobe imediatamente');
    assert.strictEqual(s.lastSteps, 1, 'lastSteps acompanha');
});

test('CR#8: sem incremento, update nao altera scale nem dispara tween novo', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var s = new ctx.game.HUD.ScoreItem(5, 5);
    var changed = s.update(16);
    assert.strictEqual(changed, false, 'sem incremento, update retorna false');
    assert.strictEqual(s.scale, 1.0, 'scale permanece');
    assert.strictEqual(s.scaleTween, null, 'nenhum tween iniciado');
});

test('CR#8: incrementos seguidos reiniciam o tween (anterior e interrompido)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var s = new ctx.game.HUD.ScoreItem(5, 5);
    ctx.game.data.steps = 1;
    s.update(16);
    var firstTween = s.scaleTween;
    ctx.game.data.steps = 2;
    s.update(16);
    assert.strictEqual(firstTween.stopped, true, 'tween anterior foi parado');
    assert.notStrictEqual(s.scaleTween, firstTween, 'novo tween alocado');
    assert.strictEqual(s.scale, 1.5, 'pulso reinicia de 1.5');
});

test('CR#8: scale volta para 1.0 ao finalizar o tween', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var s = new ctx.game.HUD.ScoreItem(5, 5);
    ctx.game.data.steps = 1;
    s.update(16);
    s.scaleTween.finish();
    assert.strictEqual(s.scale, 1.0, 'apos tween completo, scale=1.0');
});

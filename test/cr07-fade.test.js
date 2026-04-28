'use strict';

// CR#7 — Fade entre estados (Gabriel Guarnieri)
// A funcao loaded() chama me.state.transition("fade", cor, duracao).

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

test('CR#7: me.state.transition e configurada apos loaded()', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    assert.ok(ctx.me.state._transition, 'transition deve estar configurada');
    assert.strictEqual(ctx.me.state._transition.type, 'fade', 'tipo fade');
});

test('CR#7: duracao do fade deve estar entre 150ms e 500ms', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var d = ctx.me.state._transition.duration;
    assert.ok(d >= 150 && d <= 500, 'duracao ' + d + 'ms dentro da faixa recomendada');
});

test('CR#7: cor do fade e uma string valida (hex)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var color = ctx.me.state._transition.color;
    assert.match(color, /^#[0-9a-fA-F]{3,8}$/, 'cor deve ser hex: ' + color);
});

test('CR#7: fade esta configurado antes da primeira mudanca de estado', function () {
    var ctx = loader.freshProject();
    // Antes de onload, transition nao existe
    assert.strictEqual(ctx.me.state._transition, null, 'pre-condicao');
    ctx.game.onload();
    assert.ok(ctx.me.state._transition, 'apos onload, transition existe');
});

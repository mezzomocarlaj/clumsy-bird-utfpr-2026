'use strict';

// CR#14 — Botao direito do mouse como pulo (Marcos Winicios)
// Apos desabilitar o menu de contexto (CR#13), o botao direito deve mapear
// para a mesma tecla SPACE (acao "fly").

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

test('CR#14: onload vincula me.input.pointer.RIGHT a KEY.SPACE', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var right = ctx.me.input._bindings.pointers[ctx.me.input.pointer.RIGHT];
    assert.strictEqual(right, ctx.me.input.KEY.SPACE,
        'botao direito deve mapear para SPACE (mesma acao "fly")');
});

test('CR#14: PlayScreen tambem vincula botao direito ao entrar em Play', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    // limpa bindings de ponteiro
    ctx.me.input._bindings.pointers = {};
    ctx.me.state.change(ctx.me.state.PLAY);
    var right = ctx.me.input._bindings.pointers[ctx.me.input.pointer.RIGHT];
    assert.strictEqual(right, ctx.me.input.KEY.SPACE);
});

test('CR#14: botao esquerdo continua funcionando (nao regrediu)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.PLAY);
    var left = ctx.me.input._bindings.pointers[ctx.me.input.pointer.LEFT];
    assert.strictEqual(left, ctx.me.input.KEY.SPACE,
        'botao esquerdo permanece vinculado');
});

test('CR#14: PlayScreen.onDestroyEvent desvincula botao direito', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.PLAY);
    assert.ok(ctx.me.input._bindings.pointers[ctx.me.input.pointer.RIGHT]);
    ctx.me.state.change(ctx.me.state.MENU);
    assert.strictEqual(ctx.me.input._bindings.pointers[ctx.me.input.pointer.RIGHT], undefined,
        'botao direito desvinculado ao sair do Play');
});

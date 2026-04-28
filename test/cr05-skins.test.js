'use strict';

// CR#5 — Selecao de Skins (Gabriel de Oliveira)
// O jogador escolhe a cor do passaro no menu. A escolha e persistida e o sprite
// carregado pela BirdEntity reflete a skin atual.

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

test('CR#5: game.skins expoe pelo menos 3 opcoes e inclui a original', function () {
    var ctx = loader.freshProject();
    assert.ok(Array.isArray(ctx.game.skins), 'game.skins deve ser uma lista');
    assert.ok(ctx.game.skins.length >= 3, 'pelo menos 3 skins disponiveis');
    assert.ok(ctx.game.skins.indexOf('clumsy') >= 0, 'skin padrao "clumsy" incluida');
});

test('CR#5: game.selectSkin aceita skins validas e rejeita desconhecidas', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    assert.strictEqual(ctx.game.selectSkin('clumsy_blue'), true);
    assert.strictEqual(ctx.game.data.skin, 'clumsy_blue');
    assert.strictEqual(ctx.game.selectSkin('inexistente'), false);
    assert.strictEqual(ctx.game.data.skin, 'clumsy_blue', 'skin nao muda quando invalida');
});

test('CR#5: selectSkin persiste a escolha em me.save.skin', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.game.selectSkin('clumsy_red');
    assert.strictEqual(ctx.me.save.skin, 'clumsy_red', 'skin persistida');
});

test('CR#5: nextSkin cicla entre as skins em ordem', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var first = ctx.game.data.skin;
    var second = ctx.game.nextSkin();
    var third = ctx.game.nextSkin();
    assert.notStrictEqual(first, second, 'nextSkin avanca');
    assert.notStrictEqual(second, third);
    // depois de skins.length ciclos voltamos ao inicio
    for (var i = 0; i < ctx.game.skins.length - 2; i++) { ctx.game.nextSkin(); }
    assert.strictEqual(ctx.game.data.skin, first, 'cicla de volta ao inicio');
});

test('CR#5: BirdEntity usa game.data.skin como imagem do sprite', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.game.selectSkin('clumsy_blue');
    var bird = ctx.me.pool.pull('clumsy', 60, 100);
    assert.strictEqual(bird.settings.image, 'clumsy_blue', 'sprite carregado = skin ativa');
});

test('CR#5: TitleScreen restaura skin persistida ao entrar no menu', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.save.add({ skin: 'clumsy_red' });
    ctx.me.save.skin = 'clumsy_red';
    ctx.game.data.skin = 'clumsy';
    ctx.me.state.change(ctx.me.state.MENU);
    assert.strictEqual(ctx.game.data.skin, 'clumsy_red', 'skin restaurada do save ao entrar no menu');
});

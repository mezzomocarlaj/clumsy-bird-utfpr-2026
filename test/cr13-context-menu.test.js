'use strict';

// CR#13 — Desativar menu de contexto (Marcos Winicios)
// game.onload deve registrar listener de contextmenu que chama preventDefault.

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

function buildDocumentStub() {
    var listeners = { document: [], screen: [] };
    var screenEl = {
        addEventListener: function (type, fn) { listeners.screen.push({ type: type, fn: fn }); },
        tagName: 'DIV'
    };
    var doc = {
        getElementById: function (id) { return id === 'screen' ? screenEl : null; },
        addEventListener: function (type, fn) { listeners.document.push({ type: type, fn: fn }); }
    };
    return { document: doc, listeners: listeners, screenEl: screenEl };
}

test('CR#13: game.onload registra listener contextmenu no elemento #screen', function () {
    var stub = buildDocumentStub();
    var ctx = loader.createSandbox({ document: stub.document, alert: function () {} });
    loader.loadGame(ctx);
    ctx.game.onload();
    var screenListeners = stub.listeners.screen.filter(function (l) { return l.type === 'contextmenu'; });
    assert.ok(screenListeners.length >= 1, 'listener contextmenu no #screen');
});

test('CR#13: listener do #screen chama preventDefault', function () {
    var stub = buildDocumentStub();
    var ctx = loader.createSandbox({ document: stub.document, alert: function () {} });
    loader.loadGame(ctx);
    ctx.game.onload();
    var listener = stub.listeners.screen.filter(function (l) { return l.type === 'contextmenu'; })[0];
    var prevented = false;
    var returnValue = listener.fn({ preventDefault: function () { prevented = true; } });
    assert.strictEqual(prevented, true, 'preventDefault chamado');
    assert.strictEqual(returnValue, false, 'handler retorna false');
});

test('CR#13: listener do documento intercepta contextmenu em canvas/screen', function () {
    var stub = buildDocumentStub();
    var ctx = loader.createSandbox({ document: stub.document, alert: function () {} });
    loader.loadGame(ctx);
    ctx.game.onload();
    var docListener = stub.listeners.document.filter(function (l) { return l.type === 'contextmenu'; })[0];
    assert.ok(docListener, 'listener global registrado');

    var prevented = false;
    docListener.fn({
        target: { tagName: 'CANVAS', parentNode: { id: 'screen' } },
        preventDefault: function () { prevented = true; }
    });
    assert.strictEqual(prevented, true, 'previne menu em canvas do jogo');
});

test('CR#13: ausencia de document (Node puro) nao quebra onload', function () {
    var ctx = loader.createSandbox({ alert: function () {} });
    loader.loadGame(ctx);
    // Nao deve lancar excecao mesmo sem document
    ctx.game.onload();
    assert.ok(true);
});

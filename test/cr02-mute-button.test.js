'use strict';

// CR#2 — Botao de Mute (Carla Mezzomo)
// Alem da tecla M (BackgroundLayer), deve haver um botao clicavel no HUD
// que alterna game.data.muted e reflete isso no me.audio.

var test = require('node:test');
var assert = require('node:assert');
var loader = require('./helpers/load-source');

test('CR#2: HUD.MuteButton existe e e construido pelo HUD.Container', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    assert.ok(ctx.game.HUD.MuteButton, 'HUD.MuteButton deve estar exposto');
    var hud = new ctx.game.HUD.Container();
    var hasButton = hud.children.some(function (c) { return c && c.name === 'mute-button'; });
    assert.ok(hasButton, 'HUD.Container deve incluir o botao de mute');
});

test('CR#2: clique no botao alterna game.data.muted e me.audio._disabled', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var button = new ctx.game.HUD.MuteButton(840, 20);
    assert.strictEqual(ctx.game.data.muted, false);

    button.onClick();
    assert.strictEqual(ctx.game.data.muted, true, 'primeiro clique muta');
    assert.strictEqual(ctx.me.audio._disabled, true, 'audio deve ficar desabilitado');

    button.onClick();
    assert.strictEqual(ctx.game.data.muted, false, 'segundo clique desmuta');
    assert.strictEqual(ctx.me.audio._disabled, false, 'audio deve ficar habilitado');
});

test('CR#2: containsPoint identifica corretamente cliques dentro e fora', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    var button = new ctx.game.HUD.MuteButton(100, 100);
    assert.strictEqual(button.containsPoint(110, 110), true, 'dentro da area do botao');
    assert.strictEqual(button.containsPoint(90, 100), false, 'fora da area do botao');
    assert.strictEqual(button.containsPoint(150, 150), false, 'fora da area do botao');
});

test('CR#2: tecla M ainda alterna mute via BackgroundLayer (retrocompatibilidade)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.PLAY);
    var bg = ctx.me.game.world._children.filter(function (c) {
        return c && c.settings && c.settings.image === 'bg';
    })[0];
    assert.ok(bg, 'BackgroundLayer deve existir na tela de Play');
    ctx.me.input._press('mute');
    bg.update();
    ctx.me.input._release('mute');
    assert.strictEqual(ctx.game.data.muted, true, 'tecla M ainda ativa mute');
});

test('CR#2: mutar e desmutar funciona na tela de menu (TitleScreen)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.MENU);
    assert.strictEqual(ctx.game.data.muted, false, 'inicia desmutado');

    // Simula pressionar M
    ctx.me.event.publish(ctx.me.event.KEYDOWN, ['mute']);
    assert.strictEqual(ctx.game.data.muted, true, 'pressionar M no menu muta o jogo');

    ctx.me.event.publish(ctx.me.event.KEYDOWN, ['mute']);
    assert.strictEqual(ctx.game.data.muted, false, 'pressionar M no menu novamente desmuta o jogo');
});

test('CR#2: mutar e desmutar funciona na tela de GameOver (GameOverScreen)', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.GAME_OVER);
    assert.strictEqual(ctx.game.data.muted, false, 'inicia desmutado');

    // Simula pressionar M
    ctx.me.event.publish(ctx.me.event.KEYDOWN, ['mute']);
    assert.strictEqual(ctx.game.data.muted, true, 'pressionar M no gameover muta o jogo');

    ctx.me.event.publish(ctx.me.event.KEYDOWN, ['mute']);
    assert.strictEqual(ctx.game.data.muted, false, 'pressionar M no gameover novamente desmuta o jogo');
});

test('CR#2: iniciar o jogo com mute preserva o mute e nao toca tema', function () {
    var ctx = loader.freshProject();
    ctx.game.onload();
    
    // Muta no menu
    ctx.me.state.change(ctx.me.state.MENU);
    ctx.me.event.publish(ctx.me.event.KEYDOWN, ['mute']);
    assert.strictEqual(ctx.game.data.muted, true, 'jogo mutado no menu');

    // Inicia o jogo
    ctx.me.state.change(ctx.me.state.PLAY);
    assert.strictEqual(ctx.game.data.muted, true, 'estado mutado deve ser mantido');
    assert.strictEqual(ctx.me.audio._disabled, true, 'sistema de audio deve estar desabilitado se mutado');

    // Desmuta no jogo
    ctx.game.toggleMute();
    assert.strictEqual(ctx.game.data.muted, false, 'jogo desmutado');
    assert.strictEqual(ctx.me.audio._disabled, false, 'sistema de audio deve ser habilitado ao desmutar');
    assert.strictEqual(ctx.me.audio.getCurrentTrack(), 'theme', 'musica tema deve continuar ativa');
});

test('CR#2: clicar na area do botao de mute no menu nao deve iniciar a partida', function () {
    var ctx = loader.freshProject();
    
    // Stub registerPointerEvent para podermos capturar o callback
    var registeredCallback = null;
    ctx.me.input.registerPointerEvent = function (event, target, callback) {
        if (target === ctx.me.game.world) {
            registeredCallback = callback;
        }
    };
    
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.MENU);
    
    assert.ok(registeredCallback, 'deve registrar tratador de clique no me.game.world');
    assert.strictEqual(ctx.me.state.current(), ctx.me.state.MENU, 'estado inicial e MENU');
    
    // Simula clique na coordenada do mute button (width: 40px, height: 40px, pos.x: viewport.width - 60 (840), pos.y: 20)
    // Clique dentro dos limites: x = 850, y = 30
    registeredCallback({ gameX: 850, gameY: 30 });
    assert.strictEqual(ctx.me.state.current(), ctx.me.state.MENU, 'clique no botao de mute nao deve iniciar o jogo');
    
    // Simula clique fora (no meio da tela): x = 450, y = 300
    registeredCallback({ gameX: 450, gameY: 300 });
    assert.strictEqual(ctx.me.state.current(), ctx.me.state.PLAY, 'clique fora do botao de mute deve iniciar o jogo');
});

test('CR#2: clique na area do botao de mute com DPI-scaling (Retina) nao deve iniciar a partida', function () {
    var ctx = loader.freshProject();
    
    // Configura o mock do window.devicePixelRatio no contexto do sandbox
    ctx.window = { devicePixelRatio: 2 };
    
    var registeredCallback = null;
    ctx.me.input.registerPointerEvent = function (event, target, callback) {
        if (target === ctx.me.game.world) {
            registeredCallback = callback;
        }
    };
    
    ctx.game.onload();
    ctx.me.state.change(ctx.me.state.MENU);
    
    assert.ok(registeredCallback, 'deve registrar tratador de clique no me.game.world');
    assert.strictEqual(ctx.me.state.current(), ctx.me.state.MENU);
    
    // Com DPI=2, a coordenada física para o botão (840-880, 20-60) será multiplicada por 2 (1680-1760, 40-120)
    // Simula clique com coordenadas físicas escaladas pelo DPI: x = 1700, y = 60
    registeredCallback({ gameX: 1700, gameY: 60 });
    assert.strictEqual(ctx.me.state.current(), ctx.me.state.MENU, 'clique escalado no botao de mute nao deve iniciar o jogo');
    
    // Simula clique fora: x = 900, y = 600
    registeredCallback({ gameX: 900, gameY: 600 });
    assert.strictEqual(ctx.me.state.current(), ctx.me.state.PLAY, 'clique fora do botao de mute deve iniciar o jogo');
});



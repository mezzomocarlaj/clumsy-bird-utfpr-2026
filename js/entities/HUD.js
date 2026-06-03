game.HUD = game.HUD || {};

game.HUD.Container = me.Container.extend({
    init: function() {
        this._super(me.Container, 'init');
        // persistent across level change
        this.isPersistent = true;

        // non collidable
        this.collidable = false;

        // make sure our object is always draw first
        this.z = Infinity;

        // give a name
        this.name = "HUD";

        // add our child score object at the top left corner
        this.addChild(new game.HUD.ScoreItem(5, 5));
        // [Manutencao - Carla Mezzomo] CR#2 Botao clicavel de mute/unmute no canto superior direito
        this.addChild(new game.HUD.MuteButton(game.viewportWidth() - 60, 20));
        // [Manutencao - Gabriel de Oliveira] CR#4 Overlay "PAUSED" sobre a tela de jogo
        this.addChild(new game.HUD.PauseOverlay());
        // [Manutencao - Marcos Winicios] CR#15 Overlay de tema (dia/entardecer/noite)
        this.addChild(new game.HUD.ThemeOverlay());
    }
});


game.HUD.ScoreItem = me.Renderable.extend({
    init: function(x, y) {
        this._super(me.Renderable, "init", [x, y, 10, 10]);

        // local copy of the global score
        this.stepsFont = new me.Font('gamefont', 80, '#000', 'center');
        // [Manutencao - Gabriel Guarnieri] CR#8 Baseline 'middle' centra o glifo no ponto
        // de desenho, para que a escala do pop pulse no proprio numero (e nao o desloque).
        this.stepsFont.textBaseline = 'middle';

        // [Manutencao - Gabriel Guarnieri] CR#8 Estado para pulso de escala no score.
        // IMPORTANTE: a propriedade NAO pode se chamar 'scale'. me.Renderable.prototype.scale
        // e um metodo nao-gravavel (writable:false); como o codigo e ES5 nao-estrito, a
        // atribuicao "this.scale = 1.0" falha silenciosamente e 'scale' permanece sendo a
        // funcao herdada. O tween nunca anima e draw passa uma funcao para renderer.scale().
        // Usamos 'popScale' para nao colidir com a API do engine.
        this.lastSteps = game.data.steps;
        this.popScale = 1.0;
        this.scaleTween = null;

        // make sure we use screen coordinates
        this.floating = true;
    },

    // [Manutencao - Gabriel Guarnieri] CR#8 Dispara tween de pulso quando game.data.steps incrementa
    update: function(dt) {
        var isTweening = this.popScale > 1.0;
        var changed = false;
        if (game.data.steps > this.lastSteps) {
            this.lastSteps = game.data.steps;
            if (this.scaleTween) {
                this.scaleTween.stop();
            }
            this.popScale = 1.6;
            this.scaleTween = new me.Tween(this)
                .to({ popScale: 1.0 }, 600)
                .easing(me.Tween.Easing.Quadratic.Out)
                .start();
            changed = true;
        }
        return changed || isTweening;
    },

    draw: function (renderer) {
        if (game.data.start && me.state.isCurrent(me.state.PLAY)) {
            // [Manutencao - Gabriel Guarnieri] CR#8 Pulso centrado no proprio numero:
            // pivota a escala no centro do glifo (translate -> scale -> desenho em 0,0)
            // para o numero crescer/encolher no lugar em vez de ser jogado para fora da tela.
            var cx = game.viewportWidth() / 2;
            var cy = 92;
            renderer.save();
            renderer.translate(cx, cy);
            renderer.scale(this.popScale, this.popScale);
            this.stepsFont.draw(renderer, game.data.steps, 0, 0);
            renderer.restore();
        }
    }

});

// [Manutencao - Carla Mezzomo] CR#2 Botao de mute clicavel renderizado no HUD
game.HUD.MuteButton = me.Renderable.extend({
    init: function (x, y) {
        this._super(me.Renderable, 'init', [x, y, 40, 40]);
        this.floating = true;
        this.font = new me.Font('gamefont', 24, '#fff', 'center');
        this.name = 'mute-button';
        var that = this;
        this.pointerHandler = function (event) {
            // [Refatoracao - Carla Mezzomo] E7-Fases-Misturadas: Split Phase
            // O handler entrelacava duas etapas: decodificar o evento em coordenadas de
            // tela e, na mesma expressao, decidir/reagir ao clique. A fase de decodificacao
            // saiu para pointFromEvent, que devolve um ponto intermediario {x, y}; o handler
            // apenas consome esse ponto.
            var point = that.pointFromEvent(event);
            // [Refatoracao - Carla Mezzomo] E7-Condicional-Aninhada: Replace Nested Conditional with Guard Clauses
            // Antes o corpo util ficava aninhado dentro de "if (containsPoint) { ... }".
            // Invertido em guarda: clique fora do botao retorna cedo; o caminho principal
            // (alternar o mute) fica no nivel de cima, sem aninhamento.
            if (!that.containsPoint(point.x, point.y)) { return; }
            // [Refatoracao - Carla Mezzomo] E7-Middle-Man: Inline Function
            // "that.toggleMute()" era um repassador de uma linha para game.toggleMute();
            // a indirecao foi removida e o handler chama o game diretamente.
            game.toggleMute();
            if (event && typeof event.stopPropagation === 'function') { event.stopPropagation(); }
        };
    },

    onActivateEvent: function () {
        me.input.registerPointerEvent('pointerdown', this, this.pointerHandler);
    },

    onDeactivateEvent: function () {
        me.input.releasePointerEvent('pointerdown', this);
    },

    // [Refatoracao - Carla Mezzomo] E7-Fases-Misturadas: Split Phase
    // Fase 1 da Split Phase: traduz o evento bruto de ponteiro num ponto de tela {x, y},
    // isolando a logica de decodificacao da logica de reacao ao clique.
    pointFromEvent: function (event) {
        return {
            x: this.readPointerCoord(event, 'gameX', 'clientX'),
            y: this.readPointerCoord(event, 'gameY', 'clientY')
        };
    },

    // [Refatoracao - Carla Mezzomo] E7-Codigo-Duplicado: Parameterize Function
    // As leituras de X e de Y eram dois fragmentos quase identicos
    // (event.gameX !== undefined ? event.gameX : event.clientX; o mesmo para Y).
    // Viram UMA funcao parametrizada pelos nomes dos campos a ler.
    readPointerCoord: function (event, gameProp, clientProp) {
        if (!event) { return 0; }
        return (event[gameProp] !== undefined ? event[gameProp] : event[clientProp]) || 0;
    },

    containsPoint: function (x, y) {
        var dpi = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        var rx = x;
        var ry = y;
        // Check if inside standard bounds
        if (rx >= this.pos.x && rx <= this.pos.x + this.width &&
            ry >= this.pos.y && ry <= this.pos.y + this.height) {
            return true;
        }
        // Check if scaled down by dpi (in case x/y passed by melonJS is physical/scaled pixel coordinates)
        rx = x / dpi;
        ry = y / dpi;
        return rx >= this.pos.x && rx <= this.pos.x + this.width &&
               ry >= this.pos.y && ry <= this.pos.y + this.height;
    },

    // Invocado por testes unitários e retrocompatibilidade
    // [Refatoracao - Carla Mezzomo] E7-Middle-Man: Inline Function
    // o antigo MuteButton.toggleMute (repassador para game.toggleMute) foi inlinado;
    // este consumidor passa a chamar game.toggleMute() diretamente.
    onClick: function () {
        game.toggleMute();
        return true;
    },

    draw: function (renderer) {
        if (typeof renderer.setColor === 'function') {
            renderer.setColor(game.data.muted ? '#aa2222' : '#22aa22');
        }
        if (typeof renderer.fillRect === 'function') {
            renderer.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        }
        this.font.draw(renderer, game.data.muted ? 'X' : '<', this.pos.x + this.width / 2, this.pos.y + 8);
    }
});

// [Manutencao - Gabriel de Oliveira] CR#4 Overlay semitransparente exibido quando pausado
game.HUD.PauseOverlay = me.Renderable.extend({
    init: function () {
        this._super(me.Renderable, 'init', [0, 0, game.viewportWidth(), game.viewportHeight()]);
        this.floating = true;
        this.font = new me.Font('gamefont', 64, '#fff', 'center');
        this.name = 'pause-overlay';
    },

    draw: function (renderer) {
        // no-op: rendering handled by HTML overlay with backdrop-filter blur
    }
});

// [Manutencao - Marcos Winicios] CR#15 Overlay de tonalizacao para o tema atual
game.HUD.ThemeOverlay = me.Renderable.extend({
    init: function () {
        this._super(me.Renderable, 'init', [0, 0, game.viewportWidth(), game.viewportHeight()]);
        this.floating = true;
        this.z = 5;
        this.name = 'theme-overlay';
    },

    update: function () {
        var theme = game.themeForSteps(game.data.steps);
        if (theme !== game.data.theme) {
            game.data.theme = theme;
            return true;
        }
        return false;
    },

    draw: function (renderer) {
        // [Refatoracao - Marcos Winicios] E7-Condicionais: Consolidate Conditional Expression
        // Dois testes-guarda distintos levavam ao MESMO resultado (nao desenhar nada): estar
        // fora da tela PLAY e o tema atual nao ter opacidade. Foram unificados num unico if.
        var theme = game.data.theme || 'day';
        var alpha = game.themeAlpha(theme);
        if (!me.state.isCurrent(me.state.PLAY) || alpha <= 0) { return; }
        
        if (typeof renderer.save === 'function') {
            renderer.save();
        }
        if (typeof renderer.setColor === 'function') {
            renderer.setColor(game.themeColor(theme));
        }
        if (typeof renderer.setGlobalAlpha === 'function') {
            renderer.setGlobalAlpha(alpha);
        }
        if (typeof renderer.fillRect === 'function') {
            renderer.fillRect(0, 0, this.width, this.height);
        }
        if (typeof renderer.restore === 'function') {
            renderer.restore();
        }
    }
});

var BackgroundLayer = me.ImageLayer.extend({
    // [Refatoracao - Marcos Winicios] E7-Codigo-Morto: Remove Dead Code
    // parametro "speed" era especulativo: nunca lido aqui e nenhum chamador o passa.
    init: function(image, z) {
        var settings = {};
        settings.name = image;
        settings.width = 900;
        settings.height = 600;
        settings.image = image;
        settings.z = z;
        settings.ratio = 1;
        // call parent constructor
        this._super(me.ImageLayer, 'init', [0, 0, settings]);
    },

    update: function() {
        if (me.input.isKeyPressed('mute')) {
            game.toggleMute();
        }
        return true;
    },

    updateLayer: function(a) {
        // no-op to prevent NaN errors when viewport shakes
    }
});

// [Refatoracao - Gabriel de Oliveira] R2: Classes de UI extraidas de title.js
game.HUD.TitleText = me.Renderable.extend({
    init: function() {
        this._super(me.Renderable, 'init', [0, 0, 100, 100]);
        this.text = me.device.touch ? 'Tap to start' : 'PRESS SPACE OR CLICK LEFT MOUSE BUTTON TO START \n\t\t\t\t\t\t\t\t\t\t\tPRESS "M" TO MUTE SOUND';
        this.font = new me.Font('gamefont', 20, '#000');
        this.name = 'title-text';
    },
    draw: function (renderer) {
        var measure = this.font.measureText(renderer, this.text);
        var xpos = game.viewportWidth()/2 - measure.width/2;
        var ypos = game.viewportHeight()/2 + 50;
        this.font.draw(renderer, this.text, xpos, ypos);
    }
});

game.HUD.HiScoreLabel = me.Renderable.extend({
    init: function () {
        this._super(me.Renderable, 'init', [0, 0, 200, 40]);
        this.font = new me.Font('gamefont', 28, '#fff');
        this.name = 'hiscore-label';
    },
    draw: function (renderer) {
        // [Refatoracao - Leonardo Santos] E7-Acesso-Disperso: leitura do recorde via game.topScore()
        var top = game.topScore();
        var text = 'HIGH SCORE: ' + top;
        var measure = this.font.measureText(renderer, text);
        this.font.draw(renderer, text, game.viewportWidth()/2 - measure.width/2, 30);
    }
});

game.HUD.SkinLabel = me.Renderable.extend({
    init: function () {
        this._super(me.Renderable, 'init', [0, 0, 200, 40]);
        this.font = new me.Font('gamefont', 18, '#fff');
        this.name = 'skin-label';
    },
    draw: function (renderer) {
        var text = 'SKIN: ' + (game.data.skin || 'clumsy') + '  (PRESS S TO CHANGE)';
        var measure = this.font.measureText(renderer, text);
        this.font.draw(renderer, text, game.viewportWidth()/2 - measure.width/2,
            game.viewportHeight() - 140);
    }
});

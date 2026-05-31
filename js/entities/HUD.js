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
        this.addChild(new game.HUD.MuteButton(me.game.viewport.width - 60, 20));
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

        // [Manutencao - Gabriel Guarnieri] CR#8 Estado para pulso de escala no score
        this.lastSteps = game.data.steps;
        this.scale = 1.0;
        this.scaleTween = null;

        // make sure we use screen coordinates
        this.floating = true;
    },

    // [Manutencao - Gabriel Guarnieri] CR#8 Dispara tween de pulso quando game.data.steps incrementa
    update: function(dt) {
        if (game.data.steps > this.lastSteps) {
            this.lastSteps = game.data.steps;
            if (this.scaleTween) {
                this.scaleTween.stop();
            }
            this.scale = 1.5;
            this.scaleTween = new me.Tween(this)
                .to({ scale: 1.0 }, 220)
                .easing(me.Tween.Easing.Quadratic.Out)
                .start();
            return true;
        }
        return false;
    },

    draw: function (renderer) {
        if (game.data.start && me.state.isCurrent(me.state.PLAY)) {
            // [Manutencao - Gabriel Guarnieri] CR#8 Scale centrado no texto durante o pop
            var cx = me.game.viewport.width / 2;
            var cy = 50;
            renderer.save();
            renderer.translate(cx, cy);
            renderer.scale(this.scale, this.scale);
            this.stepsFont.draw(renderer, game.data.steps, 0, -40);
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
            var px = (event && (event.gameX !== undefined ? event.gameX : event.clientX)) || 0;
            var py = (event && (event.gameY !== undefined ? event.gameY : event.clientY)) || 0;
            if (that.containsPoint(px, py)) {
                that.toggleMute();
                if (event && typeof event.stopPropagation === 'function') { event.stopPropagation(); }
            }
        };
    },

    onActivateEvent: function () {
        me.input.registerPointerEvent('pointerdown', this, this.pointerHandler);
    },

    onDeactivateEvent: function () {
        me.input.releasePointerEvent('pointerdown', this);
    },

    containsPoint: function (x, y) {
        return x >= this.pos.x && x <= this.pos.x + this.width &&
               y >= this.pos.y && y <= this.pos.y + this.height;
    },

    toggleMute: function () {
        game.toggleMute();
    },

    // Invocado por testes unitários e retrocompatibilidade
    onClick: function () {
        this.toggleMute();
        return true;
    },

    draw: function (renderer) {
        if (!me.state.isCurrent(me.state.PLAY)) { return; }
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
        this._super(me.Renderable, 'init', [0, 0, me.game.viewport.width, me.game.viewport.height]);
        this.floating = true;
        this.font = new me.Font('gamefont', 64, '#fff', 'center');
        this.name = 'pause-overlay';
    },

    draw: function (renderer) {
        if (!game.data.paused) { return; }
        if (typeof renderer.setColor === 'function') {
            renderer.setColor('rgba(0,0,0,0.5)');
        }
        if (typeof renderer.fillRect === 'function') {
            renderer.fillRect(0, 0, this.width, this.height);
        }
        this.font.draw(renderer, 'PAUSED', this.width / 2, this.height / 2 - 40);
    }
});

// [Manutencao - Marcos Winicios] CR#15 Overlay de tonalizacao para o tema atual
game.HUD.ThemeOverlay = me.Renderable.extend({
    init: function () {
        this._super(me.Renderable, 'init', [0, 0, me.game.viewport.width, me.game.viewport.height]);
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
        if (!me.state.isCurrent(me.state.PLAY)) { return; }
        var theme = game.data.theme || 'day';
        var alpha = game.themeAlpha(theme);
        if (alpha <= 0) { return; }
        if (typeof renderer.setColor === 'function') {
            renderer.setColor(game.themeColor(theme));
        }
        if (typeof renderer.setGlobalAlpha === 'function') {
            renderer.setGlobalAlpha(alpha);
        }
        if (typeof renderer.fillRect === 'function') {
            renderer.fillRect(0, 0, this.width, this.height);
        }
        if (typeof renderer.setGlobalAlpha === 'function') {
            renderer.setGlobalAlpha(1);
        }
    }
});

var BackgroundLayer = me.ImageLayer.extend({
    init: function(image, z, speed) {
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
        var xpos = me.game.viewport.width/2 - measure.width/2;
        var ypos = me.game.viewport.height/2 + 50;
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
        var top = (typeof me.save.topSteps === 'number') ? me.save.topSteps : 0;
        var text = 'HIGH SCORE: ' + top;
        var measure = this.font.measureText(renderer, text);
        this.font.draw(renderer, text, me.game.viewport.width/2 - measure.width/2, 30);
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
        this.font.draw(renderer, text, me.game.viewport.width/2 - measure.width/2,
            me.game.viewport.height - 140);
    }
});

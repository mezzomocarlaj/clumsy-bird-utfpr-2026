game.HUD = game.HUD || {};

game.HUD.Container = me.Container.extend({
    init: function() {
        this._super(me.Container, 'init');
        this.isPersistent = true;
        this.collidable = false;
        this.z = Infinity;
        this.name = "HUD";

        this.addChild(new game.HUD.ScoreItem(5, 5));

        // [SC2 - Carla] Botão de mute na HUD
        this.addChild(new game.HUD.MuteButton());
    }
});


game.HUD.ScoreItem = me.Renderable.extend({
    init: function(x, y) {
        this._super(me.Renderable, "init", [x, y, 10, 10]);
        this.stepsFont = new me.Font('gamefont', 80, '#000', 'center');
        this.floating = true;
    },

    draw: function (renderer) {
        if (game.data.start && me.state.isCurrent(me.state.PLAY))
            this.stepsFont.draw(renderer, game.data.steps, me.game.viewport.width/2, 10);
    }
});

// [SC2 - Carla] Botão clicável de mute/unmute
game.HUD.MuteButton = me.Renderable.extend({
    init: function() {
        this._super(me.Renderable, 'init', [0, 0, 36, 36]);
        this.floating = true;
        this.font = new me.Font('gamefont', 20, '#fff', 'center');
        me.input.registerPointerEvent('pointerdown', this, this.onPointerDown.bind(this));
    },

    onPointerDown: function(event) {
        game.data.muted = !game.data.muted;
        if (game.data.muted) {
            me.audio.disable();
        } else {
            me.audio.enable();
            me.audio.stop("theme");
            var vol = me.device.ua.indexOf("Firefox") !== -1 ? 0.3 : 0.5;
            me.audio.setVolume(vol);
            me.audio.play("theme", true);
        }
        return false;
    },

    draw: function(renderer) {
        // [SC2 - Carla] Calcula posição no draw para garantir viewport já inicializado
        var bx = me.game.viewport.width - 44;
        var by = 8;

        // Atualiza a posição do objeto para que o hit area do pointer acompanhe
        this.pos.x = bx;
        this.pos.y = by;

        // Verde = som ativo, Vermelho = mutado
        renderer.setColor(game.data.muted ? '#c03030' : '#30a030');
        renderer.fillRect(bx, by, this.width, this.height);

        renderer.setColor('#000000');
        renderer.strokeRect(bx, by, this.width, this.height);

        var label = game.data.muted ? 'M' : 'S';
        this.font.draw(renderer, label, bx + this.width / 2, by + 4);
    },

    onDestroyEvent: function() {
        me.input.releasePointerEvent('pointerdown', this);
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
        this._super(me.ImageLayer, 'init', [0, 0, settings]);
    },

    update: function() {
        if (me.input.isKeyPressed('mute')) {
            game.data.muted = !game.data.muted;
            if (game.data.muted){
                me.audio.disable();
            }else{
                me.audio.enable();
                me.audio.stop("theme");
                me.audio.play("theme", true);
            }
        }
        return true;
    }
});

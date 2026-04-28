game.TitleScreen = me.ScreenObject.extend({
    init: function(){
        this._super(me.ScreenObject, 'init');
        this.font = null;
        this.ground1 = null;
        this.ground2 = null;
        this.logo = null;
    },

    onResetEvent: function() {
        me.audio.stop("theme");
        game.data.newHiScore = false;

        // [Manutencao - Carla Mezzomo] CR#1 Garante topSteps disponivel ao exibir o menu
        if (typeof me.save.topSteps === 'undefined') {
            me.save.add({ topSteps: 0 });
        }
        // [Manutencao - Gabriel de Oliveira] CR#5 Restaura skin persistida, se houver
        if (typeof me.save.skin === 'string' && game.skins.indexOf(me.save.skin) >= 0) {
            game.data.skin = me.save.skin;
        }

        me.game.world.addChild(new BackgroundLayer('bg', 1));
        me.input.bindKey(me.input.KEY.ENTER, "enter", true);
        me.input.bindKey(me.input.KEY.SPACE, "enter", true);
        // [Manutencao - Gabriel de Oliveira] CR#5 Tecla S cicla entre skins no menu
        me.input.bindKey(me.input.KEY.S, "cycleSkin", true);
        me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.ENTER);

        this.handler = me.event.subscribe(me.event.KEYDOWN, function (action, keyCode, edge) {
            if (action === "enter") {
                me.state.change(me.state.PLAY);
            }
            if (action === "cycleSkin") {
                game.nextSkin();
            }
        });

        //logo
        this.logo = new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2 - 20,
            {image: 'logo'}
        );
        me.game.world.addChild(this.logo, 10);

        var that = this;
        var logoTween = me.pool.pull("me.Tween", this.logo.pos)
            .to({y: me.game.viewport.height/2 - 100}, 1000)
            .easing(me.Tween.Easing.Exponential.InOut).start();

        this.ground1 = me.pool.pull("ground", 0, me.video.renderer.getHeight() - 96);
        this.ground2 = me.pool.pull("ground", me.video.renderer.getWidth(),
                                    me.video.renderer.getHeight() - 96);
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        me.game.world.addChild(new (me.Renderable.extend ({
            // constructor
            init: function() {
                // size does not matter, it's just to avoid having a zero size
                // renderable
                this._super(me.Renderable, 'init', [0, 0, 100, 100]);
                this.text = me.device.touch ? 'Tap to start' : 'PRESS SPACE OR CLICK LEFT MOUSE BUTTON TO START \n\t\t\t\t\t\t\t\t\t\t\tPRESS "M" TO MUTE SOUND';
                this.font = new me.Font('gamefont', 20, '#000');
            },
            draw: function (renderer) {
                var measure = this.font.measureText(renderer, this.text);
                var xpos = me.game.viewport.width/2 - measure.width/2;
                var ypos = me.game.viewport.height/2 + 50;
                this.font.draw(renderer, this.text, xpos, ypos);
            }
        })), 12);

        // [Manutencao - Carla Mezzomo] CR#1 HUD do menu exibe "HIGH SCORE: N" persistido
        this.hiScoreLabel = new (me.Renderable.extend({
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
        }))();
        me.game.world.addChild(this.hiScoreLabel, 13);

        // [Manutencao - Gabriel de Oliveira] CR#5 Label da skin atual e instrucao para trocar
        this.skinLabel = new (me.Renderable.extend({
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
        }))();
        me.game.world.addChild(this.skinLabel, 13);
    },

    onDestroyEvent: function() {
        // unregister the event
        me.event.unsubscribe(this.handler);
        me.input.unbindKey(me.input.KEY.ENTER);
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindKey(me.input.KEY.S);
        me.input.unbindPointer(me.input.pointer.LEFT);
        this.ground1 = null;
        this.ground2 = null;
        me.game.world.removeChild(this.logo);
        this.logo = null;
        this.hiScoreLabel = null;
        this.skinLabel = null;
    }
});

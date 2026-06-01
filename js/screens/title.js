game.TitleScreen = me.ScreenObject.extend({
    init: function(){
        this._super(me.ScreenObject, 'init');
        this.font = null;
        this.ground1 = null;
        this.ground2 = null;
        this.logo = null;
    },

    onResetEvent: function() {
        me.audio.stopTrack();
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
            game.viewportWidth()/2,
            game.viewportHeight()/2 - 20,
            {image: 'logo'}
        );
        me.game.world.addChild(this.logo, 10);

        // [Refatoracao - Marcos Winicios] E7-Codigo-Morto: Remove Dead Code
        // "var that = this" e o binding "logoTween" nunca eram lidos; mantem-se o efeito.
        me.pool.pull("me.Tween", this.logo.pos)
            .to({y: game.viewportHeight()/2 - 100}, 1000)
            .easing(me.Tween.Easing.Exponential.InOut).start();

        // [Refatoracao - Leonardo Santos] E7-Duplicacao: chao via fabrica game.createGround
        this.ground1 = game.createGround(0);
        this.ground2 = game.createGround(game.viewportWidth());
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        me.game.world.addChild(new game.HUD.TitleText(), 12);

        // [Manutencao - Carla Mezzomo] CR#1 HUD do menu exibe "HIGH SCORE: N" persistido
        this.hiScoreLabel = new game.HUD.HiScoreLabel();
        me.game.world.addChild(this.hiScoreLabel, 13);

        // [Manutencao - Gabriel de Oliveira] CR#5 Label da skin atual e instrucao para trocar
        this.skinLabel = new game.HUD.SkinLabel();
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

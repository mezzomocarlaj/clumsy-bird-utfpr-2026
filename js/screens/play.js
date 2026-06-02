game.PlayScreen = me.ScreenObject.extend({
    init: function() {
        // [Refatoracao - Gabriel de Oliveira] R4: Replace Temp with Query
        me.audio.setVolume(this.getInitialVolume());
        this._super(me.ScreenObject, 'init');
    },

    // [Refatoracao - Gabriel de Oliveira] R4: Método de consulta para o volume padrão
    getInitialVolume: function() {
        // lower audio volume on firefox browser
        return me.device.ua.indexOf("Firefox") !== -1 ? 0.3 : 0.5;
    },

    onResetEvent: function() {
        me.game.reset();
        if (game.data.muted) {
            me.audio.disable();
        } else if (!me.audio.getCurrentTrack()) {
            me.audio.playTrack("theme");
        }

        me.input.bindKey(me.input.KEY.SPACE, "fly", true);
        // [Manutencao - Leonardo Santos] CR#12 Seta para cima e W tambem disparam "fly"
        me.input.bindKey(me.input.KEY.UP, "fly", true);
        me.input.bindKey(me.input.KEY.W, "fly", true);
        // [Manutencao - Gabriel de Oliveira] CR#4 Teclas P/ESC sao re-vinculadas a acao "pause"
        me.input.bindKey(me.input.KEY.P, "pause", true);
        me.input.bindKey(me.input.KEY.ESC, "pause", true);

        game.data.score = 0;
        game.data.steps = 0;
        game.data.start = false;
        game.data.newHiScore = false;
        // [Manutencao - Gabriel de Oliveira] CR#4 Reseta estado de pausa ao iniciar partida
        game.data.paused = false;
        // [Manutencao - Marcos Winicios] CR#15 Reinicia tema para "day" a cada partida
        game.data.theme = 'day';

        me.game.world.addChild(new BackgroundLayer('bg', 1));

        this.ground1 = me.pool.pull('ground', 0, me.game.viewport.height - 96);
        this.ground2 = me.pool.pull('ground', me.game.viewport.width,
            me.game.viewport.height - 96);
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        this.HUD = new game.HUD.Container();
        me.game.world.addChild(this.HUD, 11);

        this.bird = me.pool.pull("clumsy", 60, me.game.viewport.height/2 - 100);
        me.game.world.addChild(this.bird, 10);

        //inputs
        me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.SPACE);
        // [Manutencao - Marcos Winicios] CR#14 Botao direito tambem dispara "fly"
        me.input.bindPointer(me.input.pointer.RIGHT, me.input.KEY.SPACE);

        // [Manutencao - Gabriel de Oliveira] CR#4 Toggle de pausa via teclado (P/ESC)
        var self = this;
        this.pauseHandler = me.event.subscribe(me.event.KEYDOWN, function (action) {
            if (action === 'pause' && game.data.start) {
                self.togglePause();
            }
        });

        this.getReady = new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2,
            {image: 'getready'}
        );
        me.game.world.addChild(this.getReady, 11);

        var that = this;
        var fadeOut = new me.Tween(this.getReady).to({alpha: 0}, 2000)
            .easing(me.Tween.Easing.Linear.None)
            .onComplete(function() {
                game.data.start = true;
                me.game.world.addChild(new game.PipeGenerator(), 0);
                me.game.world.removeChild(that.getReady);
            }).start();
    },

    // [Manutencao - Gabriel de Oliveira] CR#4 Alterna estado pausado/rodando e aciona me.state.pause/resume
    togglePause: function () {
        var overlay = typeof document !== 'undefined' ? document.getElementById('pause-overlay') : null;
        if (game.data.paused) {
            game.data.paused = false;
            if (me.state.resume) { me.state.resume(); }
            me.audio.resumeTrack();
            if (overlay) { overlay.classList.remove('visible'); }
        } else {
            game.data.paused = true;
            if (me.state.pause) { me.state.pause(); }
            me.audio.pauseTrack();
            if (overlay) { overlay.classList.add('visible'); }
        }
        return game.data.paused;
    },

    onDestroyEvent: function() {
        // free the stored instance
        this.HUD = null;
        this.bird = null;
        this.ground1 = null;
        this.ground2 = null;
        if (this.pauseHandler) { me.event.unsubscribe(this.pauseHandler); this.pauseHandler = null; }
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindKey(me.input.KEY.UP);
        me.input.unbindKey(me.input.KEY.W);
        me.input.unbindKey(me.input.KEY.P);
        me.input.unbindKey(me.input.KEY.ESC);
        me.input.unbindPointer(me.input.pointer.LEFT);
        me.input.unbindPointer(me.input.pointer.RIGHT);
        // [Manutencao - Gabriel de Oliveira] CR#4 Garante que a pausa nao vaze para a proxima tela
        game.data.paused = false;
        if (me.state.resume) { me.state.resume(); }
        var overlay = typeof document !== 'undefined' ? document.getElementById('pause-overlay') : null;
        if (overlay) { overlay.classList.remove('visible'); }
    }
});

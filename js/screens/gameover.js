game.GameOverScreen = me.ScreenObject.extend({
    init: function() {
        this.savedData = null;
        this.handler = null;
    },

    onResetEvent: function() {
        // [Refatoracao - Gabriel de Oliveira] R1: Move Method - delega a persistência de recorde para o game
        game.updateHighScore(game.data.steps);
        me.input.bindKey(me.input.KEY.ENTER, "enter", true);
        me.input.bindKey(me.input.KEY.SPACE, "enter", false);
        me.input.unbindPointer(me.input.pointer.LEFT);
        
        var that = this;
        this.pointerHandler = function (event) {
            var px = (event && (event.gameX !== undefined ? event.gameX : event.clientX)) || 0;
            var py = (event && (event.gameY !== undefined ? event.gameY : event.clientY)) || 0;
            var dpi = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
            var vWidth = game.viewportWidth();
            if ((px >= vWidth - 60 && px <= vWidth - 20 && py >= 20 && py <= 60) ||
                (px / dpi >= vWidth - 60 && px / dpi <= vWidth - 20 && py / dpi >= 20 && py / dpi <= 60) ||
                (px >= (vWidth - 60) * dpi && px <= (vWidth - 20) * dpi && py >= 20 * dpi && py <= 60 * dpi)) {
                return;
            }
            me.state.change(me.state.MENU);
        };
        me.input.registerPointerEvent('pointerdown', me.game.world, this.pointerHandler);

        this.handler = me.event.subscribe(me.event.KEYDOWN,
            function (action, keyCode, edge) {
                if (action === "enter") {
                    me.state.change(me.state.MENU);
                }
                if (action === "mute") {
                    game.toggleMute();
                }
            });

        me.game.world.addChild(new me.Sprite(
            game.viewportWidth()/2,
            game.viewportHeight()/2 - 100,
            {image: 'gameover'}
        ), 12);

        var gameOverBG = new me.Sprite(
            game.viewportWidth()/2,
            game.viewportHeight()/2,
            {image: 'gameoverbg'}
        );
        me.game.world.addChild(gameOverBG, 10);

        me.game.world.addChild(new BackgroundLayer('bg', 1));

        // ground
        // [Refatoracao - Leonardo Santos] E7-Duplicacao: chao via fabrica game.createGround
        this.ground1 = game.createGround(0);
        this.ground2 = game.createGround(game.viewportWidth());
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        // add the dialog witht he game information
        if (game.data.newHiScore) {
            var newRect = new me.Sprite(
                gameOverBG.width/2,
                gameOverBG.height/2,
                {image: 'new'}
            );
            me.game.world.addChild(newRect, 12);
        }

        this.dialog = new (me.Renderable.extend({
            // constructor
            init: function() {
                this._super(me.Renderable, 'init',
                    [0, 0, game.viewportWidth()/2, game.viewportHeight()/2]
                );
                this.font = new me.Font('gamefont', 40, 'black', 'left');
                this.steps = 'Steps: ' + game.data.steps.toString();
                // [Refatoracao - Leonardo Santos] E7-Acesso-Disperso: leitura do recorde via game.topScore()
                var top = game.topScore();
                this.topSteps= 'Higher Step: ' + top.toString();
            },

            draw: function (renderer) {
                var stepsText = this.font.measureText(renderer, this.steps);

                //steps
                this.font.draw(
                    renderer,
                    this.steps,
                    game.viewportWidth()/2 - stepsText.width/2 - 60,
                    game.viewportHeight()/2
                );

                //top score
                this.font.draw(
                    renderer,
                    this.topSteps,
                    game.viewportWidth()/2 - stepsText.width/2 - 60,
                    game.viewportHeight()/2 + 50
                );
            }
        }))();
        me.game.world.addChild(this.dialog, 12);

        this.muteButton = new game.HUD.MuteButton(game.viewportWidth() - 60, 20);
        me.game.world.addChild(this.muteButton, 13);
    },

    onDestroyEvent: function() {
        // unregister the event
        me.event.unsubscribe(this.handler);
        me.input.unbindKey(me.input.KEY.ENTER);
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.releasePointerEvent('pointerdown', me.game.world);
        this.ground1 = null;
        this.ground2 = null;
        this.font = null;
        if (this.muteButton) {
            me.game.world.removeChild(this.muteButton);
            this.muteButton = null;
        }
        me.audio.stopTrack();
    }
});

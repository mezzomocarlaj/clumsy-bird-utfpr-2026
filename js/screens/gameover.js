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
        me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.ENTER);

        this.handler = me.event.subscribe(me.event.KEYDOWN,
            function (action, keyCode, edge) {
                if (action === "enter") {
                    me.state.change(me.state.MENU);
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
    },

    onDestroyEvent: function() {
        // unregister the event
        me.event.unsubscribe(this.handler);
        me.input.unbindKey(me.input.KEY.ENTER);
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindPointer(me.input.pointer.LEFT);
        this.ground1 = null;
        this.ground2 = null;
        this.font = null;
        me.audio.stopTrack();
    }
});

var game = {
    data: {
        score : 0,
        steps: 0,
        start: false,
        newHiScore: false,
        muted: false,
        // [Manutencao - Gabriel de Oliveira] CR#4 Estado de pausa global
        paused: false,
        // [Manutencao - Gabriel de Oliveira] CR#5 Skin selecionada no menu
        skin: 'clumsy',
        // [Manutencao - Marcos Winicios] CR#15 Tema atual (day/sunset/night)
        theme: 'day'
    },

    // [Manutencao - Gabriel de Oliveira] CR#5 Lista de skins disponiveis
    skins: ['clumsy', 'clumsy_blue', 'clumsy_red'],

    resources: [
            // images
        {name: "bg", type:"image", src: "data/img/bg.png"},
        {name: "clumsy", type:"image", src: "data/img/clumsy.png"},
        {name: "clumsy_blue", type:"image", src: "data/img/clumsy.png"},
        {name: "clumsy_red", type:"image", src: "data/img/clumsy.png"},
        {name: "pipe", type:"image", src: "data/img/pipe.png"},
        {name: "logo", type:"image", src: "data/img/logo.png"},
        {name: "ground", type:"image", src: "data/img/ground.png"},
        {name: "gameover", type:"image", src: "data/img/gameover.png"},
        {name: "gameoverbg", type:"image", src: "data/img/gameoverbg.png"},
        {name: "hit", type:"image", src: "data/img/hit.png"},
        {name: "getready", type:"image", src: "data/img/getready.png"},
        {name: "new", type:"image", src: "data/img/new.png"},
        {name: "share", type:"image", src: "data/img/share.png"},
        {name: "tweet", type:"image", src: "data/img/tweet.png"},
        // sounds
        {name: "theme", type: "audio", src: "data/bgm/"},
        {name: "hit", type: "audio", src: "data/sfx/"},
        {name: "lose", type: "audio", src: "data/sfx/"},
        {name: "wing", type: "audio", src: "data/sfx/"},

    ],

    "onload": function() {
        me.state.GAME_OVER = me.state.GAMEOVER || 2;
        if (!me.video.init(900, 600, {
            wrapper: "screen",
            scale : "auto",
            scaleMethod: "fit"
        })) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }
        me.audio.init("mp3,ogg");
        me.loader.preload(game.resources, this.loaded.bind(this));

        // [Manutencao - Marcos Winicios] CR#13 Desabilita menu de contexto do canvas
        if (typeof document !== 'undefined' && document.addEventListener) {
            var screenEl = document.getElementById('screen');
            var handler = function (e) { e.preventDefault(); return false; };
            if (screenEl) { screenEl.addEventListener('contextmenu', handler, false); }
            document.addEventListener('contextmenu', function (e) {
                if (e.target && (e.target.tagName === 'CANVAS' ||
                    (e.target.id === 'screen') ||
                    (e.target.parentNode && e.target.parentNode.id === 'screen'))) {
                    e.preventDefault();
                    return false;
                }
            }, false);
        }
    },

    "loaded": function() {
        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());
        me.state.set(me.state.GAME_OVER, new game.GameOverScreen());

        // [Manutencao - Gabriel Guarnieri] CR#7 Transicao fade 250ms entre MENU/PLAY/GAME_OVER
        me.state.transition("fade", "#000", 250);

        me.input.bindKey(me.input.KEY.SPACE, "fly", true);
        // [Manutencao - Leonardo Santos] CR#12 Teclas W e Seta para Cima tambem disparam pulo
        me.input.bindKey(me.input.KEY.UP, "fly", true);
        me.input.bindKey(me.input.KEY.W, "fly", true);
        me.input.bindKey(me.input.KEY.M, "mute", true);
        // [Manutencao - Gabriel de Oliveira] CR#4 Teclas P e ESC pausam/retomam
        me.input.bindKey(me.input.KEY.P, "pause", true);
        me.input.bindKey(me.input.KEY.ESC, "pause", true);
        me.input.bindPointer(me.input.KEY.SPACE);
        // [Manutencao - Marcos Winicios] CR#14 Botao direito do mouse dispara pulo
        me.input.bindPointer(me.input.pointer.RIGHT, me.input.KEY.SPACE);

        me.pool.register("clumsy", game.BirdEntity);
        me.pool.register("pipe", game.PipeEntity, true);
        me.pool.register("hit", game.HitEntity, true);
        me.pool.register("ground", game.Ground, true);

        // [Manutencao - Carla Mezzomo] CR#1 Inicializa topSteps persistente
        if (typeof me.save.topSteps === 'undefined') {
            me.save.add({ topSteps: 0 });
        }

        me.state.change(me.state.MENU);
    },

    // [Manutencao - Marcos Winicios] CR#15 Calcula tema a partir de steps
    themeForSteps: function (steps) {
        if (steps >= 50) { return 'night'; }
        if (steps >= 25) { return 'sunset'; }
        return 'day';
    },

    // [Manutencao - Marcos Winicios] CR#15 Cor associada ao tema (overlay tonal)
    themeColor: function (theme) {
        if (theme === 'night') { return '#0b1a3a'; }
        if (theme === 'sunset') { return '#ff9a5c'; }
        return '#ffffff';
    },

    // [Manutencao - Marcos Winicios] CR#15 Alpha do overlay tonal (0 = sem filtro)
    themeAlpha: function (theme) {
        if (theme === 'night') { return 0.45; }
        if (theme === 'sunset') { return 0.25; }
        return 0;
    },

    // [Manutencao - Gabriel de Oliveira] CR#5 Troca skin e persiste escolha
    selectSkin: function (skin) {
        if (game.skins.indexOf(skin) < 0) { return false; }
        game.data.skin = skin;
        me.save.add({ skin: skin });
        me.save.skin = skin;
        return true;
    },

    // [Manutencao - Gabriel de Oliveira] CR#5 Proxima skin na rotacao (menu)
    nextSkin: function () {
        var idx = game.skins.indexOf(game.data.skin);
        var next = game.skins[(idx + 1) % game.skins.length];
        game.selectSkin(next);
        return next;
    },

    // [Refatoracao - Gabriel de Oliveira] R1: Move Method para centralizar persistência de score e recorde
    updateHighScore: function (steps) {
        var scoreData = {
            score: game.data.score,
            steps: steps
        };
        me.save.add(scoreData);

        if (typeof me.save.topSteps === 'undefined') {
            me.save.add({ topSteps: 0 });
        }
        if (steps > me.save.topSteps) {
            me.save.topSteps = steps;
            game.data.newHiScore = true;
        }
    },

    // [Refatoracao - Gabriel de Oliveira] Centraliza lógica de mute/unmute para teclado e clique
    toggleMute: function () {
        game.data.muted = !game.data.muted;
        if (game.data.muted) {
            me.audio.disable();
        } else {
            me.audio.enable();
        }
        return game.data.muted;
    }
};

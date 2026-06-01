// [Refatoracao - Leonardo Santos] E7-Primitive-Obsession: Combine Functions into Class
// Os flags soltos de game.data (um Data Clump mutado em todo o codigo) e a funcao que
// operava sobre eles (o reset da partida, antes espalhado em 6 atribuicoes soltas no
// PlayScreen.onResetEvent) sao agrupados numa unica classe GameState. Os dados e o
// comportamento que age sobre eles passam a morar juntos.
function GameState() {
    // estado persistente entre partidas (nao zerado a cada jogo)
    this.muted = false;
    this.skin = 'clumsy';      // [Manutencao - Gabriel de Oliveira] CR#5 Skin selecionada no menu
    this.reset();
}

// Funcao que opera sobre os dados, agora combinada na classe (Combine Functions into Class):
// zera apenas os campos por-partida em um lugar so.
GameState.prototype.reset = function () {
    this.score = 0;
    this.steps = 0;
    this.start = false;
    this.newHiScore = false;
    this.paused = false;       // [Manutencao - Gabriel de Oliveira] CR#4 Estado de pausa global
    this.theme = 'day';        // [Manutencao - Marcos Winicios] CR#15 Tema atual (day/sunset/night)
};

var game = {
    data: new GameState(),
    GameState: GameState,

    // [Manutencao - Gabriel de Oliveira] CR#5 Lista de skins disponiveis
    skins: ['clumsy', 'clumsy_blue', 'clumsy_red'],

    resources: [
            // images
        {name: "bg", type:"image", src: "data/img/bg.png"},
        {name: "clumsy", type:"image", src: "data/img/clumsy.png"},
        {name: "clumsy_blue", type:"image", src: "data/img/clumsy_blue.png"},
        {name: "clumsy_red", type:"image", src: "data/img/clumsy_red.png"},
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

    // [Refatoracao - Marcos Winicios] E7-Switch-Statements: Replace Conditional with Lookup Table
    // themeForSteps/themeColor/themeAlpha eram tres switches paralelos sobre o MESMO
    // conjunto de temas (day/sunset/night) — adicionar um tema exigia editar as 3 em
    // lockstep. Agora cada tema e UMA entrada nesta tabela de configuracao.
    THEMES: {
        day:    { minSteps: 0,  color: '#ffffff', alpha: 0    },
        sunset: { minSteps: 25, color: '#ff9a5c', alpha: 0.25 },
        night:  { minSteps: 50, color: '#0b1a3a', alpha: 0.45 }
    },

    // [Refatoracao - Marcos Winicios] E7-Loop-Imperativo: Replace Loop with Pipeline
    // O laco forEach com acumuladores mutaveis (chosen/chosenMin) escolhia o tema de maior
    // minSteps <= steps. Vira um pipeline declarativo: filtra os temas ja atingidos e
    // reduz ao de maior limiar. Sem variaveis de controle mutaveis; a intencao fica explicita.
    themeForSteps: function (steps) {
        var themes = game.THEMES;
        return Object.keys(themes)
            .filter(function (name) { return steps >= themes[name].minSteps; })
            .reduce(function (best, name) {
                return themes[name].minSteps > themes[best].minSteps ? name : best;
            }, 'day');
    },

    // [Manutencao - Marcos Winicios] CR#15 Cor associada ao tema (via tabela)
    themeColor: function (theme) {
        return (game.THEMES[theme] || game.THEMES.day).color;
    },

    // [Manutencao - Marcos Winicios] CR#15 Alpha do overlay tonal (via tabela)
    themeAlpha: function (theme) {
        return (game.THEMES[theme] || game.THEMES.day).alpha;
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

    // [Refatoracao - Leonardo Santos] E7-Message-Chains: Hide Delegate
    // As navegacoes longas/duplicadas "me.game.viewport.width/height" e
    // "me.video.renderer.getWidth()/getHeight()" (a mesma dimensao de tela escrita de
    // duas formas) expunham a topologia interna da engine. game passa a esconder esse
    // delegado: os clientes pedem a dimensao ao game e nao mais a "me.game.viewport".
    viewportWidth: function () {
        return me.game.viewport.width;
    },

    viewportHeight: function () {
        return me.game.viewport.height;
    },

    // [Refatoracao - Leonardo Santos] E7-Duplicacao: Replace Constructor with Factory Function
    // A criacao do chao se repetia em 3 telas (play/title/gameover), sempre fixando a
    // mesma linha de piso "viewportHeight() - 96" na chamada do construtor (me.pool.pull).
    // A fabrica concentra essa construcao: a linha do piso vive num lugar so.
    GROUND_OFFSET: 96,
    createGround: function (x) {
        return me.pool.pull('ground', x, game.viewportHeight() - game.GROUND_OFFSET);
    },

    // [Refatoracao - Leonardo Santos] E7-Acesso-Disperso: Encapsulate Variable
    // O recorde persistido "me.save.topSteps" era lido direto em varios pontos, cada um
    // com seu proprio default ("|| 0" aqui, "typeof === 'number' ? : 0" ali). O acesso de
    // leitura passa por uma unica funcao, com um default consistente.
    topScore: function () {
        return (typeof me.save.topSteps === 'number') ? me.save.topSteps : 0;
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

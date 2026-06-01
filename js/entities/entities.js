// [Refatoracao - Gabriel Felipe Guarnieri] E6-Numeros-Magicos: Replace Magic Number with Symbolic Constant
// Literais de fisica/hitbox antes espalhados pelo arquivo, agora nomeados num unico lugar.
var GRAVITY = 0.2;            // aceleracao da gravidade por tick (antes 0.2 em 4 pontos)
var JUMP_IMPULSE = 72;       // deslocamento vertical do pulo, em px (antes "currentPos - 72")
var CEILING_Y = -80;         // teto da tela: altura do passaro + 20px (antes hitSky = -80)
var BIRD_HITBOX = { x: 12, y: 10, width: 60, height: 40 }; // CR#10 hitbox permissiva do passaro
var PIPE_BODY_HEIGHT = 1664; // altura do sprite/corpo do cano (antes 1664 em 2 pontos)
var PIPE_GAP = 1240;         // tamanho do vao entre os canos (antes pipeHoleSize = 1240)

// [Refatoracao - Gabriel Felipe Guarnieri] E6-Codigo-Duplicado: Extract Method
// Centraliza a regra de pausa antes copiada em 5 metodos update() (CR#4 - Gabriel de Oliveira).
game.isFrozen = function () {
    return !!(game.data && game.data.paused);
};

// [Refatoracao - Gabriel Felipe Guarnieri] E6-Codigo-Duplicado: Form Template Method / Pull Up Method
// Bases que tratam o congelamento (pausa) de forma unica: update() aplica o guard
// e delega a logica ativa de cada entidade para updateActive(dt). Sem essa base, o
// mesmo "if (game.data.paused) return this._super(...)" estava duplicado em cada update().
game.FreezableEntity = me.Entity.extend({
    update: function (dt) {
        if (game.isFrozen()) {
            return this._super(me.Entity, 'update', [dt]);
        }
        return this.updateActive(dt);
    },
    // Hook padrao; subclasses sobrescrevem com sua propria fisica/movimento.
    updateActive: function (dt) {
        return this._super(me.Entity, 'update', [dt]);
    }
});

game.FreezableRenderable = me.Renderable.extend({
    update: function (dt) {
        if (game.isFrozen()) {
            return this._super(me.Renderable, 'update', [dt]);
        }
        return this.updateActive(dt);
    },
    updateActive: function (dt) {
        return this._super(me.Renderable, 'update', [dt]);
    }
});

game.BirdEntity = game.FreezableEntity.extend({
    init: function(x, y) {
        var settings = {};
        // [Manutencao - Gabriel de Oliveira] CR#5 Usa a skin ativa em game.data.skin
        settings.image = (game.data && game.data.skin) ? game.data.skin : 'clumsy';
        settings.width = 85;
        settings.height = 60;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = GRAVITY;
        this.maxAngleRotation = Number.prototype.degToRad(-30);
        this.maxAngleRotationDown = Number.prototype.degToRad(35);
        this.renderable.addAnimation("flying", [0, 1, 2]);
        this.renderable.addAnimation("idle", [0]);
        this.renderable.setCurrentAnimation("flying");
        this.body.removeShapeAt(0);
        // [Manutencao - Leonardo Santos] CR#10 Hitbox mais permissiva: 60x40 centrada no sprite (antes 71x51)
        this.body.addShape(new me.Ellipse(BIRD_HITBOX.x, BIRD_HITBOX.y, BIRD_HITBOX.width, BIRD_HITBOX.height));

        // a tween object for the flying physic effect
        this.flyTween = new me.Tween(this.pos);
        this.flyTween.easing(me.Tween.Easing.Exponential.InOut);

        this.currentAngle = 0;
        this.angleTween = new me.Tween(this);
        this.angleTween.easing(me.Tween.Easing.Exponential.InOut);

        // end animation tween
        this.endTween = null;

        // collision shape
        this.collided = false;

        this.gravityForce = GRAVITY;
    },

    // [Refatoracao - Gabriel Felipe Guarnieri] E6-Codigo-Duplicado: guard de pausa movido para o Template Method (game.FreezableEntity.update)
    updateActive: function(dt) {
        this.pos.x = 60;
        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        this.renderable.currentTransform.identity();
        
        // [Refatoracao - Gabriel de Oliveira] R3: Decompose Conditional
        if (me.input.isKeyPressed('fly')) {
            this.jump();
        } else {
            this.fall();
        }
        
        this.renderable.currentTransform.rotate(this.currentAngle);
        me.Rect.prototype.updateBounds.apply(this);

        var hitSky = CEILING_Y; // bird height + 20px
        if (this.pos.y <= hitSky || this.collided) {
            game.data.start = false;
            me.audio.play("lose");
            this.endAnimation();
            return false;
        }
        me.collision.check(this);
        this._super(me.Entity, 'update', [dt]);
        return true;
    },

    // [Refatoracao - Gabriel de Oliveira] R3: Método extraído para ação de pulo
    jump: function () {
        var that = this;
        me.audio.play('wing');
        this.gravityForce = GRAVITY;
        var currentPos = this.pos.y;

        this.angleTween.stop();
        this.flyTween.stop();

        this.flyTween.to({y: currentPos - JUMP_IMPULSE}, 50);
        this.flyTween.start();

        this.angleTween.to({currentAngle: that.maxAngleRotation}, 50).onComplete(function(angle) {
            that.renderable.currentTransform.rotate(that.maxAngleRotation);
        });
        this.angleTween.start();
    },

    // [Refatoracao - Gabriel de Oliveira] R3: Método extraído para ação de queda (gravidade)
    fall: function () {
        this.gravityForce += GRAVITY;
        this.pos.y += me.timer.tick * this.gravityForce;
        this.currentAngle += Number.prototype.degToRad(3);
        if (this.currentAngle >= this.maxAngleRotationDown) {
            this.renderable.currentTransform.identity();
            this.currentAngle = this.maxAngleRotationDown;
        }
    },

    onCollision: function(response) {
        var obj = response.b;
        if (obj.type === 'pipe' || obj.type === 'ground') {
            me.device.vibrate(500);
            this.collided = true;
        }
        // remove the hit box
        if (obj.type === 'hit') {
            me.game.world.removeChildNow(obj);
            game.data.steps++;
            me.audio.play('hit');
        }
    },

    endAnimation: function() {
        // [Manutencao - Gabriel Guarnieri] CR#9 Screen shake 500ms na colisao
        me.game.viewport.shake(8, 500, me.game.viewport.AXIS.BOTH);
        me.game.viewport.fadeOut("#fff", 100);
        var currentPos = this.pos.y;
        this.endTween = new me.Tween(this.pos);
        this.endTween.easing(me.Tween.Easing.Exponential.InOut);

        this.flyTween.stop();
        this.renderable.currentTransform.identity();
        this.renderable.currentTransform.rotate(Number.prototype.degToRad(90));
        var finalPos = game.viewportHeight() - this.renderable.width/2 - 96;
        this.endTween
            .to({y: currentPos}, 1000)
            .to({y: finalPos}, 1000)
            .onComplete(function() {
                me.state.change(me.state.GAME_OVER);
            });
        this.endTween.start();
    }

});


game.PipeEntity = game.FreezableEntity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('pipe');
        settings.width = 148;
        settings.height= PIPE_BODY_HEIGHT;
        settings.framewidth = 148;
        settings.frameheight = PIPE_BODY_HEIGHT;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.body.vel.set(-5, 0);
        this.type = 'pipe';
        // [Manutencao - Leonardo Santos] CR#10 Hitbox do cano reduzida em 10px de cada lado
        this.body.removeShapeAt(0);
        this.body.addShape(new me.Rect(10, 0, settings.width - 20, settings.height));
    },

    // [Refatoracao - Gabriel Felipe Guarnieri] E6-Codigo-Duplicado: guard de pausa movido para o Template Method
    updateActive: function(dt) {
        // mechanics
        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        this.pos.add(this.body.vel);
        if (this.pos.x < -this.image.width) {
            me.game.world.removeChild(this);
        }
        me.Rect.prototype.updateBounds.apply(this);
        this._super(me.Entity, 'update', [dt]);
        return true;
    },

});

game.PipeGenerator = game.FreezableRenderable.extend({
    init: function() {
        this._super(me.Renderable, 'init', [0, game.viewportWidth(), game.viewportHeight(), 92]);
        this.alwaysUpdate = true;
        this.generate = 0;
        this.pipeFrequency = 92;
        this.pipeHoleSize = PIPE_GAP;
        this.posX = game.viewportWidth();
    },

    // [Refatoracao - Gabriel Felipe Guarnieri] E6-Codigo-Duplicado: guard de pausa movido para o Template Method;
    // corrige tambem a inconsistencia que passava me.Entity numa classe que estende me.Renderable.
    updateActive: function(dt) {
        if (this.generate++ % this.pipeFrequency == 0) {
            // [Refatoracao - Gabriel Felipe Guarnieri] E6-Extract-Variable: Extract Variable
            // A altura da tela era consultada duas vezes (topo e base do vao). Nomear o
            // valor numa variavel local explicita o calculo do par de canos e evita
            // recalcular o mesmo getter no meio da expressao.
            var screenHeight = game.viewportHeight();
            var posY = Number.prototype.random(
                    screenHeight - 100,
                    200
            );
            var posY2 = posY - screenHeight - this.pipeHoleSize;
            var pipe1 = new me.pool.pull('pipe', this.posX, posY);
            var pipe2 = new me.pool.pull('pipe', this.posX, posY2);
            var hitPos = posY - 100;
            var hit = new me.pool.pull("hit", this.posX, hitPos);
            pipe1.renderable.currentTransform.scaleY(-1);
            me.game.world.addChild(pipe1, 10);
            me.game.world.addChild(pipe2, 10);
            me.game.world.addChild(hit, 11);
        }
        this._super(me.Renderable, "update", [dt]);
    },

});

game.HitEntity = game.FreezableEntity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('hit');
        settings.width = 148;
        settings.height= 60;
        settings.framewidth = 148;
        settings.frameheight = 60;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.updateTime = false;
        this.renderable.alpha = 0;
        this.body.accel.set(-5, 0);
        this.body.removeShapeAt(0);
        // [Manutencao - Leonardo Santos] CR#10 Hitbox de pontuacao com folga maior (permite passar mais cedo)
        this.body.addShape(new me.Rect(0, 0, settings.width - 30, settings.height - 30));
        this.type = 'hit';
    },

    // [Refatoracao - Gabriel Felipe Guarnieri] E6-Codigo-Duplicado: guard de pausa movido para o Template Method
    updateActive: function(dt) {
        // mechanics
        this.pos.add(this.body.accel);
        if (this.pos.x < -this.image.width) {
            me.game.world.removeChild(this);
        }
        me.Rect.prototype.updateBounds.apply(this);
        this._super(me.Entity, "update", [dt]);
        return true;
    },

});

game.Ground = game.FreezableEntity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = me.loader.getImage('ground');
        settings.width = 900;
        settings.height= 96;
        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.body.vel.set(-4, 0);
        this.type = 'ground';
    },

    // [Refatoracao - Gabriel Felipe Guarnieri] E6-Codigo-Duplicado: guard de pausa movido para o Template Method
    updateActive: function(dt) {
        // mechanics
        this.pos.add(this.body.vel);
        if (this.pos.x < -this.renderable.width) {
            this.pos.x = game.viewportWidth() - 10;
        }
        me.Rect.prototype.updateBounds.apply(this);
        return this._super(me.Entity, 'update', [dt]);
    },

});

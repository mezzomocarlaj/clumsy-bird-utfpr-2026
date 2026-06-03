'use strict';

// Minimal MelonJS 4.0 mock sufficient for unit-testing the Clumsy Bird
// source files without a real browser or canvas context.
//
// The stub is intentionally small: each API exposes just enough behaviour
// for the game code to execute during tests (constructors, chaining, event
// tracking). Nothing here should be treated as engine documentation.

function extendClass(Parent) {
    return function extend(proto) {
        function Child() {
            if (typeof this.init === 'function') {
                this.init.apply(this, arguments);
            }
        }
        Child.prototype = Object.create(Parent.prototype);
        Child.prototype.constructor = Child;
        Object.keys(proto).forEach(function (key) {
            Child.prototype[key] = proto[key];
        });
        Child.prototype._super = function (Base, method, args) {
            if (Base && Base.prototype && typeof Base.prototype[method] === 'function') {
                return Base.prototype[method].apply(this, args || []);
            }
        };
        Child.extend = extendClass(Child);
        return Child;
    };
}

function BaseClass() {}
BaseClass.prototype.init = function () {};
BaseClass.extend = extendClass(BaseClass);

function Vec2(x, y) { this.x = x || 0; this.y = y || 0; }
Vec2.prototype.set = function (x, y) { this.x = x; this.y = y; return this; };
Vec2.prototype.add = function (v) { this.x += v.x; this.y += v.y; return this; };

function makeVec() { return new Vec2(0, 0); }

function createTween(target) {
    var tween = {
        target: target,
        started: false,
        stopped: false,
        _steps: [],
        _onComplete: null,
        to: function (props, duration) {
            this._steps.push({ props: props, duration: duration });
            return this;
        },
        easing: function () { return this; },
        onComplete: function (fn) { this._onComplete = fn; return this; },
        start: function () { this.started = true; return this; },
        stop: function () { this.stopped = true; return this; },
        finish: function () {
            var self = this;
            this._steps.forEach(function (step) {
                Object.keys(step.props).forEach(function (key) {
                    self.target[key] = step.props[key];
                });
            });
            if (typeof this._onComplete === 'function') {
                this._onComplete.call(this.target);
            }
        }
    };
    return tween;
}

function MockEntityBody() {
    this.gravity = 0;
    this.vel = new Vec2(0, 0);
    this.accel = new Vec2(0, 0);
    this.shapes = [];
}
MockEntityBody.prototype.removeShapeAt = function (idx) { this.shapes.splice(idx, 1); };
MockEntityBody.prototype.addShape = function (shape) { this.shapes.push(shape); return this.shapes.length; };

function MockRenderable() {
    this.animations = {};
    this.currentAnimation = null;
    this.alpha = 1;
    this.width = 0;
    this.height = 0;
    this.currentTransform = {
        identity: function () { return this; },
        rotate: function () { return this; },
        scaleY: function () { return this; }
    };
}
MockRenderable.prototype.addAnimation = function (name, frames) { this.animations[name] = frames; };
MockRenderable.prototype.setCurrentAnimation = function (name) { this.currentAnimation = name; };

function MockEntity() {}
MockEntity.prototype.init = function (x, y, settings) {
    this.pos = new Vec2(x || 0, y || 0);
    this.body = new MockEntityBody();
    this.renderable = new MockRenderable();
    this.alwaysUpdate = false;
    // A default shape is present so body.removeShapeAt(0) in real code works.
    this.body.shapes.push({ x: 0, y: 0, width: (settings && settings.width) || 0,
        height: (settings && settings.height) || 0, type: 'default' });
    this.settings = settings || {};
    this.renderable.width = this.settings.width || 0;
    this.renderable.height = this.settings.height || 0;
};
MockEntity.extend = extendClass(MockEntity);

function MockRenderableClass() {}
MockRenderableClass.prototype.init = function (x, y, w, h) {
    this.pos = new Vec2(x || 0, y || 0);
    this.width = w || 0;
    this.height = h || 0;
    this.alpha = 1;
    this.floating = false;
    this.z = 0;
};
// Faithfully mirror me.Renderable.prototype.scale: real MelonJS exposes it as a
// NON-WRITABLE method (writable:false). Because the game source is non-strict ES5,
// `this.scale = <number>` on a Renderable silently fails and `scale` stays a function.
// Modelling that here lets the suite catch any renderable state whose name collides
// with the engine's scale() API (the original CR#8 pulse bug used `this.scale`).
Object.defineProperty(MockRenderableClass.prototype, 'scale', {
    value: function () { return this; },
    writable: false, enumerable: false, configurable: true
});
MockRenderableClass.extend = extendClass(MockRenderableClass);

function MockContainer() {
    MockRenderableClass.call(this);
    this.children = [];
    this.isPersistent = false;
    this.collidable = true;
    this.z = 0;
    this.name = '';
}
MockContainer.prototype = Object.create(MockRenderableClass.prototype);
MockContainer.prototype.init = function () { MockRenderableClass.prototype.init.call(this, 0, 0, 0, 0); this.children = []; };
MockContainer.prototype.addChild = function (child, z) { this.children.push(child); if (z !== undefined) { child.z = z; } };
MockContainer.prototype.removeChild = function (child) {
    var idx = this.children.indexOf(child);
    if (idx >= 0) { this.children.splice(idx, 1); }
};
MockContainer.prototype.removeChildNow = MockContainer.prototype.removeChild;
MockContainer.extend = extendClass(MockContainer);

function MockImageLayer() { MockRenderableClass.call(this); }
MockImageLayer.prototype = Object.create(MockRenderableClass.prototype);
MockImageLayer.prototype.init = function (x, y, settings) {
    MockRenderableClass.prototype.init.call(this, x || 0, y || 0,
        (settings && settings.width) || 0, (settings && settings.height) || 0);
    this.settings = settings || {};
    this.name = this.settings.name || '';
};
MockImageLayer.extend = extendClass(MockImageLayer);

function MockScreenObject() {}
MockScreenObject.prototype.init = function () {};
MockScreenObject.prototype.onResetEvent = function () {};
MockScreenObject.prototype.onDestroyEvent = function () {};
MockScreenObject.extend = extendClass(MockScreenObject);

function MockSprite() {}
MockSprite.prototype.init = function (x, y, settings) {
    this.pos = new Vec2(x, y);
    this.settings = settings || {};
    this.width = 0;
    this.height = 0;
    this.alpha = 1;
};
MockSprite.extend = extendClass(MockSprite);

function MockFont(name, size, color, align) {
    this.name = name; this.size = size; this.color = color; this.align = align;
    this.measureText = function (_, text) { return { width: String(text).length * (size || 10) / 2 }; };
    this.draw = function () {};
}
MockFont.extend = extendClass(MockFont);

function MockColorLayer() {}
MockColorLayer.prototype.init = function (name, color, z) {
    this.name = name; this.color = color; this.z = z; this.alpha = 1;
};
MockColorLayer.extend = extendClass(MockColorLayer);

function buildMelon() {
    var stateMap = {};
    var currentState = null;
    var subscribers = [];
    var pausedFlag = false;

    var me = {
        Entity: MockEntity,
        Renderable: MockRenderableClass,
        Container: MockContainer,
        ImageLayer: MockImageLayer,
        ScreenObject: MockScreenObject,
        Sprite: MockSprite,
        Font: MockFont,
        BitmapFont: MockFont,
        ColorLayer: MockColorLayer,
        Ellipse: function (x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; this.type = 'ellipse'; },
        Rect: (function () {
            function R(x, y, w, h) {
                this.x = x; this.y = y; this.width = w; this.height = h; this.type = 'rect';
                this.pos = new Vec2(x, y);
            }
            R.prototype.updateBounds = function () { return this; };
            return R;
        })(),
        Vector2d: Vec2,
        Tween: (function () {
            function T(target) { return createTween(target); }
            T.Easing = {
                Exponential: { InOut: 'expInOut', In: 'expIn', Out: 'expOut' },
                Quadratic: { InOut: 'quadInOut', In: 'quadIn', Out: 'quadOut' },
                Linear: { None: 'linear' }
            };
            return T;
        })(),
        state: {
            MENU: 0,
            PLAY: 1,
            GAME_OVER: 2,
            set: function (id, screen) { stateMap[id] = screen; },
            change: function (id) {
                if (currentState !== null && typeof stateMap[currentState] !== 'undefined' &&
                    typeof stateMap[currentState].onDestroyEvent === 'function') {
                    stateMap[currentState].onDestroyEvent();
                }
                currentState = id;
                if (stateMap[id] && typeof stateMap[id].onResetEvent === 'function') {
                    stateMap[id].onResetEvent();
                }
            },
            current: function () { return currentState; },
            isCurrent: function (id) { return currentState === id; },
            transition: function (type, color, duration) {
                me.state._transition = { type: type, color: color, duration: duration };
            },
            pause: function () { pausedFlag = true; me.state._paused = true; },
            resume: function () { pausedFlag = false; me.state._paused = false; },
            isPaused: function () { return pausedFlag; },
            _transition: null,
            _paused: false
        },
        input: {
            KEY: {
                SPACE: 32, M: 77, P: 80, ESC: 27, ESCAPE: 27, ENTER: 13,
                UP: 38, W: 87, LEFT: 37, RIGHT: 39, DOWN: 40
            },
            pointer: { LEFT: 'LEFT', RIGHT: 'RIGHT', MIDDLE: 'MIDDLE' },
            _bindings: { keys: {}, pointers: {} },
            _pressed: {},
            bindKey: function (key, action, preventDefault) {
                me.input._bindings.keys[action] = me.input._bindings.keys[action] || [];
                if (me.input._bindings.keys[action].indexOf(key) < 0) {
                    me.input._bindings.keys[action].push(key);
                }
            },
            unbindKey: function (key) {
                Object.keys(me.input._bindings.keys).forEach(function (action) {
                    me.input._bindings.keys[action] = me.input._bindings.keys[action].filter(function (k) { return k !== key; });
                });
            },
            bindPointer: function (button, key) {
                if (arguments.length === 1) {
                    me.input._bindings.pointers['DEFAULT'] = button;
                } else {
                    me.input._bindings.pointers[button] = key;
                }
            },
            unbindPointer: function (button) { delete me.input._bindings.pointers[button]; },
            isKeyPressed: function (action) { return !!me.input._pressed[action]; },
            _press: function (action) { me.input._pressed[action] = true; },
            _release: function (action) { me.input._pressed[action] = false; },
            registerPointerEvent: function (event, rect, callback) {},
            releasePointerEvent: function (event, rect) {}
        },
        pool: {
            _registry: {},
            register: function (name, Klass) { me.pool._registry[name] = Klass; },
            pull: function (name) {
                if (name === 'me.Tween') {
                    return createTween(arguments[1]);
                }
                var Klass = me.pool._registry[name];
                if (!Klass) { return null; }
                var args = Array.prototype.slice.call(arguments, 1);
                var obj = Object.create(Klass.prototype);
                Klass.apply(obj, args);
                return obj;
            }
        },
        audio: {
            _playing: {},
            _currentTrack: null,
            _disabled: false,
            _volume: 1,
            init: function () {},
            play: function (track) { me.audio._playing[track] = true; },
            stop: function (track) { if (track) { me.audio._playing[track] = false; } },
            playTrack: function (track) {
                me.audio._currentTrack = track;
                me.audio._playing[track] = true;
            },
            stopTrack: function () {
                if (me.audio._currentTrack) {
                    me.audio._playing[me.audio._currentTrack] = false;
                    me.audio._currentTrack = null;
                }
            },
            pauseTrack: function () {
                if (me.audio._currentTrack) {
                    me.audio._playing[me.audio._currentTrack] = 'paused';
                }
            },
            resumeTrack: function () {
                if (me.audio._currentTrack) {
                    me.audio._playing[me.audio._currentTrack] = true;
                }
            },
            getCurrentTrack: function () { return me.audio._currentTrack; },
            disable: function () { me.audio._disabled = true; },
            enable: function () { me.audio._disabled = false; },
            muteAll: function () { me.audio._disabled = true; },
            unmuteAll: function () { me.audio._disabled = false; },
            setVolume: function (v) { me.audio._volume = v; }
        },
        save: {
            _store: {},
            add: function (obj) {
                Object.keys(obj).forEach(function (k) {
                    if (typeof me.save[k] === 'undefined') {
                        me.save[k] = obj[k];
                    }
                    me.save._store[k] = obj[k];
                });
            },
            remove: function (k) { delete me.save[k]; delete me.save._store[k]; }
        },
        video: {
            init: function () { return true; },
            renderer: {
                getWidth: function () { return 900; },
                getHeight: function () { return 600; }
            }
        },
        loader: {
            _images: {},
            preload: function (resources, cb) { if (cb) { cb(); } },
            getImage: function (name) {
                if (!me.loader._images[name]) {
                    me.loader._images[name] = { width: 100, height: 100, name: name };
                }
                return me.loader._images[name];
            }
        },
        game: {
            viewport: {
                width: 900,
                height: 600,
                AXIS: { BOTH: 'both', X: 'x', Y: 'y' },
                _shakes: [],
                _fades: [],
                shake: function (intensity, duration, axis) {
                    me.game.viewport._shakes.push({ intensity: intensity, duration: duration, axis: axis });
                },
                fadeOut: function (color, duration) {
                    me.game.viewport._fades.push({ color: color, duration: duration });
                },
                fadeIn: function (color, duration) {
                    me.game.viewport._fades.push({ color: color, duration: duration, type: 'in' });
                }
            },
            world: {
                _children: [],
                addChild: function (child, z) { if (z !== undefined) { child.z = z; } me.game.world._children.push(child); },
                removeChild: function (child) {
                    var i = me.game.world._children.indexOf(child);
                    if (i >= 0) { me.game.world._children.splice(i, 1); }
                },
                removeChildNow: function (child) { me.game.world.removeChild(child); },
                getChildByName: function (name) {
                    return me.game.world._children.filter(function (c) { return c.name === name; });
                }
            },
            reset: function () { me.game.world._children = []; }
        },
        timer: { tick: 1 },
        event: {
            KEYDOWN: 'keydown',
            _subs: {},
            _nextId: 1,
            subscribe: function (channel, fn) {
                var id = me.event._nextId++;
                me.event._subs[id] = { channel: channel, fn: fn };
                return id;
            },
            unsubscribe: function (id) { delete me.event._subs[id]; },
            publish: function (channel, args) {
                Object.keys(me.event._subs).forEach(function (id) {
                    if (me.event._subs[id].channel === channel) {
                        me.event._subs[id].fn.apply(null, args);
                    }
                });
            }
        },
        collision: {
            _checks: 0,
            check: function () { me.collision._checks++; return false; }
        },
        device: {
            touch: false,
            ua: 'Mozilla/5.0 (X11; Linux x86_64)',
            vibrate: function () { me.device._vibrated = true; },
            _vibrated: false
        }
    };
    return me;
}

function setupGlobals() {
    var me = buildMelon();
    var g = (typeof globalThis !== 'undefined') ? globalThis : global;
    g.me = me;
    g.game = { data: { score: 0, steps: 0, start: false, newHiScore: false, muted: false } };

    if (!Number.prototype.degToRad) {
        Number.prototype.degToRad = function () { return this * Math.PI / 180; };
    }
    if (!Number.prototype.random) {
        Number.prototype.random = function (b) { return Math.floor(Math.random() * (b - this + 1)) + Number(this); };
    }

    return { me: me, game: g.game };
}

function teardownGlobals() {
    var g = (typeof globalThis !== 'undefined') ? globalThis : global;
    delete g.me;
    delete g.game;
}

module.exports = {
    buildMelon: buildMelon,
    setupGlobals: setupGlobals,
    teardownGlobals: teardownGlobals
};

'use strict';

// Loads a project source file in a fresh Node VM context, feeding it the
// MelonJS stub as globals. This avoids polluting the test process globals
// between test files and lets each test reason about a clean `game` object.

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var melonStub = require('./melon-stub');

var projectRoot = path.resolve(__dirname, '..', '..');

function readSource(relPath) {
    return fs.readFileSync(path.join(projectRoot, relPath), 'utf8');
}

function createSandbox(extra) {
    var ctx = { console: console, Math: Math, Date: Date, JSON: JSON, Number: Number };
    var me = melonStub.buildMelon();
    ctx.me = me;
    ctx.game = { data: { score: 0, steps: 0, start: false, newHiScore: false, muted: false } };

    if (!Number.prototype.degToRad) {
        Number.prototype.degToRad = function () { return this * Math.PI / 180; };
    }
    if (!Number.prototype.random) {
        Number.prototype.random = function (b) { return Math.floor(Math.random() * (b - this + 1)) + Number(this); };
    }

    if (extra) {
        Object.keys(extra).forEach(function (k) { ctx[k] = extra[k]; });
    }
    vm.createContext(ctx);
    return ctx;
}

function loadFiles(ctx, files) {
    files.forEach(function (rel) {
        var code = readSource(rel);
        vm.runInContext(code, ctx, { filename: rel });
    });
    return ctx;
}

function loadGame(ctx) {
    var files = [
        'js/game.js',
        'js/entities/entities.js',
        'js/entities/HUD.js',
        'js/screens/title.js',
        'js/screens/play.js',
        'js/screens/gameover.js'
    ];
    return loadFiles(ctx, files);
}

function freshProject() {
    var ctx = createSandbox();
    loadGame(ctx);
    return ctx;
}

function runLoaded(ctx) {
    // Execute the game's onload path so pool registration / state wiring runs.
    ctx.game.onload();
    return ctx;
}

module.exports = {
    createSandbox: createSandbox,
    loadFiles: loadFiles,
    loadGame: loadGame,
    freshProject: freshProject,
    runLoaded: runLoaded,
    readSource: readSource,
    projectRoot: projectRoot
};

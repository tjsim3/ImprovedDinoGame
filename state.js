// ===== SHARED GAME STATE =====
// Module-level singletons read/written by game.js, renderer.js and script.js.
// Kept in one place so every module references the same objects.

const game = {
    width: document.getElementById('gameCanvas').width,
    height: document.getElementById('gameCanvas').height,
    groundY: 240,
    speed: 1.25,
    obstacleTimer: 0,
    obstacleInterval: 200,
    obstacles: [],
    score: 0,
    gameOver: false,
    started: false,
    mode: null,
};

// ===== DINOSAUR MODES =====
const DINOS = {
    trex: {
        name: 'T-Rex',
        walkSpeed: 1.25,
        jumpPower: -2.2,
        gravity: 0.03,
        flight: false,
        eatCacti: false,
        sprite: 'trex',
    },
    pterodactyl: {
        name: 'Pterodactyl',
        walkSpeed: 1.35,
        flight: true,
        eatCacti: false,
        sprite: 'ptero',
    },
    stegosaurus: {
        name: 'Stegosaurus',
        walkSpeed: 0.95,
        jumpPower: -2.0,
        gravity: 0.03,
        flight: false,
        eatCacti: true,
        sprite: 'steg',
    },
};

// ===== TIMING / FLIGHT CONSTANTS =====
const BASE_FRAME_TIME = 4; // 60 FPS baseline (1000ms / 60 frames)
const FLIGHT_MIN_Y = 70;
const FLIGHT_SPEED = 2.4;
const FLIGHT_Y0 = 120;
const CACTUS_BONUS = 25;
const FIREBALL_SPEED = 2; // fireball travel speed toward the player (fast enough to threaten, slow enough to dodge)

// ===== PLAYER STATE =====
const player = {
    x: 150,
    y: game.groundY - 40,
    width: 40,
    height: 40,
    dy: 0,
    jumpPower: -2.2,
    gravity: 0.03,
    jumping: false
};

// ===== INPUT STATE =====
// Tracks whether a movement key is being held down (used for flight control)
const keys = { up: false, down: false };

export {
    game,
    player,
    keys,
    DINOS,
    BASE_FRAME_TIME,
    FLIGHT_MIN_Y,
    FLIGHT_SPEED,
    FLIGHT_Y0,
    CACTUS_BONUS,
    FIREBALL_SPEED,
};

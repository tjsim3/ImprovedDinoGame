// ===== ENTRY POINT =====
// Wires together the shared state, game logic, renderer and Firebase leaderboard.
// Owns HTML interaction: DOM element refs, input handlers, dino selection UI,
// the main loop and startup.

import { game, player, keys, DINOS, BASE_FRAME_TIME, FIREBALL_SPEED } from './state.js';
import { refreshLeaderboard, normalizeName, getStoredName, submitScore, getPlayerName } from './firebase.js';
import { resetGame, spawnObstacle, update } from './game.js';
import { render } from './renderer.js';

// ===== DOM ELEMENTS =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const message = document.getElementById('message');
const nameInput = document.getElementById('playerName');
const selectScreen = document.getElementById('selectScreen');
const switchDinoBtn = document.getElementById('switchDino');

if (nameInput) {
    nameInput.value = getStoredName();
    nameInput.addEventListener('input', () => {
        nameInput.value = normalizeName(nameInput.value);
        try {
            localStorage.setItem('dinoPlayerName', nameInput.value);
        } catch (e) {}
    });
}

// ===== ASSETS =====
// Load dino image once at startup (performance optimization)
const dinoImg = new Image();
dinoImg.src = 'dino.png';
const pteroImg = new Image();
pteroImg.src = 'pterodactyl.png';
const stegImg = new Image();
stegImg.src = 'stegosaurus.png';

// ===== TIMING SYSTEM (frame-rate independent movement) =====
// Track elapsed time to ensure same speed on all frame rates
let lastFrameTime = Date.now();
let deltaTime = 0;

// ===== DINOSAUR SELECTION =====
let selectOpen = false;

function showSelectScreen() {
    selectOpen = true;
    game.started = false;
    game.gameOver = false;
    message.classList.add('hidden');
    if (selectScreen) selectScreen.classList.remove('hidden');
}

function hideSelectScreen() {
    selectOpen = false;
    if (selectScreen) selectScreen.classList.add('hidden');
}

function selectDino(id) {
    if (!DINOS[id]) return;
    game.mode = id;
    hideSelectScreen();
    resetGame();
}

// ===== MAIN GAME LOOP =====
function gameLoop() {
    // ===== CALCULATE DELTA TIME (for frame-rate independent movement) =====
    const currentTime = Date.now();
    deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    const timeScale = deltaTime / BASE_FRAME_TIME; // Normalize time to 60 FPS baseline

    if (game.mode && !game.started) {
        resetGame();
    }
    update(timeScale);
    render(ctx, game, player, dinoImg, pteroImg, stegImg);
    requestAnimationFrame(gameLoop);
}

// ===== INPUT HANDLING =====
// Space/Up/W: jump (or fly up for the pterodactyl, or restart on game over)
// Down/S: duck (or fly down for the pterodactyl)
window.addEventListener('keydown', event => {
    const isUp = event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW';
    const isDown = event.code === 'ArrowDown' || event.code === 'KeyS';
    if (isUp || isDown) event.preventDefault();

    if (!game.mode) return;

    if (isUp) {
        keys.up = true;
        if (game.gameOver && !selectOpen) {
            resetGame();
            return;
        }
        if (!game.gameOver && !DINOS[game.mode].flight && !player.jumping) {
            player.height = 40;
            player.y = game.groundY - (player.height + 1);
            player.dy = player.jumpPower;
            player.jumping = true;
        }
    }

    if (isDown && !game.gameOver) {
        keys.down = true;
        if (!DINOS[game.mode].flight) {
            player.y += 20;
            if (player.jumping) {
                player.dy += 5;
            }
            if (!player.jumping) {
                player.height = 20;
            }
        }
    }
});

// Release movement keys: stop flying up/down, and stop ducking
window.addEventListener('keyup', event => {
    const code = event.code;
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') keys.up = false;
    if (code === 'ArrowDown' || code === 'KeyS') keys.down = false;
    if (code === 'ArrowDown' && game.mode && !DINOS[game.mode].flight) {
        player.height = 40;
    }
});

// Handle canvas scaling on window resize
window.addEventListener('resize', () => {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
    canvas.style.transform = `scale(${scale})`;
});

// ===== DINOSAUR SELECTION WIRING =====
document.querySelectorAll('.dinoOption').forEach(btn => {
    btn.addEventListener('click', () => selectDino(btn.dataset.dino));
});

if (switchDinoBtn) {
    switchDinoBtn.addEventListener('click', () => {
        message.classList.add('hidden');
        showSelectScreen();
    });
}

// Start paused on the dino selection screen
game.started = false;
showSelectScreen();
gameLoop();
refreshLeaderboard().catch(() => {});

if (window.__DINO_TEST__) {
    window.__dino = {
        submitScore,
        refreshLeaderboard,
        normalizeName,
        getPlayerName,
        selectDino,
        showSelectScreen,
        resetGame,
        spawnObstacle,
        game,
        player,
        keys,
        DINOS,
        FIREBALL_SPEED
    };
}

// ===== CORE GAME LOGIC =====
// Owns the simulation: resetting, spawning obstacles, physics and collision.
// Reads/writes the shared state from state.js and reports scores to firebase.js.

import {
    game,
    player,
    keys,
    DINOS,
    FLIGHT_MIN_Y,
    FLIGHT_SPEED,
    FLIGHT_Y0,
    CACTUS_BONUS,
    FIREBALL_SPEED,
    ROCK_GRAVITY,
    ROCK_BOUNCE,
    ROCK_THROW_SPEED,
} from './state.js';
import { submitScore } from './firebase.js';

// ===== DOM OUTPUTS =====
const scoreBoard = document.getElementById('scoreBoard');
const message = document.getElementById('message');

// Reset game to initial state
function resetGame() {
    const cfg = DINOS[game.mode];
    game.speed = cfg.walkSpeed;
    game.obstacleTimer = 0;
    game.obstacleInterval = 200;
    game.obstacles = [];
    game.score = 0;
    game.gameOver = false;
    game.started = true;
    player.height = 40;
    player.dy = 0;
    player.jumping = false;
    player.jumpPower = cfg.jumpPower;
    player.gravity = cfg.gravity;
    if (cfg.flight) {
        player.y = FLIGHT_Y0;
    } else {
        player.y = game.groundY - player.height;
    }
    scoreBoard.textContent = 'SCORE: 0';
    message.classList.add('hidden');
}

// Pick which obstacle type to spawn based on the selected dinosaur
function pickObstacleType() {
    const rand = Math.random();
    const mode = game.mode;

    if (mode === 'pterodactyl') {
        if (rand < 0.3) return 5;       // enemy pterodactyl
        if (rand < 0.6) return 2;      // flying rock
        if (rand < 0.9) return 1;
        return 3;                       // fireball
    }

    if (mode === 'stegosaurus') {
        const fireballChance = 0.05 + Math.min(0.2, game.score / 25000);
        if (rand < fireballChance) return 3;          // fireball
        if (rand < fireballChance + 0.25) return 4;   // spike rock
        if (rand < fireballChance + 0.5) return 2;    // flying rock
        return 1;                                     // cactus (edible)
    }

    // T-Rex keeps the original distribution
    if (game.score < (2500 / 3)) {
        if (rand < 0.1 * game.score / (2500 / 3)) return 3;
        if (rand < 0.4) return 5;
        return 1;
    }
    if (rand < 0.1) return 3;
    if (rand < 0.4) return 5;
    return 1;
}

// Create a random obstacle (type 1: tall cactus, type 2: flying rock, type 3: fireball,
// type 4: spike rock, type 5: enemy pterodactyl)
function spawnObstacle() {
    const obtype = pickObstacleType();
    let x = game.width + 20;
    let height, width, leftarm, rightarm;
    let y;
    let yvel;
    let baseY;
    let dirX = null;
    let dirY = null;

    // Type 1: Tall cactus with random height and arms
    if (obtype == 1){
        if (Math.random() > 0.5){
            height = 50;
        } else {
            height = 30;
        }
        width = 20 + Math.round(Math.random() * 2) * 10;

        if (width == 30) {
            if (Math.random() > 0.5) {
                leftarm = true;
                rightarm = false;
            } else {
                leftarm = false;
                rightarm = true;
            }
        } else if (width == 40) {
            leftarm = true;
            rightarm = true;
        } else {
            leftarm = false;
            rightarm = false;
        }
        width = 20;
        y = game.groundY - height;
        yvel = null;
    } else if (obtype == 2) {
        // Type 2: Flying rock - thrown upward from the ground, arcs then bounces
        height = 20;
        width = 20;
        leftarm = false;
        rightarm = false;
        y = game.groundY - height;
        yvel = -(2 + Math.random() * 3);
    } else if (obtype == 3) {
        // Type 3: Fireball
        height = 30;
        width = 30;
        leftarm = false;
        rightarm = false;
        y = 0;
        yvel = null;
        // Aim the fireball at the player so it flies straight at them
        const dx = player.x + player.width / 2 - (x + width / 2);
        const dy = player.y + player.height / 2 - (y + height / 2);
        const len = Math.hypot(dx, dy) || 1;
        dirX = dx / len;
        dirY = dy / len;
    } else if (obtype == 4) {
        // Type 4: Spike rock (cannot be eaten)
        height = 35;
        width = 28;
        leftarm = false;
        rightarm = false;
        y = game.groundY - height;
        yvel = null;
    } else if (obtype == 5) {
        // Type 5: Enemy pterodactyl flying at altitude
        height = 32;
        width = 40;
        leftarm = false;
        rightarm = false;
        if (game.mode === 'pterodactyl'){
            y = FLIGHT_MIN_Y + 10 + Math.random() * (game.groundY - player.height - 60 - FLIGHT_MIN_Y);
        } else {
            y = game.groundY - 60 - Math.random() * 40;
        }
        baseY = y;
        yvel = null;
    }


    game.obstacles.push({
        x,
        y,
        width,
        height,
        leftarm,
        rightarm,
        obtype,
        yvel,
        baseY,
        dirX,
        dirY
    });
}

function playerHitsObstacle(obs) {
    const px = player.x;
    const py = player.y;
    const scale = player.width / 10; // sprite is 10x10 pixels drawn to 40x40

    const ox1 = obs.x;
    const oy1 = obs.y;
    const ox2 = obs.x + obs.width;
    const oy2 = obs.y + obs.height;

    const overlaps = (ax1, ay1, ax2, ay2) => {
        return ax1 < ox2 && ax2 > ox1 && ay1 < oy2 && ay2 > oy1;
    };

    // Row 0: ......oo..
    if (overlaps(px + 6 * scale, py + 0 * scale, px + 8 * scale, py + 1 * scale)) return true;
    // Row 1: .....oooo.
    if (overlaps(px + 5 * scale, py + 1 * scale, px + 9 * scale, py + 2 * scale)) return true;
    // Row 2: ....oooooo
    if (overlaps(px + 4 * scale, py + 2 * scale, px + 10 * scale, py + 3 * scale)) return true;
    // Row 3: ....oooooo
    if (overlaps(px + 4 * scale, py + 3 * scale, px + 10 * scale, py + 4 * scale)) return true;
    // Row 4: ....ooooo.
    if (overlaps(px + 4 * scale, py + 4 * scale, px + 9 * scale, py + 5 * scale)) return true;
    // Row 5: ...oooo...
    if (overlaps(px + 3 * scale, py + 5 * scale, px + 7 * scale, py + 6 * scale)) return true;
    // Row 6: .ooooooo..
    if (overlaps(px + 1 * scale, py + 6 * scale, px + 8 * scale, py + 7 * scale)) return true;
    // Row 7: oooooo....
    if (overlaps(px + 0 * scale, py + 7 * scale, px + 6 * scale, py + 8 * scale)) return true;
    // Row 8: oooooo....
    if (overlaps(px + 0 * scale, py + 8 * scale, px + 6 * scale, py + 9 * scale)) return true;
    // Row 9: ...oo.o...
    if (overlaps(px + 3 * scale, py + 9 * scale, px + 5 * scale, py + 10 * scale)) return true;
    if (overlaps(px + 6 * scale, py + 9 * scale, px + 7 * scale, py + 10 * scale)) return true;

    return false;
}

// Pterodactyl pixel hitbox (10x10 grid; "." empty, "o" solid)
const PTERO_HITBOX = [
    "..........",
    "oo.ooo....",
    "ooo.oooo..",
    ".ooooooooo",
    ".ooooooo..",
    "..ooo.....",
    ".ooooo....",
    "oo..oo....",
    "..........",
    "..........",
];

function playerPteroHitsObstacle(obs) {
    const px = player.x;
    const py = player.y;
    const scaleX = player.width / PTERO_HITBOX[0].length;
    const scaleY = player.height / PTERO_HITBOX.length;

    const ox1 = obs.x;
    const oy1 = obs.y;
    const ox2 = obs.x + obs.width;
    const oy2 = obs.y + obs.height;

    const overlaps = (ax1, ay1, ax2, ay2) => {
        return ax1 < ox2 && ax2 > ox1 && ay1 < oy2 && ay2 > oy1;
    };

    for (let r = 0; r < PTERO_HITBOX.length; r++) {
        const row = PTERO_HITBOX[r];
        for (let c = 0; c < row.length; c++) {
            if (row[c] === 'o') {
                if (overlaps(px + c * scaleX, py + r * scaleY,
                             px + (c + 1) * scaleX, py + (r + 1) * scaleY)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Collision depends on the dino: flying dinos use their pixel hitbox, others use the tread hitbox
function collides(obs) {
    if (DINOS[game.mode].flight) {
        return playerPteroHitsObstacle(obs);
    }
    return playerHitsObstacle(obs);
}

// Advance the simulation one frame. timeScale normalizes movement to 60 FPS.
function update(timeScale) {
    if (!game.started || game.gameOver) return;

    const cfg = DINOS[game.mode];

    // ===== PLAYER PHYSICS =====
    game.score += 0.075 * timeScale;
    scoreBoard.textContent = 'SCORE: ' + Math.floor(game.score);

    if (cfg.flight) {
        let vy = 0;
        if (keys.up) vy -= FLIGHT_SPEED;
        if (keys.down) vy += FLIGHT_SPEED;
        player.dy = vy;
        player.y += vy * timeScale;
        player.y = Math.max(FLIGHT_MIN_Y, Math.min(game.groundY - player.height, player.y));
    } else {
        player.dy += cfg.gravity * timeScale;
        player.y += player.dy * timeScale;

        // Ground collision detection
        if (player.y >= game.groundY - player.height) {
            player.y = game.groundY - player.height;
            player.dy = 0;
            player.jumping = false;
        }
    }

    // ===== OBSTACLE SPAWNING =====
    game.obstacleTimer += timeScale;
    if (game.obstacleTimer > game.obstacleInterval) {
        game.obstacleTimer = 0;
        spawnObstacle();
        if (game.mode === 'pterodactyl'){
            game.obstacleInterval = 125 + Math.floor(Math.random() * 350);  
        } else {
            game.obstacleInterval = 125 + Math.floor(Math.random() * 175);        
        }
    }

    // ===== OBSTACLE MOVEMENT & COLLISION =====
    for (let i = game.obstacles.length - 1; i >= 0; i--) {
        const obs = game.obstacles[i];
        // Fireballs fly toward the player's position from spawn; others scroll left
        if (obs.obtype == 3 && obs.dirX != null) {
            obs.x += obs.dirX * FIREBALL_SPEED * timeScale;
            obs.y += obs.dirY * FIREBALL_SPEED * timeScale;
        } else {
            obs.x -= game.speed * timeScale;
        }
        // Thrown rocks arc upward then bounce off the ground
        if (obs.obtype == 2) {
            obs.x -= ROCK_THROW_SPEED * timeScale;
            obs.yvel += ROCK_GRAVITY * timeScale;
            obs.y += obs.yvel * timeScale;
            if (obs.y + obs.height >= game.groundY) {
                obs.y = game.groundY - obs.height;
                obs.yvel = -obs.yvel * ROCK_BOUNCE;
                if (Math.abs(obs.yvel) < 0.12) obs.yvel = 0;
            }
        }
        // Flying enemies bob up and down if pterodactyl
        if (game.mode === 'pterodactyl'){
            if (obs.obtype == 5 && obs.baseY != null) {
                obs.y = obs.baseY + Math.sin(game.score / 20) * 40;
            }
        }
        // Remove obstacles that left the screen
        if (obs.x + obs.width < -30) {
            game.obstacles.splice(i, 1);
            continue;
        }
        if (collides(obs)) {
            // Stegosaurus eats cacti instead of crashing into them
            if (cfg.eatCacti && obs.obtype == 1) {
                game.obstacles.splice(i, 1);
                game.score += CACTUS_BONUS;
                scoreBoard.textContent = 'SCORE: ' + Math.floor(game.score);
                continue;
            }
            game.gameOver = true;
            message.classList.remove('hidden');
            try { submitScore(game.score); } catch (e) { /* swallow */ }
            break;
        }
    }

    // ===== DIFFICULTY SCALING =====
    // Increase speed every 200 points from the dino's base speed
    const tier = Math.floor(game.score / 200);
    if (!game.gameOver && tier > 0) {
        game.speed = cfg.walkSpeed + 0.2 * tier;
    }
}

export { resetGame, spawnObstacle, update };

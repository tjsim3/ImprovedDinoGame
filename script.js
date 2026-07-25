import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged 
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCkzOLdZWuYo1SXBsb1ZNTaF9JjBB0YqgM",
  authDomain: "dinogame-affb7.firebaseapp.com",
  projectId: "dinogame-affb7",
  storageBucket: "dinogame-affb7.firebasestorage.app",
  messagingSenderId: "101872105597",
  appId: "1:101872105597:web:469611e93a3a59c1071914",
  measurementId: "G-X78XS9MLZC"
};

// ===== FIREBASE INIT =====
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Firestore + Auth (leaderboard)
const db = getFirestore(app);
const auth = getAuth();

// Try anonymous sign-in so clients can write scores under auth.uid
signInAnonymously(auth).catch(() => {});

onAuthStateChanged(auth, (user) => {
    // Refresh leaderboard when auth state settles
    refreshLeaderboard().catch(() => {});
});

async function refreshLeaderboard() {
    try {
        const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(5));
        const snap = await getDocs(q);
        const list = document.getElementById('leaderboardList');
        if (!list) return;
        list.innerHTML = '';
        if (snap.empty) {
            list.innerHTML = '<li>No scores yet</li>';
            return;
        }
        snap.forEach(doc => {
            const d = doc.data();
            const li = document.createElement('li');
            const id = d.playerId ? String(d.playerId).substring(0, 6) : 'anon';
            li.textContent = `${id} — ${d.score}`;
            list.appendChild(li);
        });
    } catch (e) {
        console.error('refreshLeaderboard failed', e);
        const list = document.getElementById('leaderboardList');
        if (list) list.innerHTML = '<li class="error">Failed to load</li>';
    }
}

async function submitScore(score) {
    try {
        if (!auth.currentUser) {
            await signInAnonymously(auth);
        }

        const playerLabel = auth.currentUser ? auth.currentUser.uid.slice(0, 8) : 'anon';

        await addDoc(collection(db, 'scores'), {
            playerId: playerLabel,
            score: Math.floor(score),
            createdAt: serverTimestamp()
        });

        await refreshLeaderboard();
    } catch (e) {
        console.error('submitScore failed:', e);
        const list = document.getElementById('leaderboardList');
        if (list) {
            list.innerHTML = '<li class="error">Score could not be saved</li>';
        }
    }
}

// ===== DOM ELEMENTS =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const scoreBoard = document.getElementById('scoreBoard');
const message = document.getElementById('message');

// ===== GAME STATE =====
const game = {
    width: canvas.width,
    height: canvas.height,
    groundY: 240,
    speed: 1.25,
    obstacleTimer: 0,
    obstacleInterval: 200,
    obstacles: [],
    score: 0,
    gameOver: false,
    started: false,
};

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

// ===== ASSETS =====
// Load dino image once at startup (performance optimization)
const dinoImg = new Image();
dinoImg.src = 'dino.png';

// ===== TIMING SYSTEM (frame-rate independent movement) =====
// Track elapsed time to ensure same speed on all frame rates
let lastFrameTime = Date.now();
let deltaTime = 0;
const BASE_FRAME_TIME = 4; // 60 FPS baseline (1000ms / 60 frames)

// Reset game to initial state
function resetGame() {
    game.speed = 1.25;
    game.obstacleTimer = 0;
    game.obstacleInterval = 200;
    game.obstacles = [];
    game.score = 0;
    game.gameOver = false;
    game.started = true;
    player.y = game.groundY - player.height;
    player.dy = 0;
    player.jumping = false;
    scoreBoard.textContent = 'SCORE: 0';
    message.classList.add('hidden');
}

// Create a random obstacle (type 1: tall cactus with arms, type 2: flying rock, type 3: fireball)
function spawnObstacle() {
    let obtype;
    const rand = Math.random();
    if (game.score < (2500/3)) {
        if (rand < 0.1 * game.score / (2500/3)) {
            obtype = 3; 
        } else if (rand < 0.4) {
            obtype = 2;
        } else {
            obtype = 1;
        }
    } else {
        if (rand < 0.1) {
            obtype = 3;
        } else if (rand < 0.4) {
            obtype = 2;
        } else {
            obtype = 1;
        }
    }
    let x = game.width + 20;
    let height, width, leftarm, rightarm;
    let y;
    let yvel;

    // Type 1: Tall cactus with random height and arms
    if(obtype == 1){
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
        // Type 2: Flying rock 
        height = 20;
        width = 20;
        leftarm = false;
        rightarm = false;
        y = game.groundY - height;
        y -= Math.floor(Math.random() * 20) + 20;
        yvel = null;
    } else if (obtype == 3) {
        // Typer 3: Fireball 
        height = 30;
        width = 30;
        leftarm = false;
        rightarm = false;
        y = 0;
        yvel = (Math.random() /2)  + 1.5;
    }


    game.obstacles.push({
        x,
        y,
        width,
        height,
        leftarm,
        rightarm,
        obtype,
        yvel
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

function update() {
    if (game.gameOver) return;

    const timeScale = deltaTime / BASE_FRAME_TIME; // Normalize time to 60 FPS baseline
    
    // ===== PLAYER PHYSICS =====
    game.score += 0.075 * timeScale;
    scoreBoard.textContent = 'SCORE: ' + Math.floor(game.score);

    player.dy += player.gravity * timeScale;
    player.y += player.dy * timeScale;

    // Ground collision detection
    if (player.y >= game.groundY - player.height) {
        player.y = game.groundY - player.height;
        player.dy = 0;
        player.jumping = false;
    }

    // ===== OBSTACLE SPAWNING =====
    game.obstacleTimer += timeScale;
    if (game.obstacleTimer > game.obstacleInterval) {
        game.obstacleTimer = 0;
        spawnObstacle();
        game.obstacleInterval = 125 + Math.floor(Math.random() * 175);
    }

    // ===== OBSTACLE MOVEMENT & COLLISION =====
    for (let i = game.obstacles.length - 1; i >= 0; i--) {
        const obs = game.obstacles[i];
        obs.x -= game.speed * timeScale;
        // Remove obstacles that left the screen
        if (obs.x + obs.width < -30) {
            game.obstacles.splice(i, 1);
            continue;
        }
        // Complex pixel-art collision detection for the dino sprite
        if (playerHitsObstacle(obs)) {
            game.gameOver = true;
            message.classList.remove('hidden');
            try { submitScore(game.score); } catch (e) { /* swallow */ }
            break;
        }
    }

    // ===== DIFFICULTY SCALING =====
    // Increase speed every 200 points
    if (!game.gameOver && game.score % 200 === 0) {
        game.speed = 1.25 + 0.2 * Math.floor(game.score / 200);
    }
}

function drawBackground() {
    // Sky
    ctx.fillStyle = '#87c1ff';
    ctx.fillRect(0, 0, game.width, game.height);
    // Ground
    ctx.fillStyle = '#f6ff00';
    ctx.fillRect(0, game.groundY, game.width, game.height - game.groundY);
    // Ground line
    ctx.strokeStyle = '#5e5e5e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, game.groundY);
    ctx.lineTo(game.width, game.groundY);
    ctx.stroke();
}

function drawPlayer() {
    // Draw dino sprite at current position
    ctx.drawImage(dinoImg, player.x, player.y, player.width, player.height);
}

function drawObstacles() {
    game.obstacles.forEach(obs => {
        if (obs.obtype == 1) {
            // Draw cactus body
            ctx.fillStyle = '#3a7d44';
            ctx.fillRect(obs.x, obs.y, 20, obs.height);
            // Draw cactus top
            ctx.fillStyle = '#27632f';
            ctx.fillRect(obs.x, obs.y, 20, 6);
            
            // Draw cactus arms if present
            if (obs.leftarm) {
                ctx.fillRect(obs.x - 10, obs.y + 10, 10, 10);
            }
            if (obs.rightarm) {
                ctx.fillRect(obs.x + 20, obs.y + 10, 10, 10);
            }
        } else if (obs.obtype == 2) {
            // Draw flying rock
            ctx.fillStyle = '#8a8a8a';
            ctx.fillRect(obs.x, obs.y, 20, obs.height);
        } else if (obs.obtype == 3) {
            // Draw fireball
            ctx.fillStyle = '#ff4500';
            ctx.beginPath();
            ctx.arc(obs.x + 15, obs.y + 15, 15, 0, Math.PI * 2);
            ctx.fill();
            // y position decreases as it moves down the screen
            obs.x -= 6 * (game.speed / 1.25);
            obs.y += obs.yvel * (game.speed / 1.25);
        }
    });
}

function render() {
    // Render all game visuals
    drawBackground();
    drawPlayer();
    drawObstacles();
}

function gameLoop() {
    // ===== CALCULATE DELTA TIME (for frame-rate independent movement) =====
    const currentTime = Date.now();
    deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    
    if (!game.started) {
        resetGame();
    }
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// ===== INPUT HANDLING =====
// Space/Up Arrow: Jump or restart game
window.addEventListener('keydown', event => {
    if ((event.code === 'Space' || event.code === 'ArrowUp') ) {
        event.preventDefault();

        if (game.gameOver) {
            resetGame();
            return;
        }

        if (!player.jumping) {
            player.height = 40;
            player.y = game.groundY - ( player.height+1 );
            player.dy = player.jumpPower;
            player.jumping = true;
        }
    }

    // Down Arrow: Duck (crouch) or increase fall speed if already in the air
    if (event.code === 'ArrowDown' && !game.gameOver) {
        event.preventDefault();

        player.y += 20;
        if (player.jumping) {
            player.dy += 5;
        }
        if (!player.jumping) {
            player.height = 20;
        }

    }
});

// Release Down Arrow: Stop ducking
window.addEventListener('keyup', event => {
    if (event.code === 'ArrowDown') {
        player.height = 40;
    }
});

// Handle canvas scaling on window resize
window.addEventListener('resize', () => {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
    canvas.style.transform = `scale(${scale})`;
});

resetGame();
gameLoop();
//refreshLeaderboard().catch(() => {});
// ===== DOM ELEMENTS =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
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
    if (game.score < 25000) {
        if (rand < 0.1 * game.score / 25000) {
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
    console.log('Spawning obstacle of type:', obtype);
    let x = game.width + 20;
    let height, width, leftarm, rightarm;
    let y;

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
        y = game.groundY - height;
    } else if (obtype == 2) {
        // Type 2: Flying rock 
        height = 20;
        width = 20;
        leftarm = false;
        rightarm = false;
        y = game.groundY - height;
        y -= Math.floor(Math.random() * 20) + 20;
    } else if (obtype == 3) {
        // Typer 3: Fireball 
        height = 30;
        width = 30;
        leftarm = false;
        rightarm = false;
        y = 0;
    }


    game.obstacles.push({
        x,
        y,
        width,
        height,
        leftarm,
        rightarm,
        obtype
    });
}

function update() {
    if (game.gameOver) return;

    const timeScale = deltaTime / BASE_FRAME_TIME; // Normalize time to 60 FPS baseline
    
    // ===== PLAYER PHYSICS =====
    game.score += 0.25 * timeScale;
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
        if (obs.x + 20 < -30) {
            game.obstacles.splice(i, 1);
        }
        // AABB collision detection between player and obstacle
        if (
            player.x < obs.x + 20 &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            game.gameOver = true;
            message.classList.remove('hidden');
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
    ctx.fillStyle = '#ffffff';
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
            obs.y += 2.6 * (game.speed / 1.25);
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

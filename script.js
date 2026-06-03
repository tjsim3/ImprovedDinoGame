const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreBoard = document.getElementById('scoreBoard');
const message = document.getElementById('message');

const game = {
    width: canvas.width,
    height: canvas.height,
    groundY: 240,
    speed: 6,
    obstacleTimer: 0,
    obstacleInterval: 90,
    obstacles: [],
    score: 0,
    gameOver: false,
    started: false
};

const player = {
    x: 80,
    y: game.groundY - 40,
    width: 40,
    height: 40,
    dy: 0,
    jumpPower: -12,
    gravity: 0.55,
    jumping: false
};

function resetGame() {
    game.speed = 6;
    game.obstacleTimer = 0;
    game.obstacleInterval = 90;
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

function spawnObstacle() {
    const height = Math.random() > 0.45 ? 50 : 30;
    const width = 18 + Math.floor(Math.random() * 12);
    game.obstacles.push({
        x: game.width + 20,
        y: game.groundY - height,
        width,
        height
    });
}

function update() {
    if (game.gameOver) return;

    game.score += 1;
    scoreBoard.textContent = 'SCORE: ' + game.score;

    player.dy += player.gravity;
    player.y += player.dy;

    if (player.y >= game.groundY - player.height) {
        player.y = game.groundY - player.height;
        player.dy = 0;
        player.jumping = false;
    }

    game.obstacleTimer += 1;
    if (game.obstacleTimer > game.obstacleInterval) {
        game.obstacleTimer = 0;
        spawnObstacle();
        game.obstacleInterval = 80 + Math.floor(Math.random() * 50);
    }

    for (let i = game.obstacles.length - 1; i >= 0; i--) {
        const obs = game.obstacles[i];
        obs.x -= game.speed;
        if (obs.x + obs.width < -30) {
            game.obstacles.splice(i, 1);
        }
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            game.gameOver = true;
            message.classList.remove('hidden');
        }
    }

    if (!game.gameOver && game.score % 200 === 0) {
        game.speed = 6 + Math.floor(game.score / 200);
    }
}

function drawBackground() {
    ctx.fillStyle = '#87c1ff';
    ctx.fillRect(0, 0, game.width, game.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, game.groundY, game.width, game.height - game.groundY);
    ctx.strokeStyle = '#5e5e5e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, game.groundY);
    ctx.lineTo(game.width, game.groundY);
    ctx.stroke();
}

function drawPlayer() {
    ctx.fillStyle = '#222222';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(player.x + 8, player.y + 8, 24, 8);
    ctx.fillRect(player.x + 10, player.y + 22, 20, 6);
}

function drawObstacles() {
    game.obstacles.forEach(obs => {
        ctx.fillStyle = '#3a7d44';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#27632f';
        ctx.fillRect(obs.x, obs.y, obs.width, 6);
    });
}

function render() {
    drawBackground();
    drawPlayer();
    drawObstacles();
}

function gameLoop() {
    if (!game.started) {
        resetGame();
    }
    update();
    render();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', event => {
    if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        if (game.gameOver) {
            resetGame();
            return;
        }
        if (!player.jumping) {
            player.dy = player.jumpPower;
            player.jumping = true;
        }
    }
});

window.addEventListener('resize', () => {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
    canvas.style.transform = `scale(${scale})`;
});

resetGame();
gameLoop();

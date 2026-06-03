const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreBoard = document.getElementById('scoreBoard');
const message = document.getElementById('message');

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

function spawnObstacle() {
    if (Math.random() > 0.5){
        height = 50;
    } else {
        height = 30;
    }
    const width = 20 + Math.round(Math.random() * 2) * 10;

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

    game.obstacles.push({
        x: game.width + 20,
        y: game.groundY - height,
        width,
        height,
        leftarm,
        rightarm
    });
}

function update() {
    if (game.gameOver) return;

    game.score += 0.25;
    scoreBoard.textContent = 'SCORE: ' + Math.floor(game.score);

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
        game.obstacleInterval = 125 + Math.floor(Math.random() * 175);
    }

    for (let i = game.obstacles.length - 1; i >= 0; i--) {
        const obs = game.obstacles[i];
        obs.x -= game.speed;
        if (obs.x + 20 < -30) {
            game.obstacles.splice(i, 1);
        }
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

    if (!game.gameOver && game.score % 200 === 0) {
        game.speed = 1.25 + 0.2 * Math.floor(game.score / 200);
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
    const dinoImg = new Image();
    dinoImg.src = 'dino.png';
    ctx.drawImage(dinoImg, player.x, player.y, player.width, player.height);
}

function drawObstacles() {
    game.obstacles.forEach(obs => {
        ctx.fillStyle = '#3a7d44';
        ctx.fillRect(obs.x, obs.y, 20, obs.height);
        ctx.fillStyle = '#27632f';
        ctx.fillRect(obs.x, obs.y, 20, 6);
        
        if (obs.leftarm) {
            ctx.fillRect(obs.x - 10, obs.y + 10, 10, 10);
        }
        if (obs.rightarm) {
            ctx.fillRect(obs.x + 20, obs.y + 10, 10, 10);
        }
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

    if (event.code === 'ArrowDown') {
        event.preventDefault();

        if (player.jumping) {
            player.dy += 5;
        }
        if (!player.jumping) {
            player.height = 20;
        }

    }
});

window.addEventListener('keyup', event => {
    if (event.code === 'ArrowDown') {
        player.height = 40;
    }
});

window.addEventListener('resize', () => {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
    canvas.style.transform = `scale(${scale})`;
});

resetGame();
gameLoop();

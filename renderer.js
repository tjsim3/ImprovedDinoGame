// ===== RENDERING =====
// All canvas drawing lives here. Drawing is pure: fireball movement is owned by
// game.js, this module only paints what it's given.

import { DINOS } from './state.js';

function drawBackground(ctx, game) {
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

function drawPterodactyl(ctx, player) {
    const x = player.x;
    const y = player.y;
    const w = player.width;
    const h = player.height;
    const flap = Math.sin(Date.now() / 150) * 6;
    ctx.fillStyle = '#5a3fa0';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6fd0';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h / 2);
    ctx.lineTo(x + w / 2 + 15, y + h / 2 - 11 - flap);
    ctx.lineTo(x + w / 2 + 15, y + h / 2 + 11 - flap);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h / 2);
    ctx.lineTo(x + w / 2 - 13, y + h / 2 - 9 + flap);
    ctx.lineTo(x + w / 2 - 13, y + h / 2 + 9 + flap);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a33d';
    ctx.beginPath();
    ctx.moveTo(x + w, y + h / 2);
    ctx.lineTo(x + w + 12, y + h / 2 + 2);
    ctx.lineTo(x + w, y + h / 2 + 8);
    ctx.closePath();
    ctx.fill();
}

function drawStegosaurus(ctx, player) {
    const x = player.x;
    const y = player.y;
    const w = player.width;
    const h = player.height;
    ctx.fillStyle = '#2e6b34';
    ctx.fillRect(x + 5, y + h - 8, 8, 8);
    ctx.fillRect(x + w - 13, y + h - 8, 8, 8);
    ctx.fillStyle = '#3d8b45';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 12, w / 2, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#275f2e';
    for (let i = 0; i < 4; i++) {
        const px = x + 5 + i * 9;
        ctx.beginPath();
        ctx.moveTo(px, y + h - 24);
        ctx.lineTo(px + 4, y + h - 32);
        ctx.lineTo(px + 9, y + h - 24);
        ctx.closePath();
        ctx.fill();
    }
    ctx.fillStyle = '#4a9c53';
    ctx.beginPath();
    ctx.arc(x + w - 2, y + h - 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + w - 1, y + h - 15, 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawPlayer(ctx, game, player, dinoImg, pteroImg) {
    const sprite = DINOS[game.mode] ? DINOS[game.mode].sprite : 'trex';
    if (sprite === 'trex') {
        ctx.drawImage(dinoImg, player.x, player.y, player.width, player.height);
    } else if (sprite === 'ptero') {
        ctx.drawImage(pteroImg, player.x, player.y, player.width, player.height);
    } else {
        drawStegosaurus(ctx, player);
    }
}

function drawObstacles(ctx, game, pteroImg) {
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
        } else if (obs.obtype == 4) {
            // Draw spike rock (cannot be eaten)
            ctx.fillStyle = '#6b6b6b';
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            ctx.fillStyle = '#3f3f3f';
            for (let sx = obs.x; sx <= obs.x + obs.width - 4; sx += 8) {
                ctx.beginPath();
                ctx.moveTo(sx - 3, obs.y);
                ctx.lineTo(sx + 2, obs.y - 9);
                ctx.lineTo(sx + 7, obs.y);
                ctx.closePath();
                ctx.fill();
            }
        } else if (obs.obtype == 5) {
            // Draw enemy pterodactyl
            ctx.drawImage(pteroImg, obs.x, obs.y, 40, 40);
        }
    });
}

function render(ctx, game, player, dinoImg, pteroImg) {
    // Render all game visuals
    drawBackground(ctx, game);
    drawPlayer(ctx, game, player, dinoImg, pteroImg);
    drawObstacles(ctx, game, pteroImg);
}

export { render };

// ===== RENDERING =====
// All canvas drawing lives here. Drawing is pure: fireball movement is owned by
// game.js, this module only paints what it's given.

import { DINOS, weather } from './state.js';

// Cached red-tinted, flippable sprite for enemy pterodactyls
let enemyPteroCache = null;

function getEnemyPteroSprite(pteroImg) {
    if (!pteroImg || !pteroImg.width) return null;
    if (enemyPteroCache) return enemyPteroCache;
    const c = document.createElement('canvas');
    c.width = pteroImg.width;
    c.height = pteroImg.height;
    const cx = c.getContext('2d');
    cx.drawImage(pteroImg, 0, 0);
    cx.globalCompositeOperation = 'source-atop';
    cx.fillStyle = '#c0392b';
    cx.fillRect(0, 0, c.width, c.height);
    enemyPteroCache = c;
    return c;
}

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

function drawPlayer(ctx, game, player, dinoImg, pteroImg, stegImg) {
    const sprite = DINOS[game.mode] ? DINOS[game.mode].sprite : 'trex';
    if (sprite === 'trex') {
        ctx.drawImage(dinoImg, player.x, player.y, player.width, player.height);
    } else if (sprite === 'ptero') {
        ctx.drawImage(pteroImg, player.x, player.y, player.width, player.height);
    } else {
        ctx.drawImage(stegImg, player.x, player.y, player.width, player.height);
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
            // Draw enemy pterodactyl: red version of the player sprite, flipped to face left
            const sprite = getEnemyPteroSprite(pteroImg);
            if (sprite) {
                ctx.save();
                ctx.translate(obs.x + 40, obs.y);
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, 0, 0, 40, 40);
                ctx.restore();
            }
        }
    });
}

// ===== CLOUDS & WEATHER =====
// All effects are purely visual. Weather state (type/intensity/fade) is owned by
// game.js; this module only paints it. Elapsed time below is in seconds,
// converted from the base-frame unit clock.

// Clouds are re-seeded lazily once canvas dimensions are available.
let clouds = null;
function getClouds(game) {
    if (!clouds) {
        clouds = [];
        for (let i = 0; i < 7; i++) {
            clouds.push({
                x0: Math.random() * game.width,
                y: 18 + Math.random() * (game.groundY - 130),
                scale: 0.7 + Math.random() * 0.9,
                speed: 14 + Math.random() * 20,
                puffs: 3 + Math.floor(Math.random() * 3),
            });
        }
    }
    return clouds;
}

function cloudFillColor() {
    switch (weather.type) {
        case 'rain': return 'rgba(168,178,190,0.85)';
        case 'snow': return 'rgba(255,255,255,0.95)';
        case 'fog': return 'rgba(214,220,226,0.9)';
        case 'night': return 'rgba(45,55,82,0.9)';
        case 'lightning': return 'rgba(70,80,105,0.92)';
        default: return 'rgba(255,255,255,0.92)';
    }
}

function drawCloud(ctx, x, y, scale) {
    ctx.beginPath();
    ctx.arc(x, y, 16 * scale, 0, Math.PI * 2);
    ctx.arc(x + 18 * scale, y - 8 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.arc(x + 38 * scale, y - 2 * scale, 16 * scale, 0, Math.PI * 2);
    ctx.arc(x + 20 * scale, y + 6 * scale, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
}

function drawClouds(ctx, game) {
    const t = weather.elapsed * 0.004;
    const span = game.width + 240;
    ctx.save();
    ctx.fillStyle = cloudFillColor();
    for (const c of getClouds(game)) {
        let x = ((c.x0 - t * c.speed) % span + span) % span - 120;
        for (let p = 0; p < c.puffs; p++) {
            drawCloud(ctx, x + p * 34 * c.scale, c.y + (p % 2) * 4, c.scale);
        }
    }
    ctx.restore();
}

function drawSun(ctx, game, alpha) {
    const sx = game.width * 0.16;
    const sy = 66;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 42;
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.arc(sx, sy, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff3a0';
    ctx.beginPath();
    ctx.arc(sx, sy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawRain(ctx, game, t, alpha) {
    ctx.save();
    ctx.strokeStyle = 'rgba(169,198,232,0.7)';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = alpha;
    const count = 70;
    const fall = 340;
    for (let i = 0; i < count; i++) {
        const x = ((i * 97 + t * 250) % (game.width + 40)) - 20;
        const y = ((i * 53 + t * fall) % (game.height + 40)) - 20;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2, y + 14);
        ctx.stroke();
    }
    ctx.restore();
}

function drawSnow(ctx, game, t, alpha) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = alpha * 0.9;
    const count = 55;
    for (let i = 0; i < count; i++) {
        const drift = Math.sin(t * 1.5 + i * 1.7) * 12;
        const x = ((i * 89 + t * 45 + drift) % (game.width + 20)) - 10;
        const y = ((i * 61 + t * 90) % (game.height + 20)) - 10;
        ctx.beginPath();
        ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawFog(ctx, game, t, alpha) {
    ctx.save();
    // Full-canvas veil: obstacles ahead fade out of view
    ctx.globalAlpha = alpha * 0.28;
    ctx.fillStyle = '#cfd8dd';
    ctx.fillRect(0, 0, game.width, game.height);
    // Drifting banks hugging the ground line
    for (let i = 0; i < 6; i++) {
        const cx = ((i * 260 + t * (36 + i * 9)) % (game.width + 300)) - 150;
        const cy = game.groundY - 16 - (i % 3) * 26;
        ctx.globalAlpha = alpha * (0.14 + 0.10 * (i % 3) / 2);
        ctx.beginPath();
        ctx.ellipse(cx, cy, 150 + i * 30, 34, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawNight(ctx, game, t, alpha) {
    ctx.save();
    // Darken everything: obstacles become hard to pick out
    ctx.globalAlpha = alpha * 0.72;
    ctx.fillStyle = '#0d1326';
    ctx.fillRect(0, 0, game.width, game.height);
    // Stars
    for (let i = 0; i < 60; i++) {
        const x = ((i * 73 + Math.sin(i * 12.3) * 40) % game.width + game.width) % game.width;
        const y = (i * 47) % (game.groundY - 60);
        const tw = 0.5 + 0.5 * Math.sin(t * (2 + (i % 4)) + i * 3);
        ctx.globalAlpha = alpha * (0.3 + 0.6 * tw);
        const s = 1 + (i % 3) * 0.5;
        ctx.fillRect(x, y, s, s);
    }
    // Moon with a soft glow
    const mx = game.width * 0.8;
    const my = 64;
    ctx.globalAlpha = alpha * 0.9;
    ctx.shadowColor = '#f5f3e3';
    ctx.shadowBlur = 36;
    ctx.fillStyle = '#f5f3e3';
    ctx.beginPath();
    ctx.arc(mx, my, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e8e3c8';
    ctx.beginPath();
    ctx.arc(mx, my, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cfc9ab';
    ctx.beginPath();
    ctx.arc(mx - 9, my + 5, 5, 0, Math.PI * 2);
    ctx.arc(mx + 7, my - 8, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawBolt(ctx, seed, x, top, bottom) {
    ctx.strokeStyle = 'rgba(255,248,217,0.95)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, top);
    let y = top;
    let seg = 0;
    while (y < bottom) {
        y += 26;
        x += Math.sin(seed * 7.3 + seg * 1.9) * 18;
        ctx.lineTo(x, Math.min(y, bottom));
        seg++;
    }
    ctx.stroke();
}

function drawLightning(ctx, game, t, alpha) {
    ctx.save();
    // Stormy dark overlay + rain
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = '#1b2233';
    ctx.fillRect(0, 0, game.width, game.height);
    drawRain(ctx, game, t, alpha * 0.8);
    // Random-feeling but deterministic flashes that white the screen out
    const flash = Math.pow(Math.max(0, Math.sin(t * 1.1)), 42);
    ctx.globalAlpha = flash * alpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, game.width, game.height);
    if (flash > 0.6) {
        const seed = Math.floor(t * 2);
        const bx = ((seed * 137.5) % game.width + game.width) % game.width;
        drawBolt(ctx, seed, bx, 0, game.groundY - 40);
    }
    ctx.restore();
}

function drawWeatherBackdrop(ctx, game) {
    const alpha = weather.intensity * weather.fade;
    if (weather.type === 'sunny') drawSun(ctx, game, alpha);
}

function drawWeatherOverlay(ctx, game) {
    const alpha = weather.intensity * weather.fade;
    const t = weather.elapsed * 0.004;
    if (alpha <= 0) return;
    switch (weather.type) {
        case 'rain': drawRain(ctx, game, t, alpha); break;
        case 'snow': drawSnow(ctx, game, t, alpha); break;
        case 'fog': drawFog(ctx, game, t, alpha); break;
        case 'night': drawNight(ctx, game, t, alpha); break;
        case 'lightning': drawLightning(ctx, game, t, alpha); break;
    }
}

function render(ctx, game, player, dinoImg, pteroImg, stegImg) {
    // Render all game visuals
    drawBackground(ctx, game);
    drawWeatherBackdrop(ctx, game);
    drawClouds(ctx, game);
    drawPlayer(ctx, game, player, dinoImg, pteroImg, stegImg);
    drawObstacles(ctx, game, pteroImg);
    drawWeatherOverlay(ctx, game);
}

export { render };

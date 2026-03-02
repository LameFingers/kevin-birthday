const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const message = document.getElementById('message');

let exploded = false;
let particles = [];
let bannerLetters = [];
let hearts = [];
let frame = 0;
let shakeX = 0, shakeY = 0;
let shaking = false, shakeTimer = 0;
let bobaPearls = [];
let bobaExploded = false;

// ─── CANVAS RESIZE ───────────────────────────────────────────────
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─── BOBA CUP METRICS ───────────────────────────────────────────
function getBobaMetrics() {
    const scale = Math.min(canvas.width, canvas.height) / 700;
    const W = 160 * scale;
    const H = 220 * scale;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 30 * scale;
    return { W, H, cx, cy, scale };
}

// ─── INIT BOBA PEARLS ────────────────────────────────────────────
function initBobaPearls() {
    bobaPearls = [];
    const { W, H, cx, cy, scale } = getBobaMetrics();
    const cupBottom = cy + H * 0.42;
    const cupTop    = cy - H * 0.05;
    const pearlR    = 12 * scale;
    const positions = [
        { x: -0.28, y: 0.0 }, { x: 0,    y: 0.0 }, { x: 0.28,  y: 0.0 },
        { x: -0.18, y: 0.3 }, { x: 0.18, y: 0.3 },
        { x: -0.28, y: 0.6 }, { x: 0,    y: 0.6 }, { x: 0.28,  y: 0.6 }
    ];
    positions.forEach(p => {
        bobaPearls.push({
            x: cx + p.x * W,
            y: cupTop + (cupBottom - cupTop) * (0.35 + p.y * 0.55),
            vx: 0, vy: 0,
            r: pearlR,
            color: '#2d3436',
            launched: false,
            life: 1
        });
    });
}

// ─── LAUNCH PEARLS ───────────────────────────────────────────────
function launchPearls() {
    bobaPearls.forEach((p, i) => {
        setTimeout(() => {
            p.launched = true;
            p.vx = (Math.random() - 0.5) * 30;
            p.vy = -(Math.random() * 22 + 14);
            p.color = `hsl(${Math.random() * 360}, 80%, 55%)`;
        }, i * 40);
    });
}

// ─── CONFETTI EXPLOSION ──────────────────────────────────────────
function createExplosion() {
    const { cx, cy } = getBobaMetrics();
    for (let i = 0; i < 200; i++) {
        const angle = (Math.PI * 2 / 200) * i;
        const speed = Math.random() * 18 + 4;
        particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 8,
            radius: Math.random() * 7 + 2,
            color: `hsl(${Math.random() * 360}, 90%, 65%)`,
            life: 1,
            decay: Math.random() * 0.012 + 0.006,
            shape: Math.random() > 0.5 ? 'circle' : 'rect',
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.3
        });
    }
}

// ─── CREATE BANNER ───────────────────────────────────────────────
function createBanner() {
    bannerLetters = [];
    const line1 = "HAPPY BIRTHDAY,";
    const line2 = "KEVIN!";
    const line3 = "I love you so much...";
    const line4 = "Marry Me? 💍";
    const lines = [line1, line2, line3, line4];
    const maxW = canvas.width * 0.9;
    let globalIndex = 0;

    lines.forEach((line, lineIndex) => {
        const isProposal = lineIndex >= 2;
        const baseFontSize = isProposal
            ? Math.min(110, canvas.width / 7)
            : Math.min(120, canvas.width / 8);

        ctx.font = `900 ${baseFontSize}px Arial Black, Arial, sans-serif`;
        let fontSize = baseFontSize;
        while (ctx.measureText(line).width > maxW && fontSize > 18) {
            fontSize -= 1;
            ctx.font = `900 ${fontSize}px Arial Black, Arial, sans-serif`;
        }

        const totalWidth = ctx.measureText(line).width;
        const lineYMap   = [0.18, 0.34, 0.58, 0.76];
        const lineY      = canvas.height * lineYMap[lineIndex];
        let currentX     = (canvas.width - totalWidth) / 2;
        const lineDelay  = isProposal ? 1.4 + (lineIndex - 2) * 0.6 : 0;

        for (const char of line) {
            const charWidth = ctx.measureText(char).width;
            const charCX    = currentX + charWidth / 2;
            const entranceType = globalIndex % 6;

            let startX, startY;
            if      (entranceType === 0) { startX = -300;                      startY = lineY; }
            else if (entranceType === 1) { startX = canvas.width + 300;        startY = lineY; }
            else if (entranceType === 2) { startX = charCX;                    startY = -200; }
            else if (entranceType === 3) { startX = charCX;                    startY = canvas.height + 200; }
            else if (entranceType === 4) { startX = Math.random() * canvas.width; startY = -300; }
            else                         { startX = Math.random() < 0.5 ? -300 : canvas.width + 300; startY = Math.random() * canvas.height; }

            bannerLetters.push({
                text: char,
                finalX: charCX,
                finalY: lineY,
                x: startX,
                y: startY,
                life: 0,
                delay: lineDelay + globalIndex * 0.035,
                size: fontSize,
                hue: isProposal ? (globalIndex * 18) % 360 : (globalIndex * 25) % 360,
                scale: 0,
                rotation: (Math.random() - 0.5) * Math.PI * 2,
                phase: 'fly',
                glowTimer: 0,
                isProposal,
                entryScale: isProposal ? 4.0 : 2.0,
                wobble: Math.random() * Math.PI * 2
            });
            currentX += charWidth;
            globalIndex++;
        }
    });
}

// ─── HEARTS ──────────────────────────────────────────────────────
function spawnHearts(x, y) {
    for (let i = 0; i < 18; i++) {
        hearts.push({
            x, y,
            vx: (Math.random() - 0.5) * 14,
            vy: -(Math.random() * 10 + 5),
            size: Math.random() * 22 + 10,
            color: `hsl(${Math.random() * 60 + 320}, 100%, 65%)`,
            life: 1,
            decay: Math.random() * 0.012 + 0.006,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.15
        });
    }
}

function drawHeart(x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y,           x - size, y,           x - size, y + size * 0.3);
    ctx.bezierCurveTo(x - size, y + size * 0.7, x, y + size * 1.1, x, y + size * 1.3);
    ctx.bezierCurveTo(x, y + size * 1.1, x + size, y + size * 0.7, x + size, y + size * 0.3);
    ctx.bezierCurveTo(x + size, y,     x, y,                x, y + size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function updateHearts() {
    for (let i = hearts.length - 1; i >= 0; i--) {
        const h = hearts[i];
        h.x  += h.vx;
        h.y  += h.vy;
        h.vy += 0.25;
        h.vx *= 0.97;
        h.life -= h.decay;
        h.rot  += h.rotSpeed;
        if (h.life <= 0) hearts.splice(i, 1);
    }
}

function drawHearts() {
    hearts.forEach(h => {
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rot);
        drawHeart(-h.size / 2, -h.size / 2, h.size / 2, h.color, h.life);
        ctx.restore();
    });
}

// ─── UPDATE PARTICLES ────────────────────────────────────────────
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.45;
        p.vx *= 0.99;
        p.life -= p.decay;
        p.rot  += p.rotSpeed;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function updatePearls() {
    bobaPearls.forEach(p => {
        if (!p.launched) return;
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.6;
        p.vx *= 0.97;
        p.life -= 0.005;
    });
}

// ─── UPDATE BANNER ───────────────────────────────────────────────
function updateBanner() {
    const t = frame / 60;
    bannerLetters.forEach((letter, i) => {
        const progress = Math.max(0, t - letter.delay);
        if (progress <= 0) return;

        letter.life      = Math.min(1, letter.life + 0.04);
        letter.glowTimer += 0.05;
        letter.wobble    += 0.04;

        if (letter.phase === 'fly') {
            const dx = letter.finalX - letter.x;
            const dy = letter.finalY - letter.y;
            letter.x += dx * 0.13;
            letter.y += dy * 0.13;
            letter.scale = Math.min(letter.entryScale, letter.scale + 0.08);
            letter.scale = Math.max(0.01, letter.scale);
            letter.rotation *= 0.82;

            if (Math.abs(dx) < 1.5 && Math.abs(dy) < 1.5) {
                letter.phase    = 'settle';
                letter.x        = letter.finalX;
                letter.y        = letter.finalY;
                letter.scale    = 1;
                letter.rotation = 0;
                if (letter.isProposal) spawnHearts(letter.x, letter.y);
            }
        }

        if (letter.phase === 'settle') {
            if (letter.isProposal) {
                letter.scale = 1 + 0.18 * Math.sin(t * 5 + i * 0.7);
                letter.y     = letter.finalY + Math.sin(t * 2.5 + i * 0.4) * 6;
            } else {
                letter.scale = 1 + 0.07 * Math.sin(t * 3.5 + i * 0.5);
            }
        }
    });
}

// ─── DRAW PARTICLES ──────────────────────────────────────────────
function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.shape === 'rect') {
            ctx.fillRect(-p.radius, -p.radius * 0.5, p.radius * 2, p.radius);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });
}

function drawPearls() {
    bobaPearls.forEach(p => {
        if (!p.launched) return;
        ctx.save();
        ctx.globalAlpha  = Math.max(0, p.life);
        ctx.fillStyle    = p.color;
        ctx.shadowColor  = p.color;
        ctx.shadowBlur   = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// ─── DRAW BANNER ─────────────────────────────────────────────────
function drawBanner() {
    ctx.save();
    bannerLetters.forEach((letter, i) => {
        if (letter.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.min(1, letter.life);
        ctx.translate(letter.x, letter.y);
        ctx.rotate(letter.rotation);
        ctx.scale(letter.scale, letter.scale);

        const hue = (letter.hue + frame * 2.5) % 360;
        ctx.font        = `900 ${letter.size}px Arial Black, Arial, sans-serif`;
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';

        if (letter.isProposal) {
            const pulseGlow = 40 + 30 * Math.sin(letter.glowTimer * 4 + i);
            ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
            ctx.shadowBlur  = pulseGlow;
            ctx.fillStyle   = `hsl(${hue}, 100%, 75%)`;
            ctx.fillText(letter.text, 0, 0);

            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur  = pulseGlow * 0.5;
            ctx.fillText(letter.text, 0, 0);

            ctx.shadowBlur  = 0;
            ctx.strokeStyle = '#4a0030';
            ctx.lineWidth   = letter.size * 0.09;
            ctx.lineJoin    = 'round';
            ctx.strokeText(letter.text, 0, 0);

            ctx.fillStyle = `hsl(${(hue + 60) % 360}, 100%, 90%)`;
            ctx.fillText(letter.text, 0, 0);
        } else {
            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            ctx.shadowBlur  = 30 + 20 * Math.sin(letter.glowTimer * 3 + i);
            ctx.fillStyle   = `hsl(${hue}, 100%, 70%)`;
            ctx.fillText(letter.text, 0, 0);

            ctx.shadowBlur  = 0;
            ctx.strokeStyle = '#1a1a2e';
            ctx.lineWidth   = letter.size * 0.08;
            ctx.lineJoin    = 'round';
            ctx.strokeText(letter.text, 0, 0);

            ctx.fillStyle = `hsl(${(hue + 40) % 360}, 100%, 85%)`;
            ctx.fillText(letter.text, 0, 0);
        }
        ctx.restore();
    });
    ctx.restore();
}

// ─── DRAW BOBA CUP ───────────────────────────────────────────────
function drawSparkle(x, y, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 8;
    for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        ctx.stroke();
    }
    ctx.restore();
}

function drawBobaCup() {
    const { W, H, cx, cy, scale } = getBobaMetrics();

    const cupTopY    = cy - H * 0.35;
    const cupBottomY = cy + H * 0.42;
    const cupTopW    = W;
    const cupBotW    = W * 0.88;
    const lidH       = H * 0.10;
    const lidY       = cupTopY;
    const lidW       = W * 1.04;
    const strawW     = W * 0.12;
    const strawTop   = lidY - H * 0.40;
    const strawBot   = lidY + lidH;
    const drinkTopY  = cupTopY + lidH * 1.2;

    ctx.save();
    if (shaking) ctx.translate(shakeX, shakeY);

    // Straw
    ctx.beginPath();
    ctx.rect(cx - strawW / 2, strawTop, strawW, strawBot - strawTop);
    ctx.fillStyle = '#74b9ff';
    ctx.fill();
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 3 * scale;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(cx - strawW / 2 + strawW * 0.15, strawTop, strawW * 0.25, strawBot - strawTop);

    // Cup body trapezoid
    const tl = cx - cupTopW / 2;
    const tr = cx + cupTopW / 2;
    const bl = cx - cupBotW / 2;
    const br = cx + cupBotW / 2;

    // Liquid fill
    ctx.beginPath();
    ctx.moveTo(tl, drinkTopY);
    ctx.lineTo(tr, drinkTopY);
    ctx.lineTo(br, cupBottomY);
    ctx.lineTo(bl, cupBottomY);
    ctx.closePath();
    ctx.fillStyle = '#f4c87a';
    ctx.fill();

    // Cup outline
    ctx.beginPath();
    ctx.moveTo(tl, drinkTopY);
    ctx.lineTo(tr, drinkTopY);
    ctx.lineTo(br, cupBottomY);
    ctx.lineTo(bl, cupBottomY);
    ctx.closePath();
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth   = 5 * scale;
    ctx.stroke();

    // Cup shine
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(tl, drinkTopY);
    ctx.lineTo(tl + cupTopW * 0.2, drinkTopY);
    ctx.lineTo(bl + cupBotW * 0.18, cupBottomY);
    ctx.lineTo(bl, cupBottomY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Pearls inside cup (before explosion)
    if (!bobaExploded) {
        bobaPearls.forEach(p => {
            ctx.fillStyle = '#2d3436';
            ctx.beginPath();
            ctx.arc(p.x + (shaking ? shakeX : 0), p.y + (shaking ? shakeY : 0), p.r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Lid (rounded rect)
    const lidLeft  = cx - lidW / 2;
    const lidRight = cx + lidW / 2;
    const lidR     = lidH * 0.5;
    ctx.beginPath();
    ctx.moveTo(lidLeft + lidR, lidY);
    ctx.lineTo(lidRight - lidR, lidY);
    ctx.quadraticCurveTo(lidRight, lidY, lidRight, lidY + lidR);
    ctx.lineTo(lidRight, lidY + lidH - lidR);
    ctx.quadraticCurveTo(lidRight, lidY + lidH, lidRight - lidR, lidY + lidH);
    ctx.lineTo(lidLeft + lidR, lidY + lidH);
    ctx.quadraticCurveTo(lidLeft, lidY + lidH, lidLeft, lidY + lidH - lidR);
    ctx.lineTo(lidLeft, lidY + lidR);
    ctx.quadraticCurveTo(lidLeft, lidY, lidLeft + lidR, lidY);
    ctx.closePath();
    ctx.fillStyle   = '#8B5E3C';
    ctx.fill();
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth   = 4 * scale;
    ctx.stroke();

    // Lid highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, lidY + lidH * 0.3, lidW * 0.35, lidH * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sparkles (like reference image)
    const sparkPulse = 0.8 + 0.2 * Math.sin(frame * 0.08);
    drawSparkle(cx - W * 0.85, cy - H * 0.15, 18 * scale * sparkPulse, '#4ecdc4');
    drawSparkle(cx + W * 0.80, cy + H * 0.20, 12 * scale * sparkPulse, '#f9ca24');

    ctx.restore();
}

// ─── SHAKE ───────────────────────────────────────────────────────
function startShake() {
    shaking = true;
    shakeTimer = 30;
}

function updateShake() {
    if (!shaking) return;
    shakeTimer--;
    const intensity = (shakeTimer / 30) * 12;
    shakeX = (Math.random() - 0.5) * intensity;
    shakeY = (Math.random() - 0.5) * intensity;
    if (shakeTimer <= 0) { shaking = false; shakeX = 0; shakeY = 0; }
}

// ─── BACKGROUND ──────────────────────────────────────────────────
function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (exploded) {
        const t = frame * 0.01;
        grad.addColorStop(0, `hsl(${200 + Math.sin(t) * 40}, 80%, 12%)`);
        grad.addColorStop(1, `hsl(${280 + Math.cos(t) * 40}, 80%, 12%)`);
    } else {
        grad.addColorStop(0, '#ffecd2');
        grad.addColorStop(1, '#fcb69f');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ─── MAIN LOOP ───────────────────────────────────────────────────
function animate() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    updateShake();

    if (!exploded) {
        drawBobaCup();
    } else {
        updateParticles();
        updatePearls();
        updateBanner();
        updateHearts();
        drawParticles();
        drawPearls();
        drawHearts();
        drawBanner();
    }

    requestAnimationFrame(animate);
}

// ─── INIT ────────────────────────────────────────────────────────
initBobaPearls();

canvas.addEventListener('click', () => {
    if (!exploded) {
        startShake();
        setTimeout(() => {
            bobaExploded = true;
            createExplosion();
            launchPearls();
            createBanner();
            exploded = true;
            message.textContent = '💍 Will you say yes? 💍';
        }, 400);
    }
});

animate();

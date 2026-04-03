const API_BASE = 'http://127.0.0.1:8000';

let settings = {
  theme: 'dark',
  musicEnabled: true,
  sfxEnabled: true
};

let playerName = '';

function loadSettings() {
  const saved = sessionStorage.getItem('gameSettings');
  if (saved) {
    settings = JSON.parse(saved);
    applyTheme();
  }
}

function applyTheme() {
  if (settings.theme === 'light') {
    document.body.classList.add('light-theme');
    document.getElementById('theme-toggle').checked = true;
    const gameOverBg = document.getElementById('game-over-bg');
    if (gameOverBg) gameOverBg.src = 'img/game_over_light.png';
  } else {
    document.body.classList.remove('light-theme');
    document.getElementById('theme-toggle').checked = false;
    const gameOverBg = document.getElementById('game-over-bg');
    if (gameOverBg) gameOverBg.src = 'img/game_over_dark.png';
  }
}

function saveSettings() {
  localStorage.setItem('chaiiwalaBirdSettings', JSON.stringify(settings));
  sessionStorage.setItem('gameSettings', JSON.stringify(settings));
}

function toggleSettings() {
  document.getElementById('settings-panel').classList.toggle('active');
}

function toggleTheme() {
  settings.theme = document.getElementById('theme-toggle').checked ? 'light' : 'dark';
  applyTheme();
  saveSettings();
}

// ── GAME OBJECTS ─────────────────────────────────────────────────────────────

let board, context;

// ── BACKGROUND IMAGES ────────────────────────────────────────────────────────
const bgImgDark = new Image();
bgImgDark.src = 'img/game_bg_dark.png';

const bgImgLight = new Image();
bgImgLight.src = 'img/game_bg_light.png';

// ── STORE SCROLLING ───────────────────────────────────────────────────────────
const STORE_IMAGES = [
  'img/stores/store1.png',
  'img/stores/store2.png',
  'img/stores/store3.png',
  'img/stores/store4.png',
  'img/stores/store5.png',
  'img/stores/store6.png',
  'img/stores/store7.png',
  'img/stores/store8.png',
];

const STORE_HEIGHT_RATIO = 0.45;
const STORE_GAP = 10;
const STORE_SPEED_MULT = 0.5;

let storeImgs = [];
let storesReady = false;
let storeStrip = [];

function loadStoreImages() {
  let loaded = 0;
  STORE_IMAGES.forEach((src, i) => {
    const img = new Image();
    img.onload  = () => { loaded++; if (loaded === STORE_IMAGES.length) { storesReady = true; initStoreStrip(); } };
    img.onerror = () => { loaded++; if (loaded === STORE_IMAGES.length) { storesReady = true; initStoreStrip(); } };
    img.src = src;
    storeImgs[i] = img;
  });
}

function initStoreStrip() {
  storeStrip = [];
  const storeH = board.height * STORE_HEIGHT_RATIO;
  const shuffled = [...storeImgs].sort(() => Math.random() - 0.5);
  let x = 0;
  let idx = 0;
  while (x < board.width * 2) {
    const img = shuffled[idx % shuffled.length];
    const w = img.naturalWidth && img.naturalHeight
      ? Math.round(storeH * img.naturalWidth / img.naturalHeight)
      : Math.round(storeH * 0.75);
    storeStrip.push({ img, x, w });
    x += w + STORE_GAP;
    idx++;
  }
}

function drawStores() {
  if (!storesReady || storeStrip.length === 0) return;

  const storeH = board.height * STORE_HEIGHT_RATIO;
  const drawY  = board.height - storeH;

  if (gameStarted && !gameOver) {
    const speed = Math.abs(handSpeed) * STORE_SPEED_MULT;
    storeStrip.forEach(s => { s.x -= speed; });

    if (storeStrip[0].x + storeStrip[0].w < 0) {
      const last = storeStrip[storeStrip.length - 1];
      const first = storeStrip.shift();
      first.x = last.x + last.w + STORE_GAP;
      storeStrip.push(first);
    }
  }

  storeStrip.forEach(s => {
    if (s.x + s.w < 0 || s.x > board.width) return;
    context.drawImage(s.img, s.x, drawY, s.w, storeH);
  });
}



// ── SCREEN SHAKE ──────────────────────────────────────────────────────────────
let shakeFrames = 0;
let shakeMagnitude = 0;

function triggerShake(frames = 12, magnitude = 8) {
  shakeFrames = frames;
  shakeMagnitude = magnitude;
}

function applyShake() {
  if (shakeFrames <= 0) return;
  const dx = (Math.random() - 0.5) * shakeMagnitude;
  const dy = (Math.random() - 0.5) * shakeMagnitude;
  context.translate(dx, dy);
  shakeFrames--;
  shakeMagnitude *= 0.85; // decay
}

// ── MILESTONE MESSAGES ────────────────────────────────────────────────────────
const MILESTONES = {
  10: '🔥 HEATING UP!',
  25: '💀 BEAST MODE!',
  50: '🏆 LEGENDARY!',
  100: '☕ CHAI GOD!',
};

let milestoneMsg = '';
let milestoneTimer = 0;

function checkMilestone(score) {
  const s = Math.floor(score);
  if (MILESTONES[s] && milestoneMsg !== MILESTONES[s]) {
    milestoneMsg = MILESTONES[s];
    milestoneTimer = 120; // frames (~2 seconds)
  }
}

function drawMilestone() {
  if (milestoneTimer <= 0) return;
  const alpha = Math.min(1, milestoneTimer / 30); // fade out last 30 frames
  const scale = milestoneTimer > 90 ? 1 + (120 - milestoneTimer) * 0.02 : 1; // pop in
  context.save();
  context.globalAlpha = alpha;
  context.font = `bold ${Math.round(36 * scale)}px MyriadPro`;
  context.textAlign = 'center';
  context.fillStyle = '#FFD700';
  context.shadowColor = 'rgba(0,0,0,0.8)';
  context.shadowBlur = 10;
  context.fillText(milestoneMsg, board.width / 2, board.height / 3);
  context.restore();
  milestoneTimer--;
}

// ── HAPTIC FEEDBACK ───────────────────────────────────────────────────────────
function haptic(pattern = [30]) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ─────────────────────────────────────────────────────────────────────────────

let birdx, birdy;
let birdwidth = 60;
let birdheight = 45;
let bird;

// birdImg src set in window.onload from sessionStorage
let birdImg = new Image();

let velocityY = 0;
let gravity = 0.2;
let jump = -6;

let handarray = [];
const IMG_W = 308;
const IMG_H = 811;
const TOTEM_DRAW_H = 280;
const POLE_W = Math.round(TOTEM_DRAW_H * IMG_W / IMG_H);

let openingspace = 220;
let handSpeed = -3;
let handInterval = null;
let lastSpawnInterval = 2500;

// ── DIFFICULTY ───────────────────────────────────────────────────────────────

const SPEED_START   = -3;
const SPEED_MAX     = -11;
const GAP_START     = 220;
const GAP_MIN       = 140;
const GRAVITY_START = 0.20;
const GRAVITY_MAX   = 0.32;
const SPAWN_START   = 2500;
const SPAWN_MIN     = 1200;

function getDifficulty(s) {
  const t    = Math.min(s / 60, 1);
  const ease = t * t;
  return {
    speed:   SPEED_START   + (SPEED_MAX   - SPEED_START)   * ease,
    gap:     GAP_START     + (GAP_MIN     - GAP_START)     * ease,
    gravity: GRAVITY_START + (GRAVITY_MAX - GRAVITY_START) * ease,
    spawn:   SPAWN_START   + (SPAWN_MIN   - SPAWN_START)   * ease,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

let tophandImg = new Image();
tophandImg.src = "img/pole_down.png";

let bottomhandImg = new Image();
bottomhandImg.src = "img/pole_up.png";

let topHandHalfImg = new Image();
topHandHalfImg.src = "img/pole_down_half.png";

let topHandTopImg = new Image();
topHandTopImg.src = "img/pole_down_top.png";

let botHandHalfImg = new Image();
botHandHalfImg.src = "img/pole_up_half.png";

let botHandTopImg = new Image();
botHandTopImg.src = "img/pole_up_top.png";

function getTopperH(img) {
  if (!img.naturalWidth || !img.naturalHeight) return 150;
  return Math.round(POLE_W * img.naturalHeight / img.naturalWidth);
}

let score = 0;
let highScore = 0;
let gameOver = false;
let gameStarted = false;
let isNewHighScore = false;

window.onload = function () {
  loadSettings();

  playerName = sessionStorage.getItem('playerName') || localStorage.getItem('playerName') || 'Player';
  highScore = parseInt(localStorage.getItem('chaiiwalaBirdHighScore_' + playerName) || 0);

  // Load selected character — fallback to tea if nothing saved
  const selectedCharacter = JSON.parse(sessionStorage.getItem('selectedCharacter'));
  birdImg.src = selectedCharacter?.img || 'img/tea.png';

  board = document.getElementById("board");
  context = board.getContext("2d");
  board.width  = window.innerWidth;
  board.height = window.innerHeight;

  loadStoreImages();

  birdx = board.width / 8;
  birdy = board.height / 2;
  bird  = { x: birdx, y: birdy, width: birdwidth, height: birdheight };

  document.addEventListener("keydown", handleKey);
  document.addEventListener("touchstart", handleTouch);
  window.addEventListener("resize", function () {
    board.width  = window.innerWidth;
    board.height = window.innerHeight;
    if (storesReady) initStoreStrip();
  });

  document.getElementById('replay-btn').addEventListener('click', resetGame);
  document.getElementById('home-btn').addEventListener('click', goHome);

  requestAnimationFrame(update);
};

function update() {
  if (gameOver) {
    const finalScore = Math.floor(score);
    if (finalScore > highScore) {
      highScore = finalScore;
      localStorage.setItem('chaiiwalaBirdHighScore_' + playerName, highScore);
      sessionStorage.setItem('snackyFlapHighScore', highScore);
      isNewHighScore = true;
      submitScore(playerName, highScore);
    }

    document.getElementById('final-score').textContent = finalScore;
    document.getElementById('display-high-score').textContent = highScore;
    document.getElementById('new-high-score').classList.toggle('show', isNewHighScore);
    document.getElementById('game-over-overlay').style.display = 'flex';
    return;
  }

  requestAnimationFrame(update);
  context.clearRect(0, 0, board.width, board.height);

  // Screen shake
  context.save();
  applyShake();

  // Draw background
  const bg = settings.theme === 'light' ? bgImgLight : bgImgDark;
  if (bg.complete && bg.naturalWidth !== 0) {
    context.drawImage(bg, 0, 0, board.width, board.height);
  }

  drawStores();
  

  // Apply difficulty
  const diff = getDifficulty(score);
  handSpeed    = diff.speed;
  openingspace = diff.gap;
  gravity      = diff.gravity;

  const targetSpawn = Math.round(diff.spawn);
  if (gameStarted && Math.abs(targetSpawn - lastSpawnInterval) > 50) {
    clearInterval(handInterval);
    handInterval = setInterval(placehand, targetSpawn);
    lastSpawnInterval = targetSpawn;
  }

  if (gameStarted) {
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
  }

  // ── Bird tilt ──
  const tiltAngle = Math.min(Math.max(velocityY * 3, -25), 70); // degrees
  const rad = tiltAngle * Math.PI / 180;
  const cx = bird.x + bird.width / 2;
  const cy = bird.y + bird.height / 2;
  context.save();
  context.translate(cx, cy);
  context.rotate(rad);
  context.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
  context.restore();

  if (bird.y + bird.height >= board.height) {
    gameOver = true;
    triggerShake(15, 10);
    haptic([50, 30, 50]);
  }

  for (let i = 0; i < handarray.length; i++) {
    const hand = handarray[i];
    hand.x += handSpeed;
    if (hand.isTop) {
      const topperH = Math.min(getTopperH(topHandTopImg), hand.height);
      const shaftH  = hand.height - topperH;
      if (shaftH > 0) {
        context.drawImage(topHandHalfImg, hand.x, hand.y, POLE_W, shaftH);
      }
      context.drawImage(topHandTopImg, hand.x, hand.y + shaftH, POLE_W, topperH);
    } else {
      const topperH = Math.min(getTopperH(botHandTopImg), hand.height);
      const shaftH  = hand.height - topperH;
      context.drawImage(botHandTopImg, hand.x, hand.y, POLE_W, topperH);
      if (shaftH > 0) {
        context.drawImage(botHandHalfImg, hand.x, hand.y + topperH, POLE_W, shaftH);
      }
    }

    if (!hand.passed && hand.x + POLE_W < bird.x) {
      score += 0.5;
      hand.passed = true;
      checkMilestone(score);
    }

    if (detectCollision(bird, hand)) {
      gameOver = true;
      triggerShake(15, 10);
      haptic([50, 30, 50]);
    }
  }

  while (handarray.length > 0 && handarray[0].x < -POLE_W) {
    handarray.shift();
  }

  // HUD
  const isLight = settings.theme === 'light';
  context.fillStyle = isLight ? "#1a1a2e" : "white";
  context.font = "bold 30px MyriadPro";
  context.textAlign = "left";
  context.fillText("Score: " + Math.floor(score), 20, 50);

  context.fillStyle = isLight ? "#b8860b" : "#FFD700";
  context.font = "bold 24px MyriadPro";
  context.textAlign = "right";
  context.fillText("Best: " + highScore, board.width - 20, 45);

  drawMilestone();

  if (!gameStarted) {
    context.fillStyle = "rgba(0, 0, 0, 0.45)";
    context.fillRect(0, 0, board.width, board.height);
    context.fillStyle = "white";
    context.font = "bold 32px MyriadPro";
    context.textAlign = "center";
    context.fillText("TAP TO START", board.width / 2, board.height / 2);
  }

  context.restore(); // restore shake transform
}

function placehand(startX) {
  if (gameOver) return;
  const x = (typeof startX === 'number') ? startX : board.width;

  const minOpeningY = 120;
  const maxOpeningY = board.height - openingspace - 120;
  const openingY = minOpeningY + Math.random() * (maxOpeningY - minOpeningY);

  handarray.push({
    img: tophandImg,
    x, y: 0,
    width: POLE_W, height: openingY,
    isTop: true, passed: false,
  });

  handarray.push({
    img: bottomhandImg,
    x, y: openingY + openingspace,
    width: POLE_W, height: board.height - (openingY + openingspace),
    isTop: false, passed: false,
  });
}

function detectCollision(a, b) {
  const bp = 12, hp = 5;
  return (
    a.x + bp           < b.x + b.width  - hp &&
    a.x + a.width - bp > b.x            + hp &&
    a.y + bp           < b.y + b.height  - hp &&
    a.y + a.height - bp > b.y            + hp
  );
}

async function submitScore(name, score) {
  try {
    await fetch(`${API_BASE}/submit_score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score })
    });
  } catch (err) {
    console.warn('Could not submit score:', err);
  }
}

function resetGame() {
  bird.y = birdy;
  velocityY = 0;
  handarray = [];
  score = 0;
  gameOver = false;
  gameStarted = false;
  isNewHighScore = false;
  handSpeed = SPEED_START;
  openingspace = GAP_START;
  gravity = GRAVITY_START;
  lastSpawnInterval = SPAWN_START;
  shakeFrames = 0;
  shakeMagnitude = 0;
  milestoneMsg = '';
  milestoneTimer = 0;
  clearInterval(handInterval);
  handInterval = null;
  if (storesReady) initStoreStrip();
  document.getElementById('game-over-overlay').style.display = 'none';
  document.getElementById('settings-btn').style.display = '';
  requestAnimationFrame(update);
}

function handleKey(e) {
  if (e.code === "Space") {
    e.preventDefault();
    if (gameOver) { resetGame(); return; }
    if (!gameStarted) {
      gameStarted = true;
      lastSpawnInterval = SPAWN_START;
      placehand(board.width * 0.55);
      placehand(board.width);
      handInterval = setInterval(placehand, SPAWN_START);
      document.getElementById('settings-btn').style.display = 'none';
    }
    velocityY = jump;
  }
  if (e.code === "KeyR") resetGame();
}

function goHome() {
  window.location.href = './';
}

function handleTouch(e) {
  e.preventDefault();
  if (gameOver) return;
  haptic([30]);
  if (!gameStarted) {
    gameStarted = true;
    lastSpawnInterval = SPAWN_START;
    placehand(board.width * 0.55);
    placehand(board.width);
    handInterval = setInterval(placehand, SPAWN_START);
    document.getElementById('settings-btn').style.display = 'none';
  }
  velocityY = jump;
}
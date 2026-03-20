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
let birdx, birdy;
let birdwidth = 60;
let birdheight = 45;
let bird;

let birdImg = new Image();
birdImg.src = "img/burger.png";

let velocityY = 0;
let gravity = 0.2;
let jump = -6;

let handarray = [];
// Width of the pole/totem as drawn on screen
const IMG_W = 308;
const IMG_H = 811;
const TOTEM_DRAW_H = 280;                    // how tall to draw the full image
const POLE_W = Math.round(TOTEM_DRAW_H * IMG_W / IMG_H); // ~106px, keeps aspect ratio
// How tall the totem sign image is drawn (fixed, not stretched)
// TOTEM_H removed — now derived from TOTEM_DRAW_H above
// Width of the thin pole bar drawn behind the totem
const POLE_BAR_W = 0; // no separate bar needed, image has its own pole

let handx;
let handy = 0;
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

let tophandImg = new Image();    // hangs from ceiling  → pole_down
tophandImg.src = "img/pole_down.png";

let bottomhandImg = new Image(); // rises from floor    → pole_up
bottomhandImg.src = "img/pole_up.png";

let score = 0;
let highScore = 0;
let gameOver = false;
let gameStarted = false;
let isNewHighScore = false;

window.onload = function () {
  loadSettings();

  playerName = sessionStorage.getItem('playerName') || localStorage.getItem('playerName') || 'Player';
  highScore = parseInt(localStorage.getItem('chaiiwalaBirdHighScore_' + playerName) || 0);

  const selectedCharacter = JSON.parse(sessionStorage.getItem('selectedCharacter'));
  if (selectedCharacter && selectedCharacter.img) {
    birdImg.src = selectedCharacter.img;
  }

  board = document.getElementById("board");
  context = board.getContext("2d");
  board.width  = window.innerWidth;
  board.height = window.innerHeight;

  birdx = board.width / 8;
  birdy = board.height / 2;
  handx = board.width;
  bird  = { x: birdx, y: birdy, width: birdwidth, height: birdheight };

  document.addEventListener("keydown", handleKey);
  document.addEventListener("touchstart", handleTouch);
  window.addEventListener("resize", function () {
    board.width  = window.innerWidth;
    board.height = window.innerHeight;
  });

  document.getElementById('replay-btn').addEventListener('click', resetGame);
  document.getElementById('home-btn').addEventListener('click', goHome);

  requestAnimationFrame(update);
};

function update() {
  if (gameOver) {
    let finalScore = Math.floor(score);
    if (finalScore > highScore) {
      highScore = finalScore;
      localStorage.setItem('chaiiwalaBirdHighScore_' + playerName, highScore);
      sessionStorage.setItem('snackyFlapHighScore', highScore);
      isNewHighScore = true;
      submitScore(playerName, highScore);
    }

    document.getElementById('final-score').textContent = finalScore;
    document.getElementById('display-high-score').textContent = highScore;

    if (isNewHighScore) {
      document.getElementById('new-high-score').classList.add('show');
    } else {
      document.getElementById('new-high-score').classList.remove('show');
    }

    document.getElementById('game-over-overlay').style.display = 'flex';
    return;
  }

  requestAnimationFrame(update);
  context.clearRect(0, 0, board.width, board.height);

  // ── Apply difficulty every frame ──
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
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  if (bird.y + bird.height >= board.height) {
    gameOver = true;
  }

  for (let i = 0; i < handarray.length; i++) {
    let hand = handarray[i];
    hand.x += handSpeed;
    drawTotem(hand);

    if (!hand.passed && hand.x + POLE_W < bird.x) {
      score += 0.5;
      hand.passed = true;
    }

    if (detectCollision(bird, hand)) {
      gameOver = true;
    }
  }

  while (handarray.length > 0 && handarray[0].x < -POLE_W) {
    handarray.shift();
  }

  // ── HUD ──
  const isLight = settings.theme === 'light';
  context.fillStyle = isLight ? "#1a1a2e" : "white";
  context.font = "bold 30px Arial";
  context.textAlign = "left";
  context.fillText("Score: " + Math.floor(score), 20, 50);

  context.fillStyle = isLight ? "#b8860b" : "#FFD700";
  context.font = "bold 24px Arial";
  context.textAlign = "right";
  context.fillText("Best: " + highScore, board.width - 20, 45);

  if (!gameStarted) {
    context.fillStyle = "rgba(0, 0, 0, 0.45)";
    context.fillRect(0, 0, board.width, board.height);
    context.fillStyle = "white";
    context.font = "bold 32px Arial";
    context.textAlign = "center";
    context.fillText("TAP TO START", board.width / 2, board.height / 2);
  }
}

// Draw a totem properly: thin pole bar + fixed-size sign image at the gap edge
function drawTotem(hand) {
  // Stretch image to fill entire pipe height, same as original rolls
  // pole_up  (bottom): top of image = gap edge, stretches down to screen bottom
  // pole_down (top):   bottom of image = gap edge, stretches up to screen top
  const drawW = POLE_W;

  if (hand.isTop) {
    context.drawImage(hand.img, hand.x, hand.y, drawW, hand.height);
  } else {
    context.drawImage(hand.img, hand.x, hand.y, drawW, hand.height);
  }
}

function placehand() {
  if (gameOver) return;

  let minOpeningY = 120;
  let maxOpeningY = board.height - openingspace - 120;
  let openingY = minOpeningY + Math.random() * (maxOpeningY - minOpeningY);

  // Top pipe — hangs from ceiling, gap edge at openingY
  handarray.push({
    img: tophandImg,
    x: board.width,
    y: 0,
    width: POLE_W,
    height: openingY,
    isTop: true,
    passed: false,
  });

  // Bottom pipe — rises from floor, gap edge at openingY + openingspace
  handarray.push({
    img: bottomhandImg,
    x: board.width,
    y: openingY + openingspace,
    width: POLE_W,
    height: board.height - (openingY + openingspace),
    isTop: false,
    passed: false,
  });
}

function detectCollision(a, b) {
  let birdPadding = 12;
  let handPadding = 5;
  return (
    a.x + birdPadding         < b.x + b.width  - handPadding &&
    a.x + a.width - birdPadding > b.x           + handPadding &&
    a.y + birdPadding         < b.y + b.height  - handPadding &&
    a.y + a.height - birdPadding > b.y           + handPadding
  );
}

async function submitScore(name, score) {
  try {
    await fetch(`${API_BASE}/submit-score`, {
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
  clearInterval(handInterval);
  handInterval = null;
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
  if (!gameStarted) {
    gameStarted = true;
    lastSpawnInterval = SPAWN_START;
    handInterval = setInterval(placehand, SPAWN_START);
    document.getElementById('settings-btn').style.display = 'none';
  }
  velocityY = jump;
}
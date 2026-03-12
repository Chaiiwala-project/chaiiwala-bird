
let settings = {
  theme: 'dark',
  musicEnabled: true,
  sfxEnabled: true
};
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
    if (gameOverBg) {
      gameOverBg.src = 'img/game_over_light.png';
    }
  } else {
    document.body.classList.remove('light-theme');
    document.getElementById('theme-toggle').checked = false;
    
    const gameOverBg = document.getElementById('game-over-bg');
    if (gameOverBg) {
      gameOverBg.src = 'img/game_over_dark.png';
    }
  }
}


function saveSettings() {
  localStorage.setItem('chaiiwalaBirdSettings', JSON.stringify(settings));
  sessionStorage.setItem('gameSettings', JSON.stringify(settings));
}

function toggleSettings() {
  const panel = document.getElementById('settings-panel');
  panel.classList.toggle('active');
}

// Toggle theme
function toggleTheme() {
  settings.theme = document.getElementById('theme-toggle').checked ? 'light' : 'dark';
  applyTheme();
  saveSettings();
}




let board;
let context;
let birdx;
let birdy;
let birdwidth = 60;
let birdheight = 45;
let bird;

let birdImg = new Image();
birdImg.src = "img/burger.png";

let velocityY = 0;
let gravity = 0.2;
let jump = -6;

let handarray = [];
let handwidth = 80;
let handx;
let handy = 0;
let openingspace = 220;

let handSpeed = -3;
let handInterval;

let tophandImg = new Image();
tophandImg.src = "img/top_roll.png";

let bottomhandImg = new Image();
bottomhandImg.src = "img/bottom_roll.png";

let score = 0;
let highScore = 0;
let gameOver = false;
let gameStarted = false;
let isNewHighScore = false;




window.onload = function () {

  loadSettings();
  
  highScore = sessionStorage.getItem('snackyFlapHighScore') || 0;
  highScore = parseInt(highScore);

  const selectedCharacter = JSON.parse(sessionStorage.getItem('selectedCharacter'));
  if (selectedCharacter && selectedCharacter.img) {
    birdImg.src = selectedCharacter.img;
  }

  board = document.getElementById("board");
  context = board.getContext("2d");
  board.width = window.innerWidth;
  board.height = window.innerHeight;

  birdx = board.width / 8;
  birdy = board.height / 2;
  handx = board.width;
  bird = { x: birdx, y: birdy, width: birdwidth, height: birdheight };

  document.addEventListener("keydown", handleKey);
  document.addEventListener("touchstart", handleTouch);
  window.addEventListener("resize", function () {
    board.width = window.innerWidth;
    board.height = window.innerHeight;
  });

  document.getElementById('replay-btn').addEventListener('click', resetGame);

  requestAnimationFrame(update);
};

function update() {
  if (gameOver) {
    let finalScore = Math.floor(score);
    if (finalScore > highScore) {
      highScore = finalScore;
      sessionStorage.setItem('snackyFlapHighScore', highScore);
      isNewHighScore = true;
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

  handSpeed = Math.max(-8, -3 - Math.floor(score / 5) * 0.4);

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
    context.drawImage(hand.img, hand.x, hand.y, hand.width, hand.height);

    if (!hand.passed && hand.x + hand.width < bird.x) {
      score += 0.5;
      


      hand.passed = true;
    }

    if (detectCollision(bird, hand)) {
      gameOver = true;
    }
  }

  while (handarray.length > 0 && handarray[0].x < -handwidth) {
    handarray.shift();
  }

  context.fillStyle = "white";
  context.font = "bold 30px Arial";
  context.textAlign = "left";
  context.fillText("Score: " + Math.floor(score), 20, 50);
  
  context.fillStyle = "#FFD700";
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

function placehand() {
  if (gameOver) return;

  let minOpeningY = 120;
  let maxOpeningY = board.height - openingspace - 120;
  let openingY = minOpeningY + Math.random() * (maxOpeningY - minOpeningY);

  let tophand = {
    img: tophandImg,
    x: board.width,
    y: 0,
    width: handwidth,
    height: openingY,
    passed: false,
  };
  handarray.push(tophand);

  let bottomhand = {
    img: bottomhandImg,
    x: board.width,
    y: openingY + openingspace,
    width: handwidth,
    height: board.height - (openingY + openingspace),
    passed: false,
  };
  handarray.push(bottomhand);
}

function detectCollision(a, b) {
  let birdPadding = 12;
  let handPadding = 5;

  return (
    a.x + birdPadding < b.x + b.width - handPadding &&
    a.x + a.width - birdPadding > b.x + handPadding &&
    a.y + birdPadding < b.y + b.height - handPadding &&
    a.y + a.height - birdPadding > b.y + handPadding
  );
}

function resetGame() {
  bird.y = birdy;
  velocityY = 0;
  handarray = [];
  score = 0;
  gameOver = false;
  gameStarted = false;
  isNewHighScore = false;
  handSpeed = -3;
  clearInterval(handInterval);
  document.getElementById('game-over-overlay').style.display = 'none';
  



  requestAnimationFrame(update);
}

function handleKey(e) {
  if (e.code === "Space") {
    e.preventDefault();
    if (gameOver) {
      resetGame();
      return;
    }
    if (!gameStarted) {
      gameStarted = true;
      handInterval = setInterval(placehand, 2500);
      
    }
    velocityY = jump;
    


  }
  if (e.code === "KeyR") {
    resetGame();
  }
}

function handleTouch(e) {
  e.preventDefault();
  
  if (gameOver) {
    return;
  }
  
  if (!gameStarted) {
    gameStarted = true;
    handInterval = setInterval(placehand, 2500);
  }
  velocityY = jump;
  


}
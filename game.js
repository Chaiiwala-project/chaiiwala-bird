// Bird
let board;
let context;
let birdx;
let birdy;
let birdwidth = 60;
let birdheight = 45;
let bird;

let birdImg = new Image();
birdImg.src = "img/burger.png";

// Physics
let velocityY = 0;
let gravity = 0.2;
let jump = -6;

// Hands (pipes)
let handarray = [];
let handwidth = 80;
let handx;
let handy = 0;
let openingspace = 220; // gap size - not too small

// Speed
let handSpeed = -3;
let handInterval;

let tophandImg = new Image();
tophandImg.src = "img/top_roll.png";

let bottomhandImg = new Image();
bottomhandImg.src = "img/bottom_roll.png";

// Game state
let score = 0;
let highScore = 0;
let gameOver = false;
let gameStarted = false;
let isNewHighScore = false;

window.onload = function () {
  // Load high score from localStorage
  highScore = localStorage.getItem('snackyFlapHighScore') || 0;
  highScore = parseInt(highScore);

  // Load selected character from start screen
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

  requestAnimationFrame(update);
};

function update() {
  if (gameOver) {
    // Check if new high score and save it
    let finalScore = Math.floor(score);
    if (finalScore > highScore) {
      highScore = finalScore;
      localStorage.setItem('snackyFlapHighScore', highScore);
      isNewHighScore = true;
    }

    // Dark overlay
    context.fillStyle = "rgba(0, 0, 0, 0.6)";
    context.fillRect(0, 0, board.width, board.height);

    // Game Over Modal
    let modalWidth = Math.min(450, board.width * 0.85);
    let modalHeight = 320;
    let modalX = (board.width - modalWidth) / 2;
    let modalY = (board.height - modalHeight) / 2;

    // Modal background with rounded corners effect
    context.fillStyle = "white";
    context.shadowColor = "rgba(0, 0, 0, 0.3)";
    context.shadowBlur = 20;
    context.fillRect(modalX, modalY, modalWidth, modalHeight);
    context.shadowBlur = 0;

    // Game Over Title
    context.fillStyle = "#333";
    context.font = "bold 42px Arial";
    context.textAlign = "center";
    context.fillText("GAME OVER", board.width / 2, modalY + 60);

    // New High Score badge
    if (isNewHighScore) {
      context.fillStyle = "#FFD700";
      context.font = "bold 22px Arial";
      context.fillText("🎉 NEW HIGH SCORE! 🎉", board.width / 2, modalY + 100);
    }

    // Scores
    context.fillStyle = "#666";
    context.font = "24px Arial";
    context.fillText("Score: " + finalScore, board.width / 2, modalY + (isNewHighScore ? 145 : 125));
    
    context.fillStyle = "#FFD700";
    context.font = "bold 24px Arial";
    context.fillText("Best: " + highScore, board.width / 2, modalY + (isNewHighScore ? 180 : 160));

    // Replay Button
    let buttonWidth = 180;
    let buttonHeight = 55;
    let buttonX = (board.width - buttonWidth) / 2;
    let buttonY = modalY + modalHeight - 85;

    // Button shadow
    context.fillStyle = "rgba(0, 0, 0, 0.15)";
    context.fillRect(buttonX + 2, buttonY + 2, buttonWidth, buttonHeight);

    // Button
    context.fillStyle = "#4CAF50";
    context.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    // Button text
    context.fillStyle = "white";
    context.font = "bold 26px Arial";
    context.fillText("REPLAY", board.width / 2, buttonY + 36);

    return;
  }

  requestAnimationFrame(update);
  context.clearRect(0, 0, board.width, board.height);

  // Gradually increase speed every 5 points (max speed cap)
  handSpeed = Math.max(-8, -3 - Math.floor(score / 5) * 0.4);

  // Bird - only apply physics if game has started
  if (gameStarted) {
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
  }
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  if (bird.y + bird.height >= board.height) {
    gameOver = true;
  }

  // Hands
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

  // Remove off-screen hands
  while (handarray.length > 0 && handarray[0].x < -handwidth) {
    handarray.shift();
  }

  // Score display
  context.fillStyle = "white";
  context.font = "bold 30px Arial";
  context.textAlign = "left";
  context.fillText("Score: " + Math.floor(score), 20, 50);
  
  // High score display (top right)
  context.fillStyle = "#FFD700";
  context.font = "bold 24px Arial";
  context.textAlign = "right";
  context.fillText("Best: " + highScore, board.width - 20, 45);

  // Wait to start message
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

  // TOP HAND - from top down to gap
  let tophand = {
    img: tophandImg,
    x: board.width,
    y: 0,
    width: handwidth,
    height: openingY,
    passed: false,
  };
  handarray.push(tophand);

  // BOTTOM HAND - from gap to bottom
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
  
  // Handle replay button click on game over
  if (gameOver) {
    let touches = e.touches || [e];
    let rect = board.getBoundingClientRect();
    let touchX = touches[0].clientX - rect.left;
    let touchY = touches[0].clientY - rect.top;

    // Check if tap is on replay button
    let modalWidth = Math.min(450, board.width * 0.85);
    let modalHeight = 320;
    let modalY = (board.height - modalHeight) / 2;
    let buttonWidth = 180;
    let buttonHeight = 55;
    let buttonX = (board.width - buttonWidth) / 2;
    let buttonY = modalY + modalHeight - 85;

    if (touchX >= buttonX && touchX <= buttonX + buttonWidth &&
        touchY >= buttonY && touchY <= buttonY + buttonHeight) {
      resetGame();
      return;
    }
    return;
  }
  
  if (!gameStarted) {
    gameStarted = true;
    handInterval = setInterval(placehand, 2500);
  }
  velocityY = jump;
}
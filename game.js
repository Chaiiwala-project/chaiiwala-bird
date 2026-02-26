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
let gameOver = false;
let gameStarted = false;

window.onload = function () {
  // Load selected character from start screen
  const selectedCharacter = JSON.parse(sessionStorage.getItem('selectedCharacter'));
  if (selectedCharacter && selectedCharacter.Image) {
    birdImg.src = selectedCharacter.Image;
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
    context.fillStyle = "rgba(0, 0, 0, 0.55)";
    context.fillRect(0, 0, board.width, board.height);

    context.fillStyle = "white";
    context.font = "bold 48px Arial";
    context.textAlign = "center";
    context.fillText("GAME OVER", board.width / 2, board.height / 2 - 40);
    context.font = "24px Arial";
    context.fillText("Score: " + Math.floor(score), board.width / 2, board.height / 2 + 20);
    context.fillText("Tap or press SPACE to restart", board.width / 2, board.height / 2 + 65);
    return;
  }

  requestAnimationFrame(update);
  context.clearRect(0, 0, board.width, board.height);

  // Gradually increase speed every 5 points (max speed cap)
  handSpeed = Math.max(-8, -3 - Math.floor(score / 5) * 0.4);

  // Bird
  velocityY += gravity;
  bird.y = Math.max(bird.y + velocityY, 0);
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

  // Score
  context.fillStyle = "white";
  context.font = "bold 30px Arial";
  context.textAlign = "left";
  context.fillText("Score: " + Math.floor(score), 20, 50);

  // Wait to start message
  if (!gameStarted) {
    context.fillStyle = "rgba(0, 0, 0, 0.45)";
    context.fillRect(0, 0, board.width, board.height);

    context.fillStyle = "white";
    context.font = "bold 28px Arial";
    context.textAlign = "center";
    context.fillText("Tap or press SPACE to Start", board.width / 2, board.height / 2);
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
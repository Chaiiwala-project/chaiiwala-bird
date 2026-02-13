// Game Configuration
const CONFIG = {
    gravity: 0.5,
    jumpStrength: -10,
    pipeSpeed: 3,
    pipeGap: 150,
    pipeSpawnInterval: 90,
    birdSize: 30,
    pipeWidth: 60
};

// Game State
const gameState = {
    canvas: null,
    ctx: null,
    bird: null,
    pipes: [],
    score: 0,
    highScore: 0,
    isPlaying: false,
    frameCount: 0,
    gameLoop: null
};

// DOM Elements
const elements = {
    canvas: null,
    menu: null,
    gameOver: null,
    hud: null,
    startBtn: null,
    restartBtn: null,
    menuBtn: null,
    fullscreenBtn: null,
    score: null,
    finalScore: null,
    highScore: null,
    gameOverHighScore: null
};

// Initialize the game
function init() {
    // Get DOM elements
    elements.canvas = document.getElementById('gameCanvas');
    elements.menu = document.getElementById('menu');
    elements.gameOver = document.getElementById('gameOver');
    elements.hud = document.getElementById('hud');
    elements.startBtn = document.getElementById('startBtn');
    elements.restartBtn = document.getElementById('restartBtn');
    elements.menuBtn = document.getElementById('menuBtn');
    elements.fullscreenBtn = document.getElementById('fullscreenBtn');
    elements.score = document.getElementById('score');
    elements.finalScore = document.getElementById('finalScore');
    elements.highScore = document.getElementById('highScore');
    elements.gameOverHighScore = document.getElementById('gameOverHighScore');

    gameState.canvas = elements.canvas;
    gameState.ctx = elements.canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('flappyBirdHighScore');
    if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore);
        elements.highScore.textContent = gameState.highScore;
    }

    // Event listeners
    elements.startBtn.addEventListener('click', startGame);
    elements.restartBtn.addEventListener('click', startGame);
    elements.menuBtn.addEventListener('click', showMenu);
    elements.fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Game controls - tap/click/space to jump
    elements.canvas.addEventListener('click', jump);
    elements.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        jump();
    });
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameState.isPlaying) {
            e.preventDefault();
            jump();
        }
    });
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    const maxWidth = 480;
    const maxHeight = 640;
    const aspectRatio = maxWidth / maxHeight;

    let width = Math.min(container.clientWidth, maxWidth);
    let height = width / aspectRatio;

    if (height > container.clientHeight) {
        height = container.clientHeight;
        width = height * aspectRatio;
    }

    elements.canvas.width = width;
    elements.canvas.height = height;
}

function startGame() {
    // Reset game state
    gameState.bird = {
        x: elements.canvas.width * 0.2,
        y: elements.canvas.height / 2,
        velocity: 0,
        rotation: 0
    };
    gameState.pipes = [];
    gameState.score = 0;
    gameState.frameCount = 0;
    gameState.isPlaying = true;

    // Update UI
    elements.menu.classList.add('hidden');
    elements.gameOver.classList.add('hidden');
    elements.hud.classList.remove('hidden');
    elements.score.textContent = '0';

    // Start game loop
    if (gameState.gameLoop) {
        cancelAnimationFrame(gameState.gameLoop);
    }
    gameLoop();
}

function showMenu() {
    gameState.isPlaying = false;
    if (gameState.gameLoop) {
        cancelAnimationFrame(gameState.gameLoop);
    }
    elements.gameOver.classList.add('hidden');
    elements.hud.classList.add('hidden');
    elements.menu.classList.remove('hidden');
}

function gameOver() {
    gameState.isPlaying = false;
    elements.hud.classList.add('hidden');
    elements.gameOver.classList.remove('hidden');
    elements.finalScore.textContent = gameState.score;

    // Update high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('flappyBirdHighScore', gameState.highScore);
        elements.highScore.textContent = gameState.highScore;
    }
    elements.gameOverHighScore.textContent = gameState.highScore;
}

function jump() {
    if (gameState.isPlaying && gameState.bird) {
        gameState.bird.velocity = CONFIG.jumpStrength;
    }
}

function toggleFullscreen() {
    const elem = document.documentElement;
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
        // Enter fullscreen
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function updateBird() {
    if (!gameState.bird) return;

    // Apply gravity
    gameState.bird.velocity += CONFIG.gravity;
    gameState.bird.y += gameState.bird.velocity;

    // Update rotation based on velocity
    gameState.bird.rotation = Math.min(Math.max(gameState.bird.velocity * 3, -30), 90);

    // Check ground collision
    if (gameState.bird.y + CONFIG.birdSize > elements.canvas.height) {
        gameOver();
    }

    // Check ceiling collision
    if (gameState.bird.y < 0) {
        gameState.bird.y = 0;
        gameState.bird.velocity = 0;
    }
}

function updatePipes() {
    // Spawn new pipes
    gameState.frameCount++;
    if (gameState.frameCount % CONFIG.pipeSpawnInterval === 0) {
        const gapY = Math.random() * (elements.canvas.height - CONFIG.pipeGap - 100) + 50;
        gameState.pipes.push({
            x: elements.canvas.width,
            gapY: gapY,
            scored: false
        });
    }

    // Move and check pipes
    for (let i = gameState.pipes.length - 1; i >= 0; i--) {
        const pipe = gameState.pipes[i];
        pipe.x -= CONFIG.pipeSpeed;

        // Check if bird passed pipe
        if (!pipe.scored && pipe.x + CONFIG.pipeWidth < gameState.bird.x) {
            pipe.scored = true;
            gameState.score++;
            elements.score.textContent = gameState.score;
        }

        // Check collision
        if (checkCollision(pipe)) {
            gameOver();
        }

        // Remove off-screen pipes
        if (pipe.x + CONFIG.pipeWidth < 0) {
            gameState.pipes.splice(i, 1);
        }
    }
}

function checkCollision(pipe) {
    const birdLeft = gameState.bird.x;
    const birdRight = gameState.bird.x + CONFIG.birdSize;
    const birdTop = gameState.bird.y;
    const birdBottom = gameState.bird.y + CONFIG.birdSize;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + CONFIG.pipeWidth;
    const topPipeBottom = pipe.gapY;
    const bottomPipeTop = pipe.gapY + CONFIG.pipeGap;

    // Check if bird is within pipe's x range
    if (birdRight > pipeLeft && birdLeft < pipeRight) {
        // Check if bird hit top or bottom pipe
        if (birdTop < topPipeBottom || birdBottom > bottomPipeTop) {
            return true;
        }
    }
    return false;
}

function drawBird() {
    if (!gameState.bird) return;

    const ctx = gameState.ctx;
    ctx.save();
    ctx.translate(gameState.bird.x + CONFIG.birdSize / 2, gameState.bird.y + CONFIG.birdSize / 2);
    ctx.rotate((gameState.bird.rotation * Math.PI) / 180);

    // Draw bird body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.birdSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw bird eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(CONFIG.birdSize / 4, -CONFIG.birdSize / 6, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw bird beak
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.moveTo(CONFIG.birdSize / 2, 0);
    ctx.lineTo(CONFIG.birdSize / 2 + 10, -3);
    ctx.lineTo(CONFIG.birdSize / 2 + 10, 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawPipes() {
    const ctx = gameState.ctx;
    
    gameState.pipes.forEach(pipe => {
        // Top pipe
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(pipe.x, 0, CONFIG.pipeWidth, pipe.gapY);
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 3;
        ctx.strokeRect(pipe.x, 0, CONFIG.pipeWidth, pipe.gapY);

        // Top pipe cap
        ctx.fillStyle = '#66BB6A';
        ctx.fillRect(pipe.x - 5, pipe.gapY - 20, CONFIG.pipeWidth + 10, 20);
        ctx.strokeRect(pipe.x - 5, pipe.gapY - 20, CONFIG.pipeWidth + 10, 20);

        // Bottom pipe
        const bottomPipeY = pipe.gapY + CONFIG.pipeGap;
        const bottomPipeHeight = elements.canvas.height - bottomPipeY;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(pipe.x, bottomPipeY, CONFIG.pipeWidth, bottomPipeHeight);
        ctx.strokeRect(pipe.x, bottomPipeY, CONFIG.pipeWidth, bottomPipeHeight);

        // Bottom pipe cap
        ctx.fillStyle = '#66BB6A';
        ctx.fillRect(pipe.x - 5, bottomPipeY, CONFIG.pipeWidth + 10, 20);
        ctx.strokeRect(pipe.x - 5, bottomPipeY, CONFIG.pipeWidth + 10, 20);
    });
}

function drawBackground() {
    const ctx = gameState.ctx;
    
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, elements.canvas.height * 0.7);
    skyGradient.addColorStop(0, '#4EC0CA');
    skyGradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height * 0.7);

    // Ground
    const groundGradient = ctx.createLinearGradient(0, elements.canvas.height * 0.7, 0, elements.canvas.height);
    groundGradient.addColorStop(0, '#DED895');
    groundGradient.addColorStop(1, '#C4B86A');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, elements.canvas.height * 0.7, elements.canvas.width, elements.canvas.height * 0.3);

    // Ground line
    ctx.strokeStyle = '#8B7D3A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, elements.canvas.height * 0.7);
    ctx.lineTo(elements.canvas.width, elements.canvas.height * 0.7);
    ctx.stroke();
}

function draw() {
    drawBackground();
    drawPipes();
    drawBird();
}

function gameLoop() {
    if (!gameState.isPlaying) return;

    updateBird();
    updatePipes();
    draw();

    gameState.gameLoop = requestAnimationFrame(gameLoop);
}

// Initialize game when page loads
window.addEventListener('load', init);

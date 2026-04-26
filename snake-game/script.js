const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Game Constants
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE; // 400 / 20 = 20
const GAME_SPEED = 120; // ms per frame

// Colors (matching CSS variables)
const PRIMARY_COLOR = '#00f0ff';
const SECONDARY_COLOR = '#ff003c';
const GRID_COLOR = 'rgba(255, 255, 255, 0.03)';
const HEAD_COLOR = '#ffffff';

// Game State
let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let lastRenderTime = 0;
let gameOver = false;
let gameStarted = false;
let nextDx = 0;
let nextDy = 0;

highScoreElement.textContent = highScore;

function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    dx = 0;
    dy = -1; // Moving up initially
    nextDx = 0;
    nextDy = -1;
    score = 0;
    scoreElement.textContent = score;
    gameOver = false;
    placeFood();
}

function placeFood() {
    food = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
    };
    // Ensure food doesn't spawn on snake
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            return placeFood();
        }
    }
}

function main(currentTime) {
    if (gameOver) {
        handleGameOver();
        return;
    }

    if (!gameStarted) return;

    window.requestAnimationFrame(main);

    const secondsSinceLastRender = (currentTime - lastRenderTime);
    if (secondsSinceLastRender < GAME_SPEED) return;

    lastRenderTime = currentTime;

    update();
    draw();
}

function update() {
    // Prevent 180-degree turns
    dx = nextDx;
    dy = nextDy;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall Collision
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver = true;
        return;
    }

    // Self Collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver = true;
            return;
        }
    }

    snake.unshift(head);

    // Food Consumption
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        placeFood();
    } else {
        snake.pop();
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }

    // Draw Food with glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = SECONDARY_COLOR;
    ctx.fillStyle = SECONDARY_COLOR;
    
    // Pulse effect for food
    const pulse = Math.sin(Date.now() / 200) * 2;
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE/2, 
        food.y * GRID_SIZE + GRID_SIZE/2, 
        GRID_SIZE/2 - 2 + pulse, 
        0, 
        Math.PI * 2
    );
    ctx.fill();

    // Draw Snake
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        
        ctx.shadowBlur = isHead ? 20 : 10;
        ctx.shadowColor = PRIMARY_COLOR;
        ctx.fillStyle = isHead ? HEAD_COLOR : PRIMARY_COLOR;

        // Draw segmented body slightly smaller than grid size
        const margin = 1;
        ctx.fillRect(
            segment.x * GRID_SIZE + margin, 
            segment.y * GRID_SIZE + margin, 
            GRID_SIZE - margin * 2, 
            GRID_SIZE - margin * 2
        );
    });

    // Reset shadow for next frame
    ctx.shadowBlur = 0;
}

function handleGameOver() {
    gameStarted = false;
    finalScoreElement.textContent = score;
    gameOverScreen.classList.add('active');
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
}

function startGame() {
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    initGame();
    gameStarted = true;
    window.requestAnimationFrame(main);
}

// Input Handling
window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (dy !== 1) { nextDx = 0; nextDy = -1; }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (dy !== -1) { nextDx = 0; nextDy = 1; }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (dx !== 1) { nextDx = -1; nextDy = 0; }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (dx !== -1) { nextDx = 1; nextDy = 0; }
            break;
    }
});

// Mobile Controls Handling
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

const handleTouch = (newDx, newDy, restrictDx, restrictDy) => {
    if (dx !== restrictDx || dy !== restrictDy) {
        nextDx = newDx;
        nextDy = newDy;
    }
};

btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); handleTouch(0, -1, 0, 1); });
btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); handleTouch(0, 1, 0, -1); });
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); handleTouch(-1, 0, 1, 0); });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); handleTouch(1, 0, -1, 0); });

// Mouse fallbacks for testing mobile controls on desktop
btnUp.addEventListener('mousedown', () => handleTouch(0, -1, 0, 1));
btnDown.addEventListener('mousedown', () => handleTouch(0, 1, 0, -1));
btnLeft.addEventListener('mousedown', () => handleTouch(-1, 0, 1, 0));
btnRight.addEventListener('mousedown', () => handleTouch(1, 0, -1, 0));


startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initial draw (draw grid and nothing else)
draw();

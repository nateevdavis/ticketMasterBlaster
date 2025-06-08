// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;
const PROJECTILE_WIDTH = 5;
const PROJECTILE_HEIGHT = 15;
const ENEMY_ROWS = 4;
const ENEMIES_PER_ROW = 8;
const ENEMY_SPACING = 60;
const ENEMY_MOVE_DOWN = 20;

// Game state
let canvas, ctx;
let player = {
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - 10,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: 5
};
let projectiles = [];
let enemies = [];
let score = 0;
let gameOver = false;
let gameStarted = false;
let keys = {};
let isMobile = false;

// Sprite images
let playerSprite;
let enemySprite;
let projectileSprite;
let spritesLoaded = false;

// Load sprites
function loadSprites() {
    return new Promise((resolve, reject) => {
        let loadedImages = 0;
        const totalImages = 3;

        function imageLoaded() {
            loadedImages++;
            if (loadedImages === totalImages) {
                spritesLoaded = true;
                resolve();
            }
        }

        // Load player sprite (guitar)
        playerSprite = new Image();
        playerSprite.onload = imageLoaded;
        playerSprite.onerror = () => {
            console.error('Failed to load player sprite');
            // Fallback to rectangle if image fails to load
            playerSprite = null;
            imageLoaded();
        };
        playerSprite.src = 'sprites/guitar.png';

        // Load enemy sprite (Ticketmaster parody)
        enemySprite = new Image();
        enemySprite.onload = imageLoaded;
        enemySprite.onerror = () => {
            console.error('Failed to load enemy sprite');
            enemySprite = null;
            imageLoaded();
        };
        enemySprite.src = 'sprites/enemy.png';

        // Load projectile sprite (fireball)
        projectileSprite = new Image();
        projectileSprite.onload = imageLoaded;
        projectileSprite.onerror = () => {
            console.error('Failed to load projectile sprite');
            projectileSprite = null;
            imageLoaded();
        };
        projectileSprite.src = 'sprites/fireball.png';
    });
}

// Initialize game
async function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Load sprites before starting
    await loadSprites();

    // Check if mobile
    isMobile = window.innerWidth <= 800;
    if (isMobile) {
        document.getElementById('mobileControls').classList.remove('hidden');
        setupMobileControls();
    }

    // Event listeners
    window.addEventListener('keydown', (e) => keys[e.key] = true);
    window.addEventListener('keyup', (e) => keys[e.key] = false);
    window.addEventListener('keydown', handleKeyPress);
    
    // Button listeners
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('playAgainButton').addEventListener('click', resetGame);

    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Setup mobile controls
function setupMobileControls() {
    const canvas = document.getElementById('gameCanvas');
    const shootButton = document.getElementById('shootButton');

    // Touch controls for movement
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    // Shoot button
    shootButton.addEventListener('click', shoot);
}

// Handle touch events for movement
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const touchX = touch.clientX;
    const canvasRect = canvas.getBoundingClientRect();
    const relativeX = touchX - canvasRect.left;
    
    if (relativeX < canvasRect.width / 2) {
        keys['ArrowLeft'] = true;
    } else {
        keys['ArrowRight'] = true;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const touchX = touch.clientX;
    const canvasRect = canvas.getBoundingClientRect();
    const relativeX = touchX - canvasRect.left;
    
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
    
    if (relativeX < canvasRect.width / 2) {
        keys['ArrowLeft'] = true;
    } else {
        keys['ArrowRight'] = true;
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
}

// Start the game
function startGame() {
    gameStarted = true;
    document.getElementById('startScreen').classList.add('hidden');
    createEnemies();
}

// Create enemy grid
function createEnemies() {
    enemies = [];
    for (let row = 0; row < ENEMY_ROWS; row++) {
        for (let col = 0; col < ENEMIES_PER_ROW; col++) {
            enemies.push({
                x: col * ENEMY_SPACING + 50,
                y: row * ENEMY_SPACING + 50,
                width: ENEMY_WIDTH,
                height: ENEMY_HEIGHT,
                direction: 1
            });
        }
    }
}

// Handle key press events
function handleKeyPress(e) {
    if (e.code === 'Space' && gameStarted && !gameOver) {
        shoot();
    }
}

// Player shooting
function shoot() {
    if (!gameStarted || gameOver) return;
    
    projectiles.push({
        x: player.x + player.width / 2 - PROJECTILE_WIDTH / 2,
        y: player.y,
        width: PROJECTILE_WIDTH,
        height: PROJECTILE_HEIGHT,
        speed: 7
    });
}

// Reset game state
function resetGame() {
    score = 0;
    gameOver = false;
    projectiles = [];
    createEnemies();
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('score').textContent = `Score: ${score}`;
}

// Update game state
function update() {
    if (!gameStarted || gameOver) return;

    // Player movement
    if (keys['ArrowLeft'] || keys['a']) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.x = Math.min(CANVAS_WIDTH - player.width, player.x + player.speed);
    }

    // Update projectiles
    projectiles = projectiles.filter(projectile => {
        projectile.y -= projectile.speed;
        return projectile.y > 0;
    });

    // Update enemies
    let shouldMoveDown = false;
    enemies.forEach(enemy => {
        if (enemy.x <= 0 || enemy.x + enemy.width >= CANVAS_WIDTH) {
            shouldMoveDown = true;
        }
    });

    if (shouldMoveDown) {
        enemies.forEach(enemy => {
            enemy.direction *= -1;
            enemy.y += ENEMY_MOVE_DOWN;
        });
    }

    enemies.forEach(enemy => {
        enemy.x += enemy.direction * 2;
    });

    // Check collisions
    projectiles.forEach((projectile, pIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (checkCollision(projectile, enemy)) {
                projectiles.splice(pIndex, 1);
                enemies.splice(eIndex, 1);
                score += 10;
                document.getElementById('score').textContent = `Score: ${score}`;
            }
        });
    });

    // Check if enemies reached bottom
    enemies.forEach(enemy => {
        if (enemy.y + enemy.height >= player.y) {
            endGame();
        }
    });

    // Check if all enemies are destroyed
    if (enemies.length === 0) {
        createEnemies();
    }
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// End game
function endGame() {
    gameOver = true;
    document.getElementById('gameOver').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
}

// Draw game objects
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!gameStarted) return;

    // Draw player
    if (playerSprite) {
        ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
    } else {
        // Fallback to rectangle if sprite failed to load
        ctx.fillStyle = '#0f0';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Draw projectiles
    projectiles.forEach(projectile => {
        if (projectileSprite) {
            ctx.drawImage(projectileSprite, projectile.x, projectile.y, projectile.width, projectile.height);
        } else {
            // Fallback to rectangle if sprite failed to load
            ctx.fillStyle = '#f00';
            ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
        }
    });

    // Draw enemies
    enemies.forEach(enemy => {
        if (enemySprite) {
            ctx.drawImage(enemySprite, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            // Fallback to rectangle if sprite failed to load
            ctx.fillStyle = '#00f';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
init(); 
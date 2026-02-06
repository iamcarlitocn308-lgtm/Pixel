/**
 * 2D Platformer Game
 * Pure JavaScript implementation using Canvas API
 * No libraries or frameworks used
 */

// Game constants
const GAME = {
    BACKGROUND_COLOR: '#1e3a8a', // Blue background as requested
    TARGET_FPS: 60, // Target frames per second
    MS_PER_UPDATE: 1000 / 60, // Target time per frame in milliseconds
    DEBUG_MODE: true, // Set to true to show debug info
    PLAYER_SPEED: 300, // Pixels per second
    PLAYER_FRICTION: 0.85, // Friction coefficient (0-1)
    GRAVITY: 900, // Pixels per second squared
    JUMP_FORCE: -400, // Negative because up is negative Y
    CAMERA_SMOOTHNESS: 0.1 // Higher = more smoothing, 0-1
};

// Camera object
const camera = {
    x: 0,
    y: 0,
    width: 800, // Will be set to canvas width
    height: 600, // Will be set to canvas height
    targetX: 0, // Target position to follow
    targetY: 0
};

// Player object
const player = {
    x: 100,
    y: 300,
    width: 40,
    height: 40,
    color: '#ef4444', // Red color
    velocityX: 0,
    velocityY: 0,
    maxSpeed: 8,
    isOnGround: false,
    canJump: true,
    jumpCooldown: 0
};

// Platforms array
const platforms = [
    // Format: {x, y, width, height, color}
    { x: 50, y: 450, width: 200, height: 20, color: '#10b981' },
    { x: 300, y: 350, width: 150, height: 20, color: '#3b82f6' },
    { x: 500, y: 250, width: 180, height: 20, color: '#8b5cf6' },
    { x: 200, y: 150, width: 120, height: 20, color: '#f59e0b' },
    { x: 600, y: 400, width: 100, height: 20, color: '#ec4899' },
    // More platforms for a larger world
    { x: 800, y: 300, width: 200, height: 20, color: '#10b981' },
    { x: 1100, y: 200, width: 150, height: 20, color: '#3b82f6' },
    { x: 1300, y: 350, width: 180, height: 20, color: '#8b5cf6' },
    { x: 1600, y: 250, width: 120, height: 20, color: '#f59e0b' },
    // Ground platform - spans entire world
    { x: 0, y: 550, width: 2000, height: 50, color: '#64748b' }
];

// Keyboard input state
const keys = {
    a: false,
    d: false,
    w: false,
    s: false,
    arrowLeft: false,
    arrowRight: false,
    arrowUp: false,
    arrowDown: false,
    space: false
};

// Game state
let gameState = {
    canvas: null,
    ctx: null,
    lastTime: 0,
    accumulator: 0,
    isRunning: true,
    animationFrameId: null,
    debugInfo: {
        fps: 0,
        frameCount: 0,
        lastFpsUpdate: 0,
        lag: 0
    }
};

// World boundaries
const WORLD = {
    width: 2000,
    height: 600
};

// Initialize the game when the page loads
window.addEventListener('load', initGame);

/**
 * Initialize the game
 */
function initGame() {
    console.log('Initializing 2D Platformer Game...');
    
    // Get canvas and context
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    
    // Set up keyboard event listeners
    setupKeyboardControls();
    
    // Set canvas to full screen
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize camera
    camera.width = gameState.canvas.width;
    camera.height = gameState.canvas.height;
    
    // Position player on first platform
    positionPlayerOnStartPlatform();
    
    // Initialize camera to player position
    camera.x = player.x - camera.width / 2 + player.width / 2;
    camera.y = 0; // Camera only follows horizontally
    
    // Hide loading overlay
    document.getElementById('loadingOverlay').style.display = 'none';
    
    // Start the game loop
    gameState.lastTime = performance.now();
    startGameLoop();
    
    console.log('Game initialized successfully!');
    console.log('Canvas size:', gameState.canvas.width, 'x', gameState.canvas.height);
    console.log('Camera size:', camera.width, 'x', camera.height);
    console.log('Player position:', player.x, player.y);
    console.log('Camera position:', camera.x, camera.y);
    console.log('Platforms created:', platforms.length);
    console.log('World size:', WORLD.width, 'x', WORLD.height);
    console.log('Game loop started with target FPS:', GAME.TARGET_FPS);
}

/**
 * Set up keyboard event listeners
 */
function setupKeyboardControls() {
    // Key down event
    window.addEventListener('keydown', (e) => {
        switch (e.key.toLowerCase()) {
            case 'a':
                keys.a = true;
                break;
            case 'd':
                keys.d = true;
                break;
            case 'w':
                keys.w = true;
                if (player.isOnGround && player.canJump) {
                    player.velocityY = GAME.JUMP_FORCE;
                    player.isOnGround = false;
                    player.canJump = false;
                    player.jumpCooldown = 0.2; // Small cooldown to prevent double jumps
                    console.log('Jump!');
                }
                break;
            case 's':
                keys.s = true;
                break;
            case ' ':
                keys.space = true;
                if (player.isOnGround && player.canJump) {
                    player.velocityY = GAME.JUMP_FORCE;
                    player.isOnGround = false;
                    player.canJump = false;
                    player.jumpCooldown = 0.2; // Small cooldown to prevent double jumps
                    console.log('Jump! (Space)');
                }
                break;
            case 'arrowleft':
            case 'left':
                keys.arrowLeft = true;
                break;
            case 'arrowright':
            case 'right':
                keys.arrowRight = true;
                break;
            case 'arrowup':
            case 'up':
                keys.arrowUp = true;
                if (player.isOnGround && player.canJump) {
                    player.velocityY = GAME.JUMP_FORCE;
                    player.isOnGround = false;
                    player.canJump = false;
                    player.jumpCooldown = 0.2; // Small cooldown to prevent double jumps
                    console.log('Jump! (Arrow Up)');
                }
                break;
            case 'arrowdown':
            case 'down':
                keys.arrowDown = true;
                break;
            case 'd':
                // Don't toggle debug if shift is held
                if (!e.shiftKey) {
                    GAME.DEBUG_MODE = !GAME.DEBUG_MODE;
                    console.log(`Debug mode ${GAME.DEBUG_MODE ? 'enabled' : 'disabled'}`);
                }
                break;
        }
    });
    
    // Key up event
    window.addEventListener('keyup', (e) => {
        switch (e.key.toLowerCase()) {
            case 'a':
                keys.a = false;
                break;
            case 'd':
                keys.d = false;
                break;
            case 'w':
                keys.w = false;
                break;
            case 's':
                keys.s = false;
                break;
            case ' ':
                keys.space = false;
                break;
            case 'arrowleft':
            case 'left':
                keys.arrowLeft = false;
                break;
            case 'arrowright':
            case 'right':
                keys.arrowRight = false;
                break;
            case 'arrowup':
            case 'up':
                keys.arrowUp = false;
                break;
            case 'arrowdown':
            case 'down':
                keys.arrowDown = false;
                break;
        }
    });
    
    // Prevent arrow key scrolling
    window.addEventListener('keydown', (e) => {
        if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false);
}

/**
 * Position player on the starting platform
 */
function positionPlayerOnStartPlatform() {
    // Start on the first platform
    const startPlatform = platforms[0];
    player.x = startPlatform.x + startPlatform.width / 2 - player.width / 2;
    player.y = startPlatform.y - player.height;
}

/**
 * Resize canvas to fill the screen
 */
function resizeCanvas() {
    const container = gameState.canvas.parentElement;
    
    // Store previous canvas size
    const prevWidth = gameState.canvas.width;
    const prevHeight = gameState.canvas.height;
    
    // Set canvas dimensions to match container
    gameState.canvas.width = container.clientWidth;
    gameState.canvas.height = container.clientHeight;
    
    // Update camera size
    camera.width = gameState.canvas.width;
    camera.height = gameState.canvas.height;
    
    // Adjust player position to maintain relative position within camera
    if (prevWidth > 0 && prevHeight > 0) {
        // Calculate player's screen position relative to camera
        const playerScreenX = player.x - camera.x;
        const playerScreenY = player.y - camera.y;
        
        // Calculate new world position based on screen position
        player.x = camera.x + (playerScreenX / prevWidth) * gameState.canvas.width;
        player.y = camera.y + (playerScreenY / prevHeight) * gameState.canvas.height;
        
        // Ensure player doesn't go off world boundaries
        player.x = Math.max(0, Math.min(player.x, WORLD.width - player.width));
        player.y = Math.max(0, Math.min(player.y, WORLD.height - player.height));
    } else {
        // First time setup
        positionPlayerOnStartPlatform();
    }
    
    console.log('Canvas resized to:', gameState.canvas.width, 'x', gameState.canvas.height);
    console.log('Camera resized to:', camera.width, 'x', camera.height);
    console.log('Player repositioned to:', player.x, player.y);
}

/**
 * Update camera position to follow player
 * @param {number} deltaTime - Time since last frame in seconds
 */
function updateCamera(deltaTime) {
    // Set camera target to player position (centered horizontally)
    camera.targetX = player.x - camera.width / 2 + player.width / 2;
    
    // Keep camera within world bounds
    camera.targetX = Math.max(0, Math.min(camera.targetX, WORLD.width - camera.width));
    
    // Smoothly interpolate camera position toward target
    camera.x += (camera.targetX - camera.x) * GAME.CAMERA_SMOOTHNESS;
    
    // Small vertical follow (optional, can be adjusted)
    camera.targetY = player.y - camera.height / 2 + player.height / 2;
    camera.targetY = Math.max(0, Math.min(camera.targetY, WORLD.height - camera.height));
    camera.y += (camera.targetY - camera.y) * GAME.CAMERA_SMOOTHNESS * 0.5; // Slower vertical follow
}

/**
 * Convert world coordinates to screen coordinates
 * @param {number} worldX - World X coordinate
 * @param {number} worldY - World Y coordinate
 * @returns {Object} Screen coordinates {x, y}
 */
function worldToScreen(worldX, worldY) {
    return {
        x: worldX - camera.x,
        y: worldY - camera.y
    };
}

/**
 * Convert screen coordinates to world coordinates
 * @param {number} screenX - Screen X coordinate
 * @param {number} screenY - Screen Y coordinate
 * @returns {Object} World coordinates {x, y}
 */
function screenToWorld(screenX, screenY) {
    return {
        x: screenX + camera.x,
        y: screenY + camera.y
    };
}

/**
 * Check if a world object is visible in the camera view
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {number} width - Object width
 * @param {number} height - Object height
 * @returns {boolean} True if object is visible
 */
function isInView(x, y, width, height) {
    return (
        x + width > camera.x &&
        x < camera.x + camera.width &&
        y + height > camera.y &&
        y < camera.y + camera.height
    );
}

/**
 * Start the main game loop
 */
function startGameLoop() {
    // Cancel any existing animation frame
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
    }
    
    // Start the loop
    gameState.lastTime = performance.now();
    gameLoop();
}

/**
 * Main game loop using fixed timestep for consistent updates
 */
function gameLoop() {
    // Get current time
    const currentTime = performance.now();
    
    // Calculate elapsed time since last frame
    const elapsedTime = currentTime - gameState.lastTime;
    gameState.lastTime = currentTime;
    
    // Cap elapsed time to avoid spiral of death
    const clampedElapsedTime = Math.min(elapsedTime, 100);
    
    // Calculate delta time for smooth movement
    const deltaTime = clampedElapsedTime / 1000; // Convert to seconds
    
    // Update game state
    updatePlayer(deltaTime);
    updateCamera(deltaTime);
    
    // Update debug info
    updateDebugInfo(currentTime, clampedElapsedTime);
    
    // Clear the canvas
    clearCanvas();
    
    // Draw game elements
    drawBackground();
    
    // Draw platforms
    drawPlatforms();
    
    // Draw player
    drawPlayer();
    
    // Draw world boundaries
    drawWorldBoundaries();
    
    // Draw debug info if enabled
    if (GAME.DEBUG_MODE) {
        drawDebugInfo();
    }
    
    // Continue the game loop
    if (gameState.isRunning) {
        gameState.animationFrameId = requestAnimationFrame(gameLoop);
    }
}

/**
 * Check collision between player and a platform
 * @param {Object} platform - Platform object
 * @returns {boolean} - True if player is colliding with platform from top
 */
function checkPlatformCollision(platform) {
    // Check if player is above the platform and moving downward
    const isAbove = player.y + player.height <= platform.y + 5; // Small tolerance
    const isMovingDown = player.velocityY > 0;
    
    // Check if player is horizontally within platform bounds
    const playerRight = player.x + player.width;
    const playerBottom = player.y + player.height;
    const platformRight = platform.x + platform.width;
    
    const isHorizontallyAligned = 
        player.x < platformRight && 
        playerRight > platform.x;
    
    // Check if player's bottom is near platform top
    const isTouchingTop = playerBottom >= platform.y && playerBottom <= platform.y + 10;
    
    return isAbove && isMovingDown && isHorizontallyAligned && isTouchingTop;
}

/**
 * Update player position based on velocity and input
 * @param {number} deltaTime - Time since last frame in seconds
 */
function updatePlayer(deltaTime) {
    // Update jump cooldown
    if (player.jumpCooldown > 0) {
        player.jumpCooldown -= deltaTime;
    } else if (!player.canJump && player.isOnGround) {
        player.canJump = true; // Reset jump ability when back on ground
    }
    
    // Handle horizontal movement input
    let moveLeft = keys.a || keys.arrowLeft;
    let moveRight = keys.d || keys.arrowRight;
    
    // Apply acceleration based on input
    if (moveLeft && !moveRight) {
        // Move left
        player.velocityX -= GAME.PLAYER_SPEED * deltaTime;
    } else if (moveRight && !moveLeft) {
        // Move right
        player.velocityX += GAME.PLAYER_SPEED * deltaTime;
    } else {
        // Apply friction when no horizontal input
        player.velocityX *= GAME.PLAYER_FRICTION;
    }
    
    // Limit maximum speed
    if (Math.abs(player.velocityX) > player.maxSpeed) {
        player.velocityX = player.maxSpeed * Math.sign(player.velocityX);
    }
    
    // Apply very small friction at all times to prevent tiny perpetual movement
    if (Math.abs(player.velocityX) < 0.1) {
        player.velocityX = 0;
    }
    
    // Apply gravity (constantly pulls player down)
    player.velocityY += GAME.GRAVITY * deltaTime;
    
    // Update position based on velocity
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Reset ground state - will be set to true if on any platform
    player.isOnGround = false;
    
    // Check collisions with all platforms
    for (const platform of platforms) {
        if (checkPlatformCollision(platform)) {
            // Land on platform
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isOnGround = true;
            break; // Only stand on one platform at a time
        }
    }
    
    // Keep player within world horizontal bounds
    if (player.x < 0) {
        player.x = 0;
        player.velocityX = 0; // Stop movement at boundary
    } else if (player.x + player.width > WORLD.width) {
        player.x = WORLD.width - player.width;
        player.velocityX = 0; // Stop movement at boundary
    }
    
    // Prevent player from going above the top of the world
    if (player.y < 0) {
        player.y = 0;
        player.velocityY = 0;
    }
    
    // Prevent player from going below the bottom of the world
    if (player.y + player.height > WORLD.height) {
        player.y = WORLD.height - player.height;
        player.velocityY = 0;
        player.isOnGround = true;
    }
}

/**
 * Draw world boundaries
 */
function drawWorldBoundaries() {
    // Draw left boundary
    if (camera.x < 50) {
        const screenPos = worldToScreen(0, 0);
        gameState.ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        gameState.ctx.fillRect(screenPos.x, screenPos.y, 10, camera.height);
    }
    
    // Draw right boundary
    if (camera.x + camera.width > WORLD.width - 50) {
        const screenPos = worldToScreen(WORLD.width - 10, 0);
        gameState.ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        gameState.ctx.fillRect(screenPos.x, screenPos.y, 10, camera.height);
    }
    
    // Draw world edge markers in debug mode
    if (GAME.DEBUG_MODE) {
        const leftEdge = worldToScreen(0, WORLD.height / 2);
        const rightEdge = worldToScreen(WORLD.width, WORLD.height / 2);
        
        gameState.ctx.fillStyle = '#ef4444';
        gameState.ctx.font = '14px monospace';
        gameState.ctx.textAlign = 'center';
        gameState.ctx.fillText('WORLD START', leftEdge.x + 30, leftEdge.y);
        gameState.ctx.fillText('WORLD END', rightEdge.x - 30, rightEdge.y);
    }
}

/**
 * Draw all platforms
 */
function drawPlatforms() {
    for (const platform of platforms) {
        // Only draw platforms that are in view (performance optimization)
        if (!isInView(platform.x, platform.y, platform.width, platform.height)) {
            continue;
        }
        
        // Convert world coordinates to screen coordinates
        const screenPos = worldToScreen(platform.x, platform.y);
        
        // Draw platform body
        gameState.ctx.fillStyle = platform.color;
        gameState.ctx.fillRect(screenPos.x, screenPos.y, platform.width, platform.height);
        
        // Draw platform top highlight
        gameState.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        gameState.ctx.fillRect(screenPos.x, screenPos.y, platform.width, 4);
        
        // Draw platform shadow
        gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        gameState.ctx.fillRect(screenPos.x, screenPos.y + platform.height, platform.width, 3);
        
        // Draw platform sides
        gameState.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        gameState.ctx.lineWidth = 2;
        gameState.ctx.strokeRect(screenPos.x, screenPos.y, platform.width, platform.height);
        
        // Draw platform label for debugging
        if (GAME.DEBUG_MODE) {
            gameState.ctx.fillStyle = '#ffffff';
            gameState.ctx.font = '12px monospace';
            gameState.ctx.textAlign = 'center';
            gameState.ctx.fillText(
                `P${platforms.indexOf(platform) + 1}`,
                screenPos.x + platform.width / 2,
                screenPos.y + platform.height / 2 + 4
            );
        }
    }
}

/**
 * Clear the canvas with the background color
 */
function clearCanvas() {
    // Use a more efficient clear method
    gameState.ctx.fillStyle = GAME.BACKGROUND_COLOR;
    gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
}

/**
 * Draw the game background
 */
function drawBackground() {
    // Draw a simple gradient overlay on top of the solid blue background
    const gradient = gameState.ctx.createLinearGradient(0, 0, 0, gameState.canvas.height);
    gradient.addColorStop(0, 'rgba(30, 58, 138, 0.9)'); // Blue at top
    gradient.addColorStop(1, 'rgba(30, 58, 138, 0.7)'); // Slightly transparent at bottom
    
    gameState.ctx.fillStyle = gradient;
    gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Draw a subtle grid pattern for visual interest (world space)
    drawGrid();
}

/**
 * Draw a subtle grid pattern in world space
 */
function drawGrid() {
    const gridSize = 80;
    const gridColor = 'rgba(255, 255, 255, 0.05)';
    
    gameState.ctx.strokeStyle = gridColor;
    gameState.ctx.lineWidth = 1;
    
    // Calculate visible grid area
    const startX = Math.floor(camera.x / gridSize) * gridSize;
    const endX = Math.ceil((camera.x + camera.width) / gridSize) * gridSize;
    const startY = Math.floor(camera.y / gridSize) * gridSize;
    const endY = Math.ceil((camera.y + camera.height) / gridSize) * gridSize;
    
    // Draw vertical lines
    gameState.ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
        const screenX = x - camera.x;
        gameState.ctx.moveTo(screenX, 0);
        gameState.ctx.lineTo(screenX, camera.height);
    }
    gameState.ctx.stroke();
    
    // Draw horizontal lines
    gameState.ctx.beginPath();
    for (let y = startY; y <= endY; y += gridSize) {
        const screenY = y - camera.y;
        gameState.ctx.moveTo(0, screenY);
        gameState.ctx.lineTo(camera.width, screenY);
    }
    gameState.ctx.stroke();
}

/**
 * Draw the player character
 */
function drawPlayer() {
    // Convert player world position to screen position
    const screenPos = worldToScreen(player.x, player.y);
    
    // Draw player shadow (only when not on ground)
    if (!player.isOnGround) {
        gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        const shadowSize = player.width * (0.8 + 0.2 * (1 - Math.abs(player.velocityY) / 20));
        const shadowX = screenPos.x + (player.width - shadowSize) / 2;
        const shadowY = screenPos.y + player.height + 5;
        
        gameState.ctx.beginPath();
        gameState.ctx.ellipse(
            shadowX + shadowSize / 2,
            shadowY,
            shadowSize / 2,
            5,
            0, 0, Math.PI * 2
        );
        gameState.ctx.fill();
    }
    
    // Draw player body (red square)
    gameState.ctx.fillStyle = player.color;
    gameState.ctx.fillRect(screenPos.x, screenPos.y, player.width, player.height);
    
    // Add a subtle inner highlight for visual appeal
    gameState.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    gameState.ctx.fillRect(screenPos.x + 3, screenPos.y + 3, player.width - 6, 8);
    
    // Add a darker border for definition
    gameState.ctx.strokeStyle = '#991b1b';
    gameState.ctx.lineWidth = 2;
    gameState.ctx.strokeRect(screenPos.x, screenPos.y, player.width, player.height);
    
    // Draw player "eyes" (small white dots)
    gameState.ctx.fillStyle = '#ffffff';
    gameState.ctx.fillRect(screenPos.x + 10, screenPos.y + 12, 6, 6);
    gameState.ctx.fillRect(screenPos.x + player.width - 16, screenPos.y + 12, 6, 6);
    
    // Draw direction indicator based on velocity
    if (Math.abs(player.velocityX) > 0.5) {
        gameState.ctx.fillStyle = player.velocityX > 0 ? '#22c55e' : '#3b82f6';
        const indicatorSize = 8;
        const indicatorX = player.velocityX > 0 ? 
            screenPos.x + player.width + 5 : 
            screenPos.x - indicatorSize - 5;
        gameState.ctx.fillRect(
            indicatorX, 
            screenPos.y + player.height / 2 - indicatorSize / 2, 
            indicatorSize, 
            indicatorSize
        );
    }
    
    // Draw jump indicator
    if (!player.isOnGround) {
        gameState.ctx.fillStyle = player.velocityY < 0 ? '#f59e0b' : '#ef4444';
        const jumpIndicatorSize = 6;
        const jumpIndicatorX = screenPos.x + player.width / 2 - jumpIndicatorSize / 2;
        const jumpIndicatorY = player.velocityY < 0 ? 
            screenPos.y - jumpIndicatorSize - 5 : 
            screenPos.y + player.height + 5;
        gameState.ctx.fillRect(
            jumpIndicatorX,
            jumpIndicatorY,
            jumpIndicatorSize,
            jumpIndicatorSize
        );
    }
}

/**
 * Update debug information
 * @param {number} currentTime - Current timestamp
 * @param {number} elapsedTime - Elapsed time since last frame
 */
function updateDebugInfo(currentTime, elapsedTime) {
    gameState.debugInfo.frameCount++;
    
    // Update FPS every second
    if (currentTime - gameState.debugInfo.lastFpsUpdate >= 1000) {
        gameState.debugInfo.fps = Math.round(
            (gameState.debugInfo.frameCount * 1000) / (currentTime - gameState.debugInfo.lastFpsUpdate)
        );
        gameState.debugInfo.frameCount = 0;
        gameState.debugInfo.lastFpsUpdate = currentTime;
    }
    
    // Calculate lag (difference between actual and target frame time)
    gameState.debugInfo.lag = Math.abs(elapsedTime - GAME.MS_PER_UPDATE);
}

/**
 * Draw debug information on the canvas
 */
function drawDebugInfo() {
    const ctx = gameState.ctx;
    const debugX = 10;
    let debugY = 30;
    const lineHeight = 20;
    
    // Draw debug background panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(5, 5, 300, 240);
    
    // Draw debug text
    ctx.fillStyle = '#4cc9f0';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    
    // Game Loop Info header
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('=== GAME LOOP INFO ===', debugX, debugY);
    debugY += lineHeight;
    
    // FPS
    ctx.fillStyle = gameState.debugInfo.fps >= 55 ? '#4ade80' : '#f87171';
    ctx.fillText(`FPS: ${gameState.debugInfo.fps} (Target: ${GAME.TARGET_FPS})`, debugX, debugY);
    debugY += lineHeight;
    
    // Frame time
    const frameTime = 1000 / Math.max(gameState.debugInfo.fps, 1);
    ctx.fillStyle = '#4cc9f0';
    ctx.fillText(`Frame: ${frameTime.toFixed(1)}ms`, debugX, debugY);
    debugY += lineHeight;
    
    // Lag
    ctx.fillStyle = gameState.debugInfo.lag < 2 ? '#4ade80' : '#f87171';
    ctx.fillText(`Lag: ${gameState.debugInfo.lag.toFixed(2)}ms`, debugX, debugY);
    debugY += lineHeight;
    
    // Camera info header
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('=== CAMERA INFO ===', debugX, debugY);
    debugY += lineHeight;
    
    // Camera position
    ctx.fillStyle = '#c084fc';
    ctx.fillText(`Position: (${Math.floor(camera.x)}, ${Math.floor(camera.y)})`, debugX, debugY);
    debugY += lineHeight;
    
    // Camera target
    ctx.fillText(`Target: (${Math.floor(camera.targetX)}, ${Math.floor(camera.targetY)})`, debugX, debugY);
    debugY += lineHeight;
    
    // Player info header
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('=== PLAYER INFO ===', debugX, debugY);
    debugY += lineHeight;
    
    // Player position (world)
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`World Pos: (${Math.floor(player.x)}, ${Math.floor(player.y)})`, debugX, debugY);
    debugY += lineHeight;
    
    // Player velocity
    ctx.fillStyle = player.velocityX !== 0 ? '#22c55e' : '#94a3b8';
    ctx.fillText(`Velocity X: ${player.velocityX.toFixed(2)}`, debugX, debugY);
    debugY += lineHeight;
    
    ctx.fillStyle = player.velocityY !== 0 ? '#f59e0b' : '#94a3b8';
    ctx.fillText(`Velocity Y: ${player.velocityY.toFixed(2)}`, debugX, debugY);
    debugY += lineHeight;
    
    // Player state
    ctx.fillStyle = player.isOnGround ? '#22c55e' : '#f59e0b';
    ctx.fillText(`On Ground: ${player.isOnGround ? 'YES' : 'NO'}`, debugX, debugY);
    
    // World info
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`World: ${WORLD.width} x ${WORLD.height}`, debugX + 150, debugY);
}

// Handle window focus/blur to pause/resume game
window.addEventListener('blur', () => {
    console.log('Game paused (window lost focus)');
    gameState.isRunning = false;
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
        gameState.animationFrameId = null;
    }
});

window.addEventListener('focus', () => {
    console.log('Game resumed (window gained focus)');
    if (!gameState.isRunning) {
        gameState.isRunning = true;
        startGameLoop();
    }
});

// Export for debugging
window.gameState = gameState;
window.GAME = GAME;
window.player = player;
window.keys = keys;
window.platforms = platforms;
window.camera = camera;
window.WORLD = WORLD;

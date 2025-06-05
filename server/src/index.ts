import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData,
    PlayerNumber,
    GameState,
    GameStateStatus,
    PADDLE_WIDTH,
    PADDLE_HEIGHT,
    BALL_RADIUS,
    GAME_WIDTH,
    GAME_HEIGHT,
    BALL_SPEED_X,
    BALL_SPEED_Y,
    PADDLE_SPEED,
} from '../../shared/types'; 

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4000;

// --- Game State Management ---
let game: GameState = {
    status: GameStateStatus.WaitingForPlayers,
    players: {},
    ball: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, radius: BALL_RADIUS, dx: 0, dy: 0 },
    lastUpdateTime: Date.now(),
};

let gameLoopInterval: NodeJS.Timeout | null = null;
const GAME_TICK_RATE = 1000 / 60; 

// reset ball position and velocity
function resetBall() {
    game.ball = {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
        radius: BALL_RADIUS,
        dx: (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED_X, 
        dy: (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED_Y,
    };
}

// initialize or reset game state
function initializeGame() {
    game = {
        status: GameStateStatus.WaitingForPlayers,
        players: {
            [PlayerNumber.One]: undefined, 
            [PlayerNumber.Two]: undefined,
        },
        ball: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, radius: BALL_RADIUS, dx: 0, dy: 0 },
        lastUpdateTime: Date.now(),
    };
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = null;
    }
    console.log("Game initialized/reset. Status:", game.status);
}

//  game loop
function startGameLoop() {
    if (gameLoopInterval) return; 

    console.log("Starting game loop...");
    resetBall(); 
    game.status = GameStateStatus.Playing;

    gameLoopInterval = setInterval(() => {
        const now = Date.now();
        const deltaTime = (now - game.lastUpdateTime) / 1000; 
        game.lastUpdateTime = now;

        // Core Game Logic
        // 1. Ball Movement
        game.ball.x += game.ball.dx * deltaTime * 60; 
        game.ball.y += game.ball.dy * deltaTime * 60;

        // 2. Ball Collision with Top/Bottom Walls
        if (game.ball.y - game.ball.radius < 0 || game.ball.y + game.ball.radius > GAME_HEIGHT) {
            game.ball.dy *= -1; 
            game.ball.y = Math.max(game.ball.radius, Math.min(GAME_HEIGHT - game.ball.radius, game.ball.y));
        }

        // 3. Ball Collision with Paddles
        const player1Paddle = game.players[PlayerNumber.One]?.paddle;
        const player2Paddle = game.players[PlayerNumber.Two]?.paddle;

        // Player 1 (Left)
        if (player1Paddle &&
            game.ball.x - game.ball.radius <= player1Paddle.x + player1Paddle.width && 
            game.ball.y + game.ball.radius > player1Paddle.y && 
            game.ball.y - game.ball.radius < player1Paddle.y + player1Paddle.height && 
            game.ball.dx < 0 
        ) {
            game.ball.dx *= -1; 
            const hitPoint = (game.ball.y - (player1Paddle.y + player1Paddle.height / 2)) / (player1Paddle.height / 2);
            game.ball.dy = hitPoint * BALL_SPEED_Y; 
            game.ball.x = player1Paddle.x + player1Paddle.width + game.ball.radius;
        }

        // Player 2 (Right)
        if (player2Paddle &&
            game.ball.x + game.ball.radius >= player2Paddle.x && 
            game.ball.y + game.ball.radius > player2Paddle.y &&
            game.ball.y - game.ball.radius < player2Paddle.y + player2Paddle.height &&
            game.ball.dx > 0 
        ) {
            game.ball.dx *= -1; 
            const hitPoint = (game.ball.y - (player2Paddle.y + player2Paddle.height / 2)) / (player2Paddle.height / 2);
            game.ball.dy = hitPoint * BALL_SPEED_Y;
            game.ball.x = player2Paddle.x - game.ball.radius;
        }

        // 4. Scoring
        if (game.ball.x - game.ball.radius < 0) { 
            if (game.players[PlayerNumber.Two]) {
                game.players[PlayerNumber.Two]!.score++;
                console.log(`Player 2 scores! Score: ${game.players[PlayerNumber.One]?.score} - ${game.players[PlayerNumber.Two]?.score}`);
            }
            resetBall();
        } else if (game.ball.x + game.ball.radius > GAME_WIDTH) { 
            if (game.players[PlayerNumber.One]) {
                game.players[PlayerNumber.One]!.score++;
                console.log(`Player 1 scores! Score: ${game.players[PlayerNumber.One]?.score} - ${game.players[PlayerNumber.Two]?.score}`);
            }
            resetBall();
        }

        io.emit('gameState', game);

    }, GAME_TICK_RATE);
}

// Connection Handling 
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    let assignedPlayerNumber: PlayerNumber | null = null;

    if (!game.players[PlayerNumber.One]) {
        assignedPlayerNumber = PlayerNumber.One;
        game.players[PlayerNumber.One] = {
            id: socket.id,
            playerNumber: PlayerNumber.One,
            paddle: { x: 0, y: (GAME_HEIGHT - PADDLE_HEIGHT) / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT },
            score: 0,
            ready: false,
        };
        socket.data.playerNumber = PlayerNumber.One;
        socket.emit('playerAssigned', PlayerNumber.One);
        socket.emit('message', 'You are Player 1. Waiting for Player 2...');
        console.log(`Assigned ${socket.id} as Player 1`);
    } else if (!game.players[PlayerNumber.Two]) {
        assignedPlayerNumber = PlayerNumber.Two;
        game.players[PlayerNumber.Two] = {
            id: socket.id,
            playerNumber: PlayerNumber.Two,
            paddle: { x: GAME_WIDTH - PADDLE_WIDTH, y: (GAME_HEIGHT - PADDLE_HEIGHT) / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT },
            score: 0,
            ready: false,
        };
        socket.data.playerNumber = PlayerNumber.Two;
        socket.emit('playerAssigned', PlayerNumber.Two);
        socket.emit('message', 'You are Player 2. Waiting for players to be ready...');
        console.log(`Assigned ${socket.id} as Player 2`);
    } else {
        socket.emit('message', 'Game is full. Please try again later.');
        socket.disconnect(true);
        console.log(`Game full, disconnected ${socket.id}`);
        return;
    }

    socket.emit('gameState', game);

    // Handle Player Ready
    socket.on('playerReady', () => {
        if (assignedPlayerNumber && game.players[assignedPlayerNumber]) {
            game.players[assignedPlayerNumber]!.ready = true;
            console.log(`Player ${assignedPlayerNumber} is ready!`);
            io.emit('message', `Player ${assignedPlayerNumber === PlayerNumber.One ? '1' : '2'} is ready!`);

            const player1Ready = game.players[PlayerNumber.One]?.ready;
            const player2Ready = game.players[PlayerNumber.Two]?.ready;

            if (player1Ready && player2Ready && game.status === GameStateStatus.WaitingForPlayers) {
                console.log('Both players ready! Starting game...');
                io.emit('message', 'Both players ready! Game starting...');
                startGameLoop(); 
            }
        }
    });

    //Handle Paddle Movement from Client
    socket.on('paddleMove', (direction) => {
        const playerNum = socket.data.playerNumber;
        if (playerNum && game.players[playerNum] && game.status === GameStateStatus.Playing) {
            const paddle = game.players[playerNum]!.paddle;
            if (direction === 'up') {
                paddle.y -= PADDLE_SPEED;
            } else {
                paddle.y += PADDLE_SPEED;
            }
            paddle.y = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, paddle.y));
        }
    });

    //Handle Disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (assignedPlayerNumber) {
            console.log(`Player ${assignedPlayerNumber} disconnected.`);
            game.players[assignedPlayerNumber] = undefined; 

            if (gameLoopInterval) {
                clearInterval(gameLoopInterval);
                gameLoopInterval = null;
                game.status = GameStateStatus.GameOver; 
                io.emit('message', `Player ${assignedPlayerNumber === PlayerNumber.One ? '1' : '2'} disconnected. Game over.`);
                console.log("Game stopped due to player disconnection.");
                initializeGame(); 
            } else if (game.status === GameStateStatus.WaitingForPlayers) {
                const remainingPlayers = Object.values(game.players).filter(p => p !== undefined).length;
                if (remainingPlayers < 2) {
                    io.emit('message', `Player ${assignedPlayerNumber === PlayerNumber.One ? '1' : '2'} left. Waiting for players...`);
                    initializeGame(); 
                }
            }
        }
        io.emit('gameState', game); 
    });
});


httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    initializeGame(); 
});
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 100;
export const BALL_RADIUS = 10;
export const PADDLE_SPEED = 8; 
export const BALL_SPEED_X = 5; 
export const BALL_SPEED_Y = 5;


export enum PlayerNumber {
    One = 'player1',
    Two = 'player2',
}

export enum GameStateStatus {
    WaitingForPlayers = 'waiting',
    Playing = 'playing',
    GameOver = 'gameover',
}


export interface PaddleState {
    x: number;
    y: number;
    height: number;
    width: number;
}

export interface BallState {
    x: number;
    y: number;
    radius: number;
    dx: number; 
    dy: number; 
}

export interface PlayerState {
    id: string; 
    playerNumber: PlayerNumber;
    paddle: PaddleState;
    score: number;
    ready: boolean; 
}

export interface GameState {
    status: GameStateStatus;
    players: {
        [PlayerNumber.One]?: PlayerState;
        [PlayerNumber.Two]?: PlayerState;
    };
    ball: BallState;
    lastUpdateTime: number; 
}

export interface ServerToClientEvents {
    gameState: (state: GameState) => void;
    playerAssigned: (playerNumber: PlayerNumber) => void;
    message: (text: string) => void;
}

export interface ClientToServerEvents {
    paddleMove: (direction: 'up' | 'down') => void;
    playerReady: () => void;
}

export interface InterServerEvents {
}

export interface SocketData {
    playerNumber?: PlayerNumber;
    gameId?: string;
}
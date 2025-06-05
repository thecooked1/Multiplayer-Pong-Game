import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameState,
  PlayerNumber,
  GAME_WIDTH,
  GAME_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  BALL_RADIUS,
  GameStateStatus,
} from './shared/types'; 


type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = 'http://localhost:4000';

function App() {
  const [socket, setSocket] = useState<ClientSocket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerNumber, setPlayerNumber] = useState<PlayerNumber | null>(null);
  const [message, setMessage] = useState<string>('');

  
  const pressedKeys = useRef<Set<string>>(new Set());

  //Socket.IO Connection and Event Listeners 
  useEffect(() => {
    const newSocket: ClientSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server!');
      setMessage('Connected to server, waiting to be assigned a player...');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setGameState(null);
      setPlayerNumber(null);
      setMessage('Disconnected from server. Refresh to reconnect.');
    });

    newSocket.on('playerAssigned', (num) => {
      setPlayerNumber(num);
      setMessage(`You are ${num === PlayerNumber.One ? 'Player 1 (W/S)' : 'Player 2 (Arrow Up/Down)'}`);
    });

    newSocket.on('gameState', (state) => {
      setGameState(state);
    });

    newSocket.on('message', (text) => {
      console.log('Server message:', text);
      setMessage(text);
    });

  
    return () => {
      newSocket.disconnect();
    };
  }, []); 

  //Player Ready 
  const handlePlayerReady = () => {
    if (socket && playerNumber && gameState?.status === GameStateStatus.WaitingForPlayers) {
      socket.emit('playerReady');
      setMessage('You are ready! Waiting for opponent...');
    }
  };

  //Keyboard Input Handling
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!socket || !playerNumber || gameState?.status !== GameStateStatus.Playing) return;

    // Prevent default scrolling for arrow keys
    if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(event.key)) {
      event.preventDefault();
    }

    if (!pressedKeys.current.has(event.key)) {
      pressedKeys.current.add(event.key);

      if (playerNumber === PlayerNumber.One) {
        if (event.key === 'w') {
          socket.emit('paddleMoveStart', 'up');
        } else if (event.key === 's') {
          socket.emit('paddleMoveStart', 'down');
        }
      } else if (playerNumber === PlayerNumber.Two) {
        if (event.key === 'ArrowUp') {
          socket.emit('paddleMoveStart', 'up');
        } else if (event.key === 'ArrowDown') {
          socket.emit('paddleMoveStart', 'down');
        }
      }
    }
  }, [socket, playerNumber, gameState?.status]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!socket || !playerNumber || gameState?.status !== GameStateStatus.Playing) return;

    if (pressedKeys.current.has(event.key)) {
      pressedKeys.current.delete(event.key);

      if (playerNumber === PlayerNumber.One) {
        if (event.key === 'w') {
          socket.emit('paddleMoveStop', 'up');
        } else if (event.key === 's') {
          socket.emit('paddleMoveStop', 'down');
        }
      } else if (playerNumber === PlayerNumber.Two) {
        if (event.key === 'ArrowUp') {
          socket.emit('paddleMoveStop', 'up');
        } else if (event.key === 'ArrowDown') {
          socket.emit('paddleMoveStop', 'down');
        }
      }
    }
  }, [socket, playerNumber, gameState?.status]);

  // Attach and detach keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);


  // Game Canvas Drawing Component 
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw middle line
    ctx.strokeStyle = '#333';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH / 2, 0);
    ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]); 

    // Draw paddles
    ctx.fillStyle = '#FFF';
    if (gameState.players[PlayerNumber.One]?.paddle) {
      const p1 = gameState.players[PlayerNumber.One]!.paddle;
      ctx.fillRect(p1.x, p1.y, p1.width, p1.height);
    }
    if (gameState.players[PlayerNumber.Two]?.paddle) {
      const p2 = gameState.players[PlayerNumber.Two]!.paddle;
      ctx.fillRect(p2.x, p2.y, p2.width, p2.height);
    }

    // Draw ball
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    ctx.fill();

  }, [gameState]); 

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#282c34',
      color: 'white',
      padding: '20px'
    }}>
      <h1>Multiplayer Pong</h1>
      <p>Status: {message}</p>

      {gameState && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: GAME_WIDTH + 'px',
          marginBottom: '10px',
          fontSize: '24px'
        }}>
          <span>Player 1: {gameState.players[PlayerNumber.One]?.score ?? 0}</span>
          <span>Player 2: {gameState.players[PlayerNumber.Two]?.score ?? 0}</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        style={{ border: '2px solid white', backgroundColor: 'black' }}
      ></canvas>

      {gameState?.status === GameStateStatus.WaitingForPlayers && playerNumber &&
        (playerNumber === PlayerNumber.One || playerNumber === PlayerNumber.Two) &&
        !gameState.players[playerNumber]?.ready && (
          <button
            onClick={handlePlayerReady}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '18px',
              cursor: 'pointer',
              backgroundColor: '#61dafb',
              color: '#282c34',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            Ready to Play!
          </button>
        )}

      {gameState?.status === GameStateStatus.Playing && (
        <p style={{ marginTop: '10px' }}>Game in progress!</p>
      )}

      {gameState?.status === GameStateStatus.GameOver && (
        <p style={{ marginTop: '10px', color: 'red', fontWeight: 'bold' }}>Game Over!</p>
      )}

    </div>
  );
}

export default App;
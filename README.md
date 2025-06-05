#  Multiplayer Pong Game 🎮

Welcome to the **Multiplayer Pong Game**! This project is a real-time, interactive web application that brings the classic arcade game Pong into a multiplayer environment. Two players connect to a central server and control their paddles on their respective screens. The game state (paddle positions, ball position, scores) is synchronized across all connected browsers in real-time using WebSockets, providing a seamless and engaging experience.

This project demonstrates full-stack development, client-server architecture, state management in a distributed environment, and event-driven programming.

## ✨ Features

*   **Real-time Multiplayer:** Supports two concurrent players with synchronized game state.
*   **Authoritative Server:** Node.js backend acts as the single source of truth for all game logic and physics.
*   **Core Game Mechanics:**
    *   Paddle movement (controlled by players).
    *   Ball movement with simple physics (bounces off walls and paddles).
    *   Collision detection for ball-wall and ball-paddle interactions.
    *   Scoring system: A point is awarded to the opponent when a player misses the ball.
*   **Player Assignment:** Automatically assigns "Player 1" and "Player 2" upon connection.
*   **Ready System:** Game starts only when both connected players indicate they are ready.
*   **Dynamic UI Updates:** React frontend renders the game visually based on real-time data from the server.
*   **Continuous Paddle Movement:** Responsive keyboard input for smooth paddle control.
*   **Disconnection Handling:** Game stops if a player disconnects, and the state resets for new players.
*   **Type Safety:** Built entirely with TypeScript for robust code and better developer experience.

## 🛠 Technologies Used

This project leverages a modern full-stack JavaScript (TypeScript) ecosystem:

**Backend (Server):**
*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Fast, unopinionated, minimalist web framework for Node.js.
*   **Socket.IO:** A powerful library for real-time, bidirectional, event-based communication.
*   **TypeScript:** Superset of JavaScript for type safety.
*   **Nodemon:** Utility that automatically restarts the Node.js application when file changes are detected (for development).

**Frontend (Client):**
*   **React:** A JavaScript library for building user interfaces.
*   **Socket.IO Client:** Client-side library for Socket.IO.
*   **TypeScript:** For type safety in React components and state.

**Shared:**
*   **TypeScript:** Used for defining common interfaces, types, and constants shared between the client and server.


## 📂 Project Structure

The project follows a monorepo-like structure, separating the client and server applications, with shared types placed within the client's `src` for Create React App compatibility.



## 🚀 Getting Started

Follow these steps to get the Multiplayer Pong game up and running on your local machine.

### Prerequisites

*   Node.js (v14 or higher recommended)
*   npm (comes with Node.js) or Yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/multiplayer-pong.git
    cd multiplayer-pong
    ```

2.  **Install server dependencies:**
    ```bash
    cd server
    npm install
    # You might want to build the server once to ensure types are resolved
    npm run build
    cd .. # Go back to root
    ```

3.  **Install client dependencies:**
    ```bash
    cd client
    npm install
    cd .. # Go back to root
    ```

### Running the Application

You'll need two separate terminal windows/tabs, one for the server and one for the client.

1.  **Start the Server:**
    *   Open a new terminal.
    *   Navigate to the `server` directory:
        ```bash
        cd multiplayer-pong/server
        ```
    *   Start the server in development mode (with `nodemon` for auto-restarts):
        ```bash
        npm run dev
        ```
    *   You should see output similar to: `Server listening on port 4000`

2.  **Start the Client:**
    *   Open another new terminal.
    *   Navigate to the `client` directory:
        ```bash
        cd multiplayer-pong/client
        ```
    *   Start the React development server:
        ```bash
        npm start
        ```
    *   This will usually open the game in your default browser at `http://localhost:3000`.

### How to Play

1.  **Open two browser tabs/windows:** Once the client is running, open `http://localhost:3000` in two separate browser tabs or windows.
2.  **Player Assignment:** Each tab will be automatically assigned as either "Player 1" or "Player 2".
3.  **Ready Up!** Click the "Ready to Play!" button on *both* browser tabs.
4.  **Game Start:** Once both players are ready, the game will automatically start, and the ball will begin moving.
5.  **Controls:**
    *   **Player 1 (Left Paddle):** Use `W` (move up) and `S` (move down) keys.
    *   **Player 2 (Right Paddle):** Use `ArrowUp` (move up) and `ArrowDown` (move down) keys.
6.  **Scoring:** When the ball passes one player's side, the opponent scores a point, and the ball resets.
7.  **Disconnection:** If one player closes their tab, the game will stop, and the server will reset for new players to connect.

## 💡 Future Enhancements

*   **Game End Conditions:** Implement a score limit (e.g., first to 10 points wins) and declare a winner.
*   **Lobby System:** Allow multiple concurrent games or a more structured waiting room experience.
*   **Client-Side Prediction:** Implement client-side prediction for paddle movement to reduce perceived latency.
*   **Visual & Audio Feedback:** Add sound effects for bounces and scoring, and more polished UI elements.
*   **Difficulty Scaling:** Increase ball speed as the game progresses or scores increase.
*   **Spectator Mode:** Allow users to join a game without participating.
*   **Deployment:** Prepare and deploy the application to a cloud hosting platform (e.g., Heroku, Vercel, AWS).

**Happy Ponging!** 🎾
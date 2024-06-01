// src/App.jsx
import React, { useContext, useEffect, useState } from "react";
import { GameContext } from "./GameContext";
import axios from "axios";

const App = () => {
  const {
    gameId,
    setGameId,
    playerId,
    setPlayerId,
    playerTick,
    setPlayerTick,
    board,
    setBoard,
    waiting,
    setWaiting,
    turn,
    setTurn
  } = useContext(GameContext);
  const [ws, setWs] = useState(null);
  const [name, setName] = useState("");
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (gameId) {
      const socket = new WebSocket(`ws://localhost:3000/game/${gameId}`);

      socket.onopen = () => {
        console.log("WebSocket connection established");
        socket.send(JSON.stringify({ playerId }));
      };

      socket.onmessage = (event) => {
        const { event: eventType, data } = JSON.parse(event.data);
        console.log({ eventType, data });
        if (eventType === "start") {
          setPlayerTick(data.player1.playerId === playerId ? "O" : "X");
          setWaiting(false);
        } else if (eventType === "move") {
          setBoard(data.board);
        }
        else if (eventType === 'winner') {
          setWinner(data.winner.playerId);
        }
        setTurn(data.turn);
      };

      setWs(socket);

      return () => {
        socket.close();
      };
    }
  }, [gameId, playerId, setBoard]);

  const handleJoinGame = async () => {
    try {
      const response = await axios.post("http://localhost:3000/game", { name });
      setGameId(response.data.gameId);
      setPlayerId(response.data.playerId);
      setWaiting(true);
    } catch (error) {
      console.error("Error joining game:", error);
    }
  };

  const handleMove = async (index) => {
    if (board[index] || !playerTick || waiting) return;

    try {
      const response = await axios.post(`http://localhost:3000/game/${gameId}/move`, {
        playerId,
        move: index,
      });
      setBoard(response.data.board);
    } catch (error) {
      console.error("Error making move:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {!gameId ? (
        <div className="p-6 bg-white rounded shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4 text-center">Join Game</h1>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleJoinGame}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-700 transition"
          >
            Join Game
          </button>
        </div>
      ) : (
        <div className="p-6 bg-white rounded shadow-md w-full max-w-md text-center">
          {winner ? (
            <div className="text-xl font-bold mb-4">
              {playerId === winner ? "You are the Winner" : "You lose the game"}
            </div>
          ) : (
            <div>
              {waiting ? (
                <div className="text-lg mb-4">Waiting for an opponent...</div>
              ) : (
                <div>
                  <div className="text-lg mb-4">
                    {turn === playerId ? `It's your turn, Player ${playerTick}` : "It's your Opponent's turn"}
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-60 mx-auto">
                    {board.map((cell, index) => (
                      <div
                        key={index}
                        className={`w-20 h-20 flex items-center justify-center border-2 border-gray-400 text-2xl cursor-pointer ${cell ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                        onClick={() => handleMove(index)}
                      >
                        {cell}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;

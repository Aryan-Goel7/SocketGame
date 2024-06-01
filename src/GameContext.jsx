// src/GameContext.js
import React, { createContext, useState } from "react";

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerTick, setPlayerTick] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [waiting, setWaiting] = useState(false);
  const [turn, setTurn] = useState(null);
  return (
    <GameContext.Provider
      value={{
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
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import ShortUniqueId from "short-unique-id";
import Game from "./Game/Game.js";

const app = express();
const server = http.createServer(app);
const port = 3000;

app.use(express.static("dist"));
app.use(cors());
app.use(express.json());

const uid = new ShortUniqueId({ length: 8 });
const gid = new ShortUniqueId({ length: 10 });
gid.setDictionary("number");

function generateGameId() {
  return gid.rnd();
}

function generateUserId() {
  return uid.rnd();
}

let QUEUE = [];
let games = new Map();
let ROOMS = new Map();

function notifyPlayers(gameId, event, data) {
  const room = ROOMS.get(gameId);
  if (!room) return;

  room.forEach((client) => {
    client.send(JSON.stringify({ event, data }));
  });
}

app.post("/game", (req, res) => {
  try {
    const { name } = req.body;
    const playerId = generateUserId();
    if (QUEUE.length > 0) {
      const { player, gameId } = QUEUE.shift();
      const player2 = { playerId, name, tick: "X" };
      const game = new Game(gameId, player, player2);
      games.set(gameId, game);
      console.log(
        `Match between ${player.name} & ${player2.name} gameId : ${gameId}`
      );
      return res.status(200).send({ gameId, playerId });
    } else {
      const gameId = generateGameId();
      const player = { name, playerId, tick: "O" };
      QUEUE.push({ gameId, player });
      console.log(`Player ${name} with ID ${playerId} added to queue`);
      return res.status(200).json({ gameId, playerId });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server Error");
  }
});

app.post("/game/:gameId/move", (req, res) => {
  try {
    const { gameId } = req.params;
    console.log(gameId);
    const { playerId, move } = req.body;
    const game = games.get(gameId);

    if (!game) {
      return res.status(404).send("Game not found");
    }

    const player = [game.player1, game.player2].find(
      (p) => p.playerId === playerId
    );

    if (!player) {
      return res.status(403).send("Invalid player");
    }

    const moveResult = game.makeMove(player, move);
    if (game.winner) {
      console.log(game.winner);
      notifyPlayers(gameId, "winner", game);
      return res.status(200).json({
        board: game.board,
        status: game.status,
        winner: game.winner,
        turn: game.turn,
      });
    }
    if (moveResult) {
      notifyPlayers(gameId, "move", games.get(gameId));
      return res.status(200).json({
        board: game.board,
        status: game.status,
        winner: game.winner,
        turn: game.turn,
      });
    } else {
      return res.status(400).send("Invalid move");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server Error");
  }
});

server.on("upgrade", (req, socket, head) => {
  const { url } = req;
  if (url.startsWith("/game/")) {
    const gameId = url.substring(6);
    wsServer.handleUpgrade(req, socket, head, (ws) => {
      ws.gameId = gameId; // Attach the gameId to the ws instance
      wsServer.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

const wsServer = new WebSocketServer({ noServer: true });
wsServer.on("connection", (ws, req) => {
  const gameId = ws.gameId;
  console.log(gameId);

  if (ROOMS.has(gameId) && ROOMS.get(gameId)?.length < 2) {
    ROOMS.get(gameId).push(ws);
    notifyPlayers(gameId, "turn", games.get(gameId).turn);
  } else {
    ROOMS.set(gameId, [ws]);
  }

  if (ROOMS.get(gameId).length === 2) {
    const game = games.get(gameId);
    if (game) {
      game.startGame();
      notifyPlayers(gameId, "start", game);
      console.log("Players are notified");
    }
  }
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const express = require("express");
const router = express.Router();
const Game = require("../Models/gameSchema");
const { adminAuth, auth } = require("./auth");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);

    socket.on("createRoom", async ({ gameType, playerID }) => {
      const roomId = Math.random().toString(36).substring(2, 10);
      const game = new Game({ roomId, gameType, players: [playerID] });
      await game.save();
      socket.join(roomId);
      socket.emit("roomCreated", { roomId, game });
    });

    socket.on("joinRoom", async ({ roomId, playerID }) => {
      let game = await Game.findOne({ roomId });
      if (!game) {
        return socket.emit("error", "Room not found");
      }

      if (game.players.length < 2) {
        game.players.push(playerID);
        await game.save();
        socket.join(roomId);
        io.to(roomId).emit("playerJoined", { players: game.players });
      } else {
        socket.emit("error", "Room is full");
      }
    });

    socket.on("gameMove", ({ roomId, move }) => {
      io.to(roomId).emit("updateGame", move);
    });

    socket.on("declareWinner", async ({ roomId, winnerID }) => {
      let game = await Game.findOne({ roomId });
      if (game) {
        game.winner = winnerID;
        await game.save();
        io.to(roomId).emit("gameOver", { winner: winnerID });
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected: " + socket.id);
    });
  });

  router.get("/gamesDetatils", auth, adminAuth, async (req, res) => {
    try {
      const games = await Game.find().populate("players").populate("winner");
      res.status(200).json(games);
    } catch (error) {
      res.status(500).json({ error: "Error fetching game details" });
    }
  });

  return router;
};

const mongoose = require("mongoose");

const gameSchema = mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  gameType: {
    type: String,
    required: true,
    enum: ["TicTacToe", "RockPaperScissors", "SnakeGame"],
  },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

const Game = mongoose.model("game", gameSchema);
module.exports = Game;
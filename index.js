const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const socketIO = require("socket.io");
const http = require("http");
const userRouter = require("./Routers/userRouter");
const gameRouter = require("./Routers/gameRouter");

const app = express();
const PORT = process.env.PORT;
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
const server = http.createServer(app);

const io = new socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.use("/user", userRouter);
app.use("/game", gameRouter(io));

app.get("/", (req, res) => {
  res.send("Welcome to Online Games");
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MONGODB IS CONNECTED"))
  .catch((error) => console.log(error));

server.listen(PORT, () => {
  console.log(`Server sucessfully started in the PORT ${PORT}`);
});

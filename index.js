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

const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(cors());
app.use("/user", userRouter);
app.use("/game", gameRouter(io));

app.get("/", (req, res) => {
  res.send("Welcome to Online Games");
});

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MONGODB IS CONNECTED"))
  .catch((error) => console.log(error));

server.listen(PORT, () => {
  console.log(`Server sucessfully started in the PORT ${PORT}`);
});

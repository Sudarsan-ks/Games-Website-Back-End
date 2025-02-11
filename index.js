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
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.CLIENT_URL_NETLIFY,
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Blocked by CORS: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: [process.env.CLIENT_URL, process.env.CLIENT_URL_NETLIFY],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["websocket", "polling"],
});

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

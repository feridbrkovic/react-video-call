const httpServer = require("http").createServer();
const {Server} = require("socket.io");

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.emit("me", socket.id);
  console.log(socket.id);

  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded");
  });

  socket.on("callUser", (data) => {
    console.log(`Incoming call from ${data.from}`);
    io.to(data.userToCall).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  socket.on("answerCall", (data) => {
    console.log(`Answering call from ${data.from}`);
    io.to(data.to).emit("callAccepted", data.signal);
  });
});

httpServer.listen(5000, () => console.log('Server is running on port 5000'));
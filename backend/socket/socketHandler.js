// socketHandler.js
module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    socket.on("clientMessage", (msg) => {
      console.log("📨 Message from client:", msg);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  //console.log("✅ SocketHandler loaded");
};

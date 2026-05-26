import { redis } from "../../configs/redis.js";

export const registerRoomHandler = (io, socket) => {
  socket.on("join-room", async ({ roomId }) => {
    try {
      if (!roomId) {
        socket.emit("error", { message: "Room ID is required" });
        return;
      }

      socket.join(roomId);
      const clients = io.sockets.adapter.rooms.get(roomId);
      const userCount = clients ? clients.size : 1;

      io.to(roomId).emit("user-count", userCount);
      console.log(`User ${socket.userId} joined room ${roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error", { message: error.message });
    }
  });

  socket.on("send-message", async ({ roomId, text, timestamp, userId }) => {
    try {
      if (!roomId || !text.trim() || !userId) return;

      const username = await redis.get(`user:${userId}:username`);
      const pfp = await redis.get(`user:${userId}:pfp`);

      const message = {
        id: Date.now(),
        text: text.trim(),
        userId,
        username,
        pfp,
        timestamp: new Date(timestamp),
      };

      // Save to Redis (keep last 100 messages)
      await redis.lpush(`room:${roomId}:messages`, JSON.stringify(message));
      await redis.ltrim(`room:${roomId}:messages`, 0, 99);

      // Broadcast to all users in room
      io.to(roomId).emit("receive-message", message);
      console.log(`Message in ${roomId} from ${username}:`, text);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: error.message });
    }
  });

  socket.on("leave-room", async ({ roomId }) => {
    try {
      socket.leave(roomId);
      const clients = io.sockets.adapter.rooms.get(roomId);
      const userCount = clients ? clients.size : 0;
      io.to(roomId).emit("user-count", userCount);
      console.log(`User ${socket.userId} left room ${roomId}`);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  });
};

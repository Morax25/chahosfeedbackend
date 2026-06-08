import { redis } from "../../configs/redis.js";

const emptyRoomTimers = new Map();

export const registerRoomHandler = (io, socket) => {
  socket.on("join-room", async ({ roomId }) => {
    try {
      if (!roomId) {
        socket.emit("error", { message: "Room ID is required" });
        return;
      }

      socket.join(roomId);

      if (emptyRoomTimers.has(roomId)) {
        clearTimeout(emptyRoomTimers.get(roomId));
        emptyRoomTimers.delete(roomId);
      }

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
        timestamp: new Date(timestamp).toISOString(),
      };

      await redis.rpush(`room:${roomId}:messages`, JSON.stringify(message));
      await redis.ltrim(`room:${roomId}:messages`, -100, -1);

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

      if (userCount === 0) {
        const timer = setTimeout(async () => {
          const current = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;
          if (current === 0) {
            await Promise.all([
              redis.hdel("chatrooms", roomId),
              redis.del(`room:${roomId}:messages`),
            ]);
            io.emit("room_deleted", { roomId });
            emptyRoomTimers.delete(roomId);
          }
        }, 20_000);

        emptyRoomTimers.set(roomId, timer);
      } else {
        io.to(roomId).emit("user-count", userCount);
      }

      console.log(`User ${socket.userId} left room ${roomId}`);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  });
};

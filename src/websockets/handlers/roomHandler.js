import { redis } from "../../configs/redis.js";

const emptyRoomTimers = new Map();
const EMPTY_ROOM_TIMEOUT = 30_000;

export const registerRoomHandler = (io, socket) => {
  socket.on("join-room", async ({ roomId }) => {
    try {
      if (!roomId) {
        socket.emit("error", { message: "Room ID is required" });
        return;
      }

      socket.join(roomId);

      // Cancel any pending delete timer for this room
      if (emptyRoomTimers.has(roomId)) {
        clearTimeout(emptyRoomTimers.get(roomId));
        emptyRoomTimers.delete(roomId);
        console.log(`Cancelled delete timer for room ${roomId}`);
      }

      const clients = io.sockets.adapter.rooms.get(roomId);
      const userCount = clients ? clients.size : 1;

      io.to(roomId).emit("user-count", userCount);
      console.log(`User ${socket.userId} joined room ${roomId}, users: ${userCount}`);
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

      console.log(`User ${socket.userId} left room ${roomId}, users: ${userCount}`);

      if (userCount === 0) {
        console.log(`Room ${roomId} is empty, starting ${EMPTY_ROOM_TIMEOUT / 1000}s delete timer`);

        const timer = setTimeout(async () => {
          // Re-check room is still empty when timer fires
          const current = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;

          if (current === 0) {
            try {
              await Promise.all([
                redis.hdel("chatrooms", roomId),
                redis.del(`room:${roomId}:messages`),
              ]);
              io.emit("room_deleted", { roomId });
              console.log(`Room ${roomId} deleted after being empty`);
            } catch (err) {
              console.error(`Failed to delete room ${roomId}:`, err);
            }
          } else {
            console.log(`Room ${roomId} has ${current} users, skipping delete`);
          }

          emptyRoomTimers.delete(roomId);
        }, EMPTY_ROOM_TIMEOUT);

        emptyRoomTimers.set(roomId, timer);
      } else {
        io.to(roomId).emit("user-count", userCount);
      }
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  });

  // Handle abrupt disconnects (browser close, network drop)
  // without this, leave-room may never fire
  socket.on("disconnect", async () => {
    try {
      const rooms = [...socket.rooms];

      for (const roomId of rooms) {
        if (roomId === socket.id) continue; // skip the default personal room

        const clients = io.sockets.adapter.rooms.get(roomId);
        const userCount = clients ? clients.size : 0;

        console.log(`Socket ${socket.id} disconnected from room ${roomId}, users: ${userCount}`);

        if (userCount === 0) {
          if (emptyRoomTimers.has(roomId)) continue; // timer already running

          const timer = setTimeout(async () => {
            const current = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;

            if (current === 0) {
              try {
                await Promise.all([
                  redis.hdel("chatrooms", roomId),
                  redis.del(`room:${roomId}:messages`),
                ]);
                io.emit("room_deleted", { roomId });
                console.log(`Room ${roomId} deleted after disconnect`);
              } catch (err) {
                console.error(`Failed to delete room ${roomId}:`, err);
              }
            }

            emptyRoomTimers.delete(roomId);
          }, EMPTY_ROOM_TIMEOUT);

          emptyRoomTimers.set(roomId, timer);
        } else {
          io.to(roomId).emit("user-count", userCount);
        }
      }
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });
};

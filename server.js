import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import { PORT } from "./src/configs/env.js";
import { connectRedis } from "./src/configs/redis.js";

import initializeSocket from "./src/websockets/index.js";

const startServer = async () => {
  try {
    await connectRedis();
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*",
        credentials: true,
      },
    });
    initializeSocket(io);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};
startServer();

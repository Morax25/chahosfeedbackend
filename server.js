import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import { PORT } from "./src/configs/env.js";
import { connectRedis } from "./src/configs/redis.js";
import initializeSocket from "./src/websockets/index.js";
import { connectRabbitMQ } from "./src/rabbitmq/connection.js";
import { setupRabbitMQ } from "./src/rabbitmq/setup.js";
import { consume } from "./src/rabbitmq/consumer.js";

const startServer = async () => {
  try {
    await connectRedis();
    await connectRabbitMQ();
    await setupRabbitMQ();
    await consume("moderation_queue", async (data) => {
     
  });
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

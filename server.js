import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import { PORT } from "./src/configs/env.js";
import { connectRedis, redis } from "./src/configs/redis.js";
import initializeSocket from "./src/websockets/index.js";
import { connectRabbitMQ } from "./src/rabbitmq/connection.js";
import { setupRabbitMQ } from "./src/rabbitmq/setup.js";
import { consume } from "./src/rabbitmq/consumer.js";
import { deletePostFromRedis } from "./src/websockets/services/post.service.js";

const startServer = async () => {
  try {
    await connectRedis();
    await connectRabbitMQ();
    await setupRabbitMQ();
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*",
        credentials: true,
      },
    });

    app.set("io", io);

    await consume("moderation_queue", async (data) => {
      console.log("Reported Post.", data);
      const { postId, action, reporter, category, reasoning } = data;

      if (action === "auto_remove") {
        const authorId = await redis.get(`post:${postId}:author`);

        io.emit("post_removed", { postId });

        if (reporter) {
          const reporterSockets = await redis.smembers(
            `user:${reporter}:sockets`,
          );
          reporterSockets.forEach((socketId) => {
            io.to(socketId).emit("moderation_notification", {
              variant: "report_resolved",
              category,
              reasoning,
            });
          });
        }

        if (authorId) {
          const authorSockets = await redis.smembers(
            `user:${authorId}:sockets`,
          );
          authorSockets.forEach((socketId) => {
            io.to(socketId).emit("moderation_notification", {
              variant: "post_removed",
              category,
              reasoning,
            });
          });
        }

        await deletePostFromRedis(postId);
        console.log("Post deleted successfully");
      }

      if (action === "human_review") {
        await redis.set(
          `moderation:human_review:${postId}`,
          JSON.stringify(data),
          "EX",
          300,
        );
        console.log(
          `Post ${postId} flagged for human review, expires in 5 minutes`,
        );
      }
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

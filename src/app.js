import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import healthRoute from "./routes/health.route.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import feedRouter from './routes/feed.route.js'
import chatroomRouter from './routes/chatroom.route.js'
const app = express();
app.use(
  pinoHttp({
    transport: {
      target: "pino-pretty",
    },
  }),
);
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use("/api/health", healthRoute);
app.use("/api/feed", feedRouter)
app.use("/api/chatroom", chatroomRouter);
app.use(notFound);
app.use(errorHandler);

export default app;

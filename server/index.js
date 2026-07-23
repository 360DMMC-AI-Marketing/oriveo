import "dotenv/config";
import express from "express";
import compression from "compression";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import fs from "fs";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import IORedis from "ioredis";

import { WebSocketServer } from "ws";
import url from "url";

import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import questionnaireRoutes from "./routes/questionnaires.js";
import callRoutes from "./routes/calls.js";
import userRoutes from "./routes/users.js";
import voiceRoutes from "./routes/voice.js";
import batchRoutes from "./routes/batch.js";
import telephonyRoutes from "./routes/telephony.js";
import integrationRoutes from "./routes/integrations.js";
import appointmentRoutes from "./routes/appointments.js";
import groupRoutes from "./routes/groups.js";
import qaRoutes from "./routes/qa.js";
import auditRoutes from "./routes/audit.js";
import reportRoutes from "./routes/reports.js";
import ehrRoutes from "./routes/ehr.js";
import adminRoutes from "./routes/admin.js";
import inboundRoutes from "./routes/inbound.js";
import notificationRoutes from "./routes/notifications.js";
import patientPortalRoutes from "./routes/patientPortal.js";
import billingRoutes from "./routes/billing.js";
import availabilityRoutes from "./routes/availability.js";
import calendarRoutes from "./routes/calendar.js";
import languageRoutes from "./routes/languages.js";
import clinicalRoutes from "./routes/clinical.js";
import clinicConfigRoutes from "./routes/clinicConfig.js";
import automationRoutes from "./routes/automation.js";
import tenantRoutes from "./routes/tenants.js";
import populationHealthRoutes from "./routes/populationHealth.js";
import biomarkerRoutes from "./routes/biomarkers.js";
import { setIo } from "./services/socketManager.js";

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import MongoStore from "rate-limit-mongo";
import mongoSanitize from "express-mongo-sanitize";
import pino from "pino";
import pinoHttp from "pino-http";
import * as Sentry from "@sentry/node";
import { errorHandler } from "./middleware/errorHandler.js";
import { protect } from "./middleware/auth.js";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

const sentryEnabled = !!process.env.SENTRY_DSN;

if (sentryEnabled) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.2"),
  });
}

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV === "development" ? { target: "pino/file", options: { destination: 1 } } : undefined,
});

const httpLogger = pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" || req.url === "/api/health" } });

const app = express();
if (sentryEnabled) app.use(Sentry.Handlers.requestHandler());

const useHttps = process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH;

let httpServer;
if (useHttps) {
  const httpsOptions = {
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
  };
  httpServer = createHttpsServer(httpsOptions, app);
  if (process.env.NODE_ENV === "production") {
    const httpApp = express();
    httpApp.get("*", (req, res) => res.redirect(`https://${req.headers.host}${req.url}`));
    httpApp.listen(80);
  }
} else {
  httpServer = createServer(app);
}

const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || "http://localhost:5173", methods: ["GET", "POST"] },
});

if (process.env.REDIS_URL) {
  try {
    const pubClient = new IORedis(process.env.REDIS_URL);
    const subClient = new IORedis(process.env.REDIS_URL);
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Socket.io using Redis adapter for multi-instance scaling");
  } catch (err) {
    logger.warn({ err }, "Failed to connect Redis for socket.io, using in-memory");
  }
} else {
  logger.info("No REDIS_URL set, socket.io using in-memory (single instance)");
}

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(compression());
app.use(helmet());
app.use(mongoSanitize());

app.set("trust proxy", 1);

function createRateLimiter() {
  const config = {
    windowMs: 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX || "1000"),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later" },
    skipFailedRequests: true,
  };

  if (process.env.MONGODB_URI) {
    try {
      config.store = new MongoStore({
        uri: process.env.MONGODB_URI,
        collectionName: "rateLimits",
        expireTimeMs: 60 * 1000,
      });
      logger.info("Rate limiter using MongoDB store");
    } catch (err) {
      logger.warn({ err }, "Failed to create MongoDB rate limiter store, using memory");
    }
  }

  return rateLimit(config);
}

app.use(httpLogger);

app.use("/api", createRateLimiter());

app.use(express.json({ limit: "10mb" }));
app.use("/uploads", protect, express.static("uploads"));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    version: process.env.npm_package_version || "1.0.0",
    ssl: useHttps,
    sentry: sentryEnabled,
  });
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Socket connected");
  const userId = socket.userId || socket.handshake.query?.userId;
  if (userId) {
    socket.join(`user:${userId}`);
  }
  socket.on("join-call", (callId) => {
    socket.join(`call:${callId}`);
  });
  socket.on("call-update", (data) => {
    io.to(`call:${data.callId}`).emit("call-updated", data);
  });
  socket.on("join-supervisor", () => {
    socket.join("supervisor-room");
    logger.info({ socketId: socket.id }, "Supervisor joined monitoring room");
  });
  socket.on("leave-supervisor", () => {
    socket.leave("supervisor-room");
  });
  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Socket disconnected");
  });
});

app.set("io", io);
setIo(io);

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/questionnaires", questionnaireRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/users", userRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/batch", batchRoutes);
app.use("/api/telephony", telephonyRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/qa", qaRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ehr", ehrRoutes);
app.use("/api/twilio", inboundRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/patient-portal", patientPortalRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/clinical", clinicalRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/org", tenantRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/clinic-config", clinicConfigRoutes);
app.use("/api/population-health", populationHealthRoutes);
app.use("/api/biomarkers", biomarkerRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

if (sentryEnabled) app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

const wss = new WebSocketServer({ noServer: true });

async function authenticateWs(request) {
  const params = new url.URL(request.url, "http://localhost").searchParams;
  const token = params.get("token");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) return null;
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) return null;
    return user;
  } catch {
    return null;
  }
}

wss.on("connection", (ws, req) => {
  const pathname = url.parse(req.url).pathname;

  if (pathname.startsWith("/media-stream/")) {
    const match = pathname.match(/^\/media-stream\/(.+)$/);
    if (match) {
      import("./services/mediaStream.js").then(({ handleMediaStream }) => {
        handleMediaStream(ws, { params: { callId: match[1] } });
      });
    } else {
      ws.close(1008, "Invalid path");
    }
    return;
  }

  if (pathname.startsWith("/inbound-media-stream/")) {
    const match = pathname.match(/^\/inbound-media-stream\/(.+)$/);
    if (match) {
      import("./services/inboundMediaStream.js").then(({ handleInboundMediaStream }) => {
        handleInboundMediaStream(ws, { params: { callId: match[1] } });
      });
    } else {
      ws.close(1008, "Invalid path");
    }
    return;
  }

  if (pathname === "/agent-voice") {
    import("./services/browserVoice.js").then(({ handleBrowserVoice }) => {
      handleBrowserVoice(ws);
    });
    return;
  }

  ws.close(1008, "Invalid path");
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/oriveo";

httpServer.on("upgrade", async (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;

  if (pathname.startsWith("/inbound-media-stream/")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
    return;
  }

  if (pathname.startsWith("/media-stream/")) {
    const user = await authenticateWs(request);
    if (!user) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
    return;
  }

  if (pathname === "/agent-voice") {
    const user = await authenticateWs(request);
    if (!user) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
    return;
  }

  return;
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    logger.info("Connected to MongoDB");
    httpServer.listen(PORT, () => {
      logger.info({ port: PORT, ssl: useHttps, sentry: sentryEnabled }, "Oriveo server running");
    import("./services/callOrchestrator.js").then(({ recoverOrphanedCalls }) => {
      recoverOrphanedCalls().then((n) => {
        if (n > 0) logger.info({ orphanedCallsRecovered: n }, "Recovered orphaned calls");
      });
    });
    import("./utils/autoNoShow.js").then(({ startNoShowChecker }) => {
      startNoShowChecker();
      logger.info("Auto no-show detection started");
    });
    import("./utils/appointmentReminders.js").then(({ startReminderScheduler }) => {
      startReminderScheduler();
      logger.info("Appointment reminder scheduler started");
    });
    import("./utils/monthlyReport.js").then(({ startMonthlyReportScheduler }) => {
      startMonthlyReportScheduler();
      logger.info("Monthly report scheduler started");
    });
    import("./services/patientVoiceAgent.js").then(({ startAutomatedCallScheduler }) => {
      startAutomatedCallScheduler();
      logger.info("Automated patient call scheduler started");
    });
    import("./services/calendarSync.js").then(({ startCalendarSync }) => {
      startCalendarSync();
      logger.info("Calendar sync started");
    });
    import("./utils/dataRetention.js").then(({ startDataRetentionScheduler }) => {
      startDataRetentionScheduler();
      logger.info("Data retention scheduler started");
    });
    });
  })
  .catch((err) => {
    logger.error({ err }, "MongoDB connection error");
    logger.warn("Starting server without database");
    httpServer.listen(PORT, () => {
      logger.info({ port: PORT }, "Oriveo server running (no DB)");
    });
  });

function gracefulShutdown(signal) {
  logger.info({ signal }, "Shutdown signal received");
  httpServer.close(() => {
    mongoose.connection.close(false).then(() => {
      logger.info("Server shut down gracefully");
      process.exit(0);
    });
  });
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

export { io, logger };

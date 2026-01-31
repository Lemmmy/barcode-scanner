import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const TRUST_PROXY = process.env.TRUST_PROXY === "true";
const MAX_ROOM_CLIENTS = 50;
const SERVE_WEB_APP = process.env.SERVE_WEB_APP === "true";
const WEB_APP_PATH = process.env.WEB_APP_PATH || path.join(__dirname, "../../web/dist");

if (TRUST_PROXY) {
  app.set("trust proxy", true);
}

// Serve static web app files if enabled
if (SERVE_WEB_APP) {
  console.log(`Serving web app from: ${WEB_APP_PATH}`);
  app.use(express.static(WEB_APP_PATH));
}

const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "barcode_scanner_rl",
  points: 5,
  duration: 15,
});

const discoveryRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "barcode_scanner_discovery_rl",
  points: 12,
  duration: 60,
});

interface RoomData {
  clients: Set<string>;
  creatorIp: string;
  createdAt: number;
}

const rooms = new Map<string, RoomData>();

function generateRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getClientIp(socket: {
  handshake: { headers: Record<string, string | string[] | undefined>; address: string };
}): string {
  const forwarded = socket.handshake.headers["x-forwarded-for"];
  if (forwarded && typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return socket.handshake.address;
}

function getRequestIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded && typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

function getIpSubnet(ip: string): string {
  // Handle IPv4
  if (ip.includes(".")) {
    return ip.split(".").slice(0, 3).join(".");
  }
  // Handle IPv6 - use first 64 bits (4 groups)
  if (ip.includes(":")) {
    const groups = ip.split(":");
    return groups.slice(0, 4).join(":");
  }
  return ip;
}

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  let currentRoom: string | null = null;

  socket.on("createRoom", async () => {
    try {
      const ip = getClientIp(socket);
      await rateLimiter.consume(ip);

      let roomCode: string;
      do {
        roomCode = generateRoomCode();
      } while (rooms.has(roomCode));

      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, {
          clients: new Set(),
          creatorIp: ip,
          createdAt: Date.now(),
        });
      }

      const room = rooms.get(roomCode)!;
      if (room.clients.size >= MAX_ROOM_CLIENTS) {
        socket.emit("error", "Room is full");
        return;
      }

      room.clients.add(socket.id);
      currentRoom = roomCode;
      await socket.join(roomCode);

      socket.emit("roomCode", roomCode);
      console.log(`Client ${socket.id} created and joined room ${roomCode}`);
    } catch (error) {
      if (error instanceof Error && "remainingPoints" in error) {
        socket.emit("error", "Rate limit exceeded. Please try again later.");
      } else {
        console.error("Error creating room:", error);
        socket.emit("error", "Failed to create room");
      }
    }
  });

  socket.on("joinRoom", async (roomCode: string) => {
    try {
      const ip = getClientIp(socket);
      await rateLimiter.consume(ip);

      if (!/^\d{4}$/.test(roomCode)) {
        socket.emit("error", "Invalid room code");
        return;
      }

      if (!rooms.has(roomCode)) {
        socket.emit("error", "Room not found");
        return;
      }

      const room = rooms.get(roomCode)!;
      if (room.clients.size >= MAX_ROOM_CLIENTS) {
        socket.emit("error", "Room is full");
        return;
      }

      room.clients.add(socket.id);
      currentRoom = roomCode;
      await socket.join(roomCode);

      socket.emit("roomCode", roomCode);
      console.log(`Client ${socket.id} joined room ${roomCode}`);
    } catch (error) {
      if (error instanceof Error && "remainingPoints" in error) {
        socket.emit("error", "Rate limit exceeded. Please try again later.");
      } else {
        console.error("Error joining room:", error);
        socket.emit("error", "Failed to join room");
      }
    }
  });

  socket.on("changeRoom", async (roomCode: string) => {
    try {
      const ip = getClientIp(socket);
      await rateLimiter.consume(ip);

      if (!/^\d{4}$/.test(roomCode)) {
        socket.emit("error", "Invalid room code");
        return;
      }

      if (currentRoom) {
        const oldRoom = rooms.get(currentRoom);
        if (oldRoom) {
          oldRoom.clients.delete(socket.id);
          if (oldRoom.clients.size === 0) {
            rooms.delete(currentRoom);
            console.log(`Room ${currentRoom} deleted (empty)`);
          }
        }
        await socket.leave(currentRoom);
      }

      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, {
          clients: new Set(),
          creatorIp: ip,
          createdAt: Date.now(),
        });
      }

      const room = rooms.get(roomCode)!;
      if (room.clients.size >= MAX_ROOM_CLIENTS) {
        socket.emit("error", "Room is full");
        return;
      }

      room.clients.add(socket.id);
      currentRoom = roomCode;
      await socket.join(roomCode);

      socket.emit("roomCode", roomCode);
      console.log(`Client ${socket.id} changed to room ${roomCode}`);
    } catch (error) {
      if (error instanceof Error && "remainingPoints" in error) {
        socket.emit("error", "Rate limit exceeded. Please try again later.");
      } else {
        console.error("Error changing room:", error);
        socket.emit("error", "Failed to change room");
      }
    }
  });

  socket.on(
    "scanBarcode",
    (payload: { code: string; templateData?: Record<string, unknown>; fieldOrder?: string[] }) => {
      if (!currentRoom) {
        socket.emit("error", "Not in a room");
        return;
      }

      if (
        !payload ||
        typeof payload.code !== "string" ||
        payload.code.length === 0 ||
        payload.code.length > 1000
      ) {
        socket.emit("error", "Invalid barcode");
        return;
      }

      const data = {
        code: payload.code,
        timestamp: Date.now(),
        templateData: payload.templateData,
        fieldOrder: payload.fieldOrder,
      };

      socket.to(currentRoom).emit("barcodeScanned", data);
      console.log(
        `Barcode scanned in room ${currentRoom}: ${payload.code}`,
        payload.templateData ? "with template data" : "",
      );
    },
  );

  socket.on("shareTemplate", (template: unknown) => {
    if (!currentRoom) {
      socket.emit("error", "Not in a room");
      return;
    }

    if (!template || typeof template !== "object") {
      socket.emit("error", "Invalid template");
      return;
    }

    // Broadcast template to all other clients in the room (not the sender)
    socket.to(currentRoom).emit("templateShared", template);
    console.log(`Template shared in room ${currentRoom}`);
  });

  socket.on("disconnect", () => {
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.clients.delete(socket.id);
        if (room.clients.size === 0) {
          rooms.delete(currentRoom);
          console.log(`Room ${currentRoom} deleted (empty)`);
        }
      }
    }
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", rooms: rooms.size });
});

app.get("/api/nearby-rooms", async (req, res) => {
  try {
    const clientIp = getRequestIp(req);
    await discoveryRateLimiter.consume(clientIp);

    const clientSubnet = getIpSubnet(clientIp);

    const nearbyRooms = Array.from(rooms.entries())
      .filter(([_, data]) => {
        const roomSubnet = getIpSubnet(data.creatorIp);
        return roomSubnet === clientSubnet;
      })
      .map(([code, data]) => ({
        code,
        clientCount: data.clients.size,
        age: Date.now() - data.createdAt,
      }))
      .sort((a, b) => a.age - b.age); // Newest first

    res.json({ rooms: nearbyRooms });
  } catch (error) {
    if (error instanceof Error && "remainingPoints" in error) {
      res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
    } else {
      console.error("Error discovering rooms:", error);
      res.status(500).json({ error: "Failed to discover rooms" });
    }
  }
});

// SPA fallback
if (SERVE_WEB_APP) {
  app.get("/*", (_req, res) => {
    res.sendFile(path.join(WEB_APP_PATH, "index.html"));
  });
}

const server = httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}, starting graceful shutdown...`);

  server.close(() => {
    console.log("HTTP server closed");
  });

  void io.close(() => {
    console.log("Socket.IO server closed");
  });

  await redisClient.quit();
  console.log("Redis connection closed");

  process.exit(0);
}

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

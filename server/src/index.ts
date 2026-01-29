import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import dotenv from "dotenv";

dotenv.config();

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
const MAX_ROOM_CLIENTS = 10;

if (TRUST_PROXY) {
  app.set("trust proxy", true);
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

interface RoomData {
  clients: Set<string>;
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
        rooms.set(roomCode, { clients: new Set() });
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
        rooms.set(roomCode, { clients: new Set() });
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

  socket.on("scanBarcode", (code: string) => {
    if (!currentRoom) {
      socket.emit("error", "Not in a room");
      return;
    }

    if (typeof code !== "string" || code.length === 0 || code.length > 1000) {
      socket.emit("error", "Invalid barcode");
      return;
    }

    const data = {
      code,
      timestamp: Date.now(),
    };

    socket.to(currentRoom).emit("barcodeScanned", data);
    console.log(`Barcode scanned in room ${currentRoom}: ${code}`);
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

app.get("/health", (req, res) => {
  res.json({ status: "ok", rooms: rooms.size });
});

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

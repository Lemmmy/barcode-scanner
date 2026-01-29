# Barcode Scanner

A real-time barcode scanning application with web interface, relay server, and desktop app.

## Project Structure

- `web/` - React web application (browser and Electron renderer)
- `server/` - Node.js relay server
- `electron/` - Electron desktop app with auto-typing

## Features

### Web App

- **Send Mode**: Scan barcodes with device camera and send to receivers
- **Receive Mode**: Receive barcodes from senders in real-time
- Persistent scanned codes log
- Audio feedback on scan
- Room-based pairing with 4-digit codes

### Desktop App

- **Receive Mode Only**: Simplified interface for receiving barcodes
- **Auto-Type**: Automatically types received barcodes into any application
- Configurable keypress delay and key-after-code
- Persistent settings

### Relay Server

- Socket.io-based real-time communication
- Redis-backed rate limiting
- N:M sender-receiver support
- Graceful shutdown

## Prerequisites

- Node.js 20+
- pnpm
- Redis (for relay server)
- Windows (for building desktop app executable)

## Quick Start

### Web App + Server (Development)

```bash
# Install all dependencies
pnpm install

# Terminal 1: Start relay server
cd server
cp .env.example .env
pnpm dev

# Terminal 2: Start web app
cd web
pnpm dev
```

Access at http://localhost:3000

### Desktop App (Development)

```bash
# Terminal 1: Web dev server
cd web
pnpm dev

# Terminal 2: Electron app
cd electron
pnpm install
pnpm dev
```

### Building Desktop App

**Windows (PowerShell):**

```powershell
.\build-electron.ps1
```

**Linux/macOS:**

```bash
chmod +x build-electron.sh
./build-electron.sh
```

Executable will be in `electron/release/`

## Production Deployment

### Docker

```bash
docker-compose up --build
```

This starts:

- Redis on port 6379
- Web app on port 3000
- Relay server on port 3001

### Manual

```bash
# Build web app
cd web
pnpm install
pnpm build

# Build and start server
cd ../server
pnpm install
pnpm build
pnpm start
```

## Environment Variables

See `server/.env.example` for server configuration:

- `PORT` - Server port (default: 3001)
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `NODE_ENV` - Environment (development/production)
- `TRUST_PROXY` - Trust proxy headers for rate limiting

## Documentation

- [Electron Desktop App](electron/README.md)
- [Server API](server/README.md) (if exists)

```

## License

MIT
```

# Barcode Scanner Desktop App

Desktop application for receiving barcodes with auto-typing functionality.

## Features

- **Receive Mode Only**: Simplified interface focused on receiving barcodes
- **Auto-Type**: Automatically types received barcodes into any application
- **Configurable Settings**:
  - Enable/disable auto-typing
  - Keypress delay (0-200ms)
  - Key to press after code (Enter, Right Arrow, Down Arrow)
- **Persistent Settings**: Settings are saved between sessions

## Building

### Prerequisites

- Node.js 20+
- pnpm
- Windows (for building Windows executable)

### Development

```bash
# Install dependencies
cd electron
pnpm install

# Run in development mode (requires web dev server running)
cd ../web
pnpm dev

# In another terminal
cd ../electron
pnpm dev
```

### Production Build

From the project root:

**Windows (PowerShell):**
```powershell
.\build-electron.ps1
```

**Linux/macOS:**
```bash
chmod +x build-electron.sh
./build-electron.sh
```

The executable will be created in `electron/release/`.

## Architecture

- **Main Process** (`src/main.ts`): Electron main process, handles window management and auto-typing via nut.js
- **Preload Script** (`preload.js`): Exposes safe IPC methods to the renderer
- **Renderer**: React web app built with Vite (from `../web`)

## Auto-Typing

Auto-typing is implemented using [@nut-tree/nut-js](https://nutjs.dev/), which provides cross-platform keyboard automation.

When a barcode is received:
1. The barcode is added to the scanned codes log
2. If auto-type is enabled, the main process types each character with the configured delay
3. After typing the code, the configured key (Enter/Right/Down) is pressed

## Configuration

Settings are persisted in localStorage and include:
- `enabled`: Auto-type on/off
- `keypressDelay`: Delay between keypresses in milliseconds (default: 50ms)
- `keyAfterCode`: Key to press after typing (default: "enter")

## Packaging

The app uses electron-builder for packaging. Configuration is in `package.json` under the `build` key.

The build process:
1. Builds the web app in Electron mode (sets base path to `./`)
2. Compiles TypeScript main process
3. Packages everything with electron-builder
4. Creates NSIS installer for Windows

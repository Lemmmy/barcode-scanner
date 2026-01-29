import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { keyboard, Key } from "@nut-tree-fork/nut-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

interface AutoTypeSettings {
  enabled: boolean;
  keypressDelay: number;
  keyAfterCode: "enter" | "right" | "down";
}

const keyMap: Record<string, Key> = {
  enter: Key.Enter,
  right: Key.Right,
  down: Key.Down,
};

async function autoTypeBarcode(code: string, settings: AutoTypeSettings) {
  if (!settings.enabled) return;

  try {
    keyboard.config.autoDelayMs = settings.keypressDelay;

    // Type the entire barcode string
    await keyboard.type(code);

    // Optional delay before pressing the key after code
    if (settings.keypressDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, settings.keypressDelay));
    }

    // Press the configured key after typing
    const key = keyMap[settings.keyAfterCode];
    if (key) {
      await keyboard.type(key);
    }
  } catch (error) {
    console.error("Auto-type error:", error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the web app
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    // In production, the web app is in process.resourcesPath/app/
    const appPath = path.join(process.resourcesPath, "app", "index.html");
    mainWindow.loadFile(appPath);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle("auto-type", async (_event, code: string, settings: AutoTypeSettings) => {
  await autoTypeBarcode(code, settings);
});

ipcMain.handle("get-platform", () => {
  return process.platform;
});

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
  keyBetweenFields: string;
  keyAfterCode: string;
}

// Map common key names to nut.js Key enum
function getKeyFromString(keyName: string): Key | null {
  const normalized = keyName.toLowerCase().trim();
  const keyMap: Record<string, Key> = {
    enter: Key.Enter,
    return: Key.Enter,
    tab: Key.Tab,
    right: Key.Right,
    left: Key.Left,
    down: Key.Down,
    up: Key.Up,
    space: Key.Space,
    escape: Key.Escape,
    esc: Key.Escape,
  };
  return keyMap[normalized] || null;
}

async function autoTypeBarcode(
  code: string,
  settings: AutoTypeSettings,
  templateData?: Record<string, unknown>,
  fieldOrder?: string[],
) {
  if (!settings.enabled) return;

  try {
    keyboard.config.autoDelayMs = settings.keypressDelay;

    const keyBetweenFields = getKeyFromString(settings.keyBetweenFields || "Tab");
    const keyAfterRow = getKeyFromString(settings.keyAfterCode || "Enter");

    // If we have field order from template, type fields in order
    if (fieldOrder && fieldOrder.length > 0) {
      for (let i = 0; i < fieldOrder.length; i++) {
        const fieldName = fieldOrder[i];

        // Handle barcode placeholder
        if (fieldName === "__barcode") {
          await keyboard.type(code);
        } else {
          // Type template field value (or empty string if not present)
          const value = templateData?.[fieldName];
          if (value !== undefined && value !== null && value !== "") {
            await keyboard.type(String(value));
          }
          // If value is empty/null, we still press the key to move to next field
        }

        // Press the key between fields (except after last field)
        if (i < fieldOrder.length - 1 && keyBetweenFields) {
          if (settings.keypressDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, settings.keypressDelay));
          }
          await keyboard.type(keyBetweenFields);
        }
      }

      // Press the key after the entire row
      if (keyAfterRow) {
        if (settings.keypressDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, settings.keypressDelay));
        }
        await keyboard.type(keyAfterRow);
      }
    } else {
      // Fallback: just type the barcode (no template)
      await keyboard.type(code);

      if (settings.keypressDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, settings.keypressDelay));
      }

      if (keyAfterRow) {
        await keyboard.type(keyAfterRow);
      }
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
ipcMain.handle(
  "auto-type",
  async (
    _event,
    code: string,
    settings: AutoTypeSettings,
    templateData?: Record<string, unknown>,
    fieldOrder?: string[],
  ) => {
    await autoTypeBarcode(code, settings, templateData, fieldOrder);
  },
);

ipcMain.handle("get-platform", () => {
  return process.platform;
});

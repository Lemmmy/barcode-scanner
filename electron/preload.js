const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  autoType: (code, settings) => ipcRenderer.invoke("auto-type", code, settings),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
});

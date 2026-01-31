const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  autoType: (code, settings, templateData, fieldOrder) =>
    ipcRenderer.invoke("auto-type", code, settings, templateData, fieldOrder),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
});

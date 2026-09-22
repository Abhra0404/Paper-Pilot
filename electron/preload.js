const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectPDF: () => ipcRenderer.invoke("select-pdf"),

  extractPDFText: (filePath) =>
    ipcRenderer.invoke("extract-pdf-text", filePath),
});
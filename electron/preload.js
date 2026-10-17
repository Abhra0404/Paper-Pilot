const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectPDF: () => ipcRenderer.invoke("select-pdf"),

  extractPDFText: (filePath) =>
    ipcRenderer.invoke("extract-pdf-text", filePath),

  readPDF: (filePath) =>
    ipcRenderer.invoke("read-pdf", filePath),

  loadLibrary: () =>
    ipcRenderer.invoke("load-library"),

  storePDF: (filePath, paperId, fileName) =>
    ipcRenderer.invoke("store-pdf", filePath, paperId, fileName),

  deleteStoredPDF: (filePath) =>
    ipcRenderer.invoke("delete-stored-pdf", filePath),

  saveLibrary: (library) =>
    ipcRenderer.invoke("save-library", library),
});
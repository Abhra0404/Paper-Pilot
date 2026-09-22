import { app, BrowserWindow, ipcMain, dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    win.loadURL(devServerUrl);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

ipcMain.handle("select-pdf", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "PDF Files",
        extensions: ["pdf"],
      },
    ],
  });

  if (result.canceled) {
    return null;
  }

  const filePath = result.filePaths[0];

  return {
    name: path.basename(filePath),
    path: filePath,
  };
});

ipcMain.handle("extract-pdf-text", async (_, filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);

    const parser = new PDFParse({
      data: dataBuffer,
    });

    const result = await parser.getText();

    await parser.destroy();

    return {
      success: true,
      text: result.text,
      pages: result.total,
    };
  } catch (error) {
    console.error("PDF extraction error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
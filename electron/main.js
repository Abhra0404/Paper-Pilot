import { app, BrowserWindow, ipcMain, dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizePdfPath(filePath) {
  if (typeof filePath === "string") {
    return filePath;
  }

  if (filePath && typeof filePath === "object") {
    if (typeof filePath.path === "string") {
      return filePath.path;
    }

    if (typeof filePath.filePath === "string") {
      return filePath.filePath;
    }

    if (
      Array.isArray(filePath.filePaths) &&
      typeof filePath.filePaths[0] === "string"
    ) {
      return filePath.filePaths[0];
    }
  }

  throw new TypeError(
    "A PDF file path is required, but the renderer provided an invalid value."
  );
}

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

  return result.filePaths[0] ?? null;
});

ipcMain.handle("extract-pdf-text", async (_, filePathInput) => {
  let parser;

  try {
    const filePath = normalizePdfPath(filePathInput);
    const dataBuffer = fs.readFileSync(filePath);

    parser = new PDFParse({
      data: dataBuffer,
    });

    const result = await parser.getText();

    return {
      success: true,
      text: result.text,
      pages: result.total,

      // Important: preserve page boundaries
      pageTexts: result.pages.map((page) => ({
        pageNumber: page.num,
        text: page.text,
      })),
    };
  } catch (error) {
    console.error("PDF extraction error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract PDF text.",
    };
  } finally {
    await parser?.destroy();
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
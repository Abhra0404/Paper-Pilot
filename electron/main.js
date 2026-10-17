import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LIBRARY_FILE = "paperpilot-library.json";
const PAPERS_DIRECTORY = "paperpilot-papers";
let aiServiceProcess;

function getLibraryPath() {
  return path.join(app.getPath("userData"), LIBRARY_FILE);
}

function getPapersDirectory() {
  return path.join(app.getPath("userData"), PAPERS_DIRECTORY);
}

function getAiServiceDirectory() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", "ai-service")
    : path.join(__dirname, "../ai-service");
}

function getIconPath() {
  return app.isPackaged
    ? path.join(app.getAppPath(), "assets", "icons", "icon.png")
    : path.join(__dirname, "../assets/icons/icon.png");
}

function getPythonCommand() {
  if (process.platform === "win32") return "python";

  const candidates = [
    "/Library/Frameworks/Python.framework/Versions/Current/bin/python3",
    "/opt/homebrew/bin/python3",
    "/usr/local/bin/python3",
    "/usr/bin/python3",
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || "python3";
}

function startAiService() {
  if (process.env.VITE_DEV_SERVER_URL) return;

  const pythonCommand = getPythonCommand();
  const serviceDirectory = getAiServiceDirectory();
  const serviceLogPath = path.join(app.getPath("userData"), "ai-service.log");
  const serviceLog = fs.createWriteStream(serviceLogPath, { flags: "a" });
  aiServiceProcess = spawn(
    pythonCommand,
    ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
    {
      cwd: serviceDirectory,
      env: {
        ...process.env,
        PAPERPILOT_QDRANT_PATH: path.join(app.getPath("userData"), "qdrant"),
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

  aiServiceProcess.stdout.on("data", (data) => {
    const message = `PaperPilot AI service: ${data.toString()}`;
    console.log(message.trim());
    serviceLog.write(message);
  });
  aiServiceProcess.stderr.on("data", (data) => {
    const message = `PaperPilot AI service: ${data.toString()}`;
    console.error(message.trim());
    serviceLog.write(message);
  });
  aiServiceProcess.on("error", (error) => {
    console.error("PaperPilot AI service failed to start:", error);
    serviceLog.write(`PaperPilot AI service failed to start: ${error.stack || error}\n`);
  });
  aiServiceProcess.on("exit", (code, signal) => {
    serviceLog.end();
    if (code !== 0 && signal !== "SIGTERM") {
      console.error("PaperPilot AI service exited unexpectedly:", { code, signal });
    }
  });
}

function isPaperRecord(paper) {
  return (
    paper &&
    typeof paper.id === "string" &&
    typeof paper.name === "string" &&
    typeof paper.path === "string"
  );
}

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
  const iconPath = getIconPath();
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.on("did-fail-load", (_, errorCode, errorDescription, validatedURL) => {
    console.error("PaperPilot renderer failed to load:", {
      errorCode,
      errorDescription,
      validatedURL,
    });
  });

  win.webContents.on("render-process-gone", (_, details) => {
    console.error("PaperPilot renderer process exited:", details);
  });

  win.webContents.on("console-message", (_, level, message, line, sourceId) => {
    if (level >= 2) {
      console.error("PaperPilot renderer console error:", {
        message,
        line,
        sourceId,
      });
    }
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

  return filePath
    ? {
        filePath,
        fileName: path.basename(filePath),
      fileUrl: pathToFileURL(filePath).toString(),
    }
    : null;
});

ipcMain.handle("load-library", async () => {
  try {
    const contents = await fs.promises.readFile(getLibraryPath(), "utf8");
    const library = JSON.parse(contents);
    return Array.isArray(library) ? library.filter(isPaperRecord).slice(0, 10) : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    console.error("Library loading error:", error);
    throw new Error("Unable to load the paper library.", { cause: error });
  }
});

ipcMain.handle("store-pdf", async (_, filePathInput, paperId, fileName) => {
  try {
    const sourcePath = normalizePdfPath(filePathInput);
    if (typeof paperId !== "string" || !paperId) {
      throw new TypeError("A paper ID is required.");
    }

    const safeName = path.basename(fileName || path.basename(sourcePath));
    const storedPath = path.join(getPapersDirectory(), `${paperId}-${safeName}`);
    await fs.promises.mkdir(getPapersDirectory(), { recursive: true });
    await fs.promises.copyFile(sourcePath, storedPath);
    return storedPath;
  } catch (error) {
    console.error("PDF storage error:", error);
    throw new Error("Unable to store the selected paper.", { cause: error });
  }
});

ipcMain.handle("delete-stored-pdf", async (_, filePathInput) => {
  try {
    const filePath = normalizePdfPath(filePathInput);
    const papersDirectory = path.resolve(getPapersDirectory());
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(`${papersDirectory}${path.sep}`)) {
      throw new Error("Only library-managed PDF files can be removed.");
    }
    await fs.promises.rm(resolvedPath, { force: true });
  } catch (error) {
    console.error("Stored PDF removal error:", error);
    throw new Error("Unable to remove the stored paper.", { cause: error });
  }
});

ipcMain.handle("save-library", async (_, library) => {
  if (!Array.isArray(library) || library.length > 10) {
    throw new RangeError("The library can contain at most 10 papers.");
  }

  try {
    await fs.promises.mkdir(path.dirname(getLibraryPath()), { recursive: true });
    await fs.promises.writeFile(
      getLibraryPath(),
      JSON.stringify(library, null, 2),
      "utf8"
    );
    return true;
  } catch (error) {
    console.error("Library saving error:", error);
    throw new Error("Unable to save the paper library.", { cause: error });
  }
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

ipcMain.handle("read-pdf", async (_, filePathInput) => {
  try {
    const filePath = normalizePdfPath(filePathInput);
    return await fs.promises.readFile(filePath);
  } catch (error) {
    console.error("PDF preview error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to load the PDF preview.",
      { cause: error }
    );
  }
});

app.whenReady().then(() => {
  startAiService();
  createWindow();
});

app.on("window-all-closed", () => {
  if (aiServiceProcess && !aiServiceProcess.killed) {
    aiServiceProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (aiServiceProcess && !aiServiceProcess.killed) {
    aiServiceProcess.kill();
  }
});
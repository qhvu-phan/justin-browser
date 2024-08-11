const { app, BrowserWindow, session, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

app.on("ready", () => {
  app.commandLine.appendSwitch("ignore-certificate-errors", "true");
  app.commandLine.appendSwitch("disable-site-isolation-trials", "true");

  createWindow();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "src/preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webviewTag: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src/index.html"));

  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  mainWindow.webContents.session.on(
    "will-download",
    (event, item, webContents) => {
      const totalBytes = item.getTotalBytes();
      item.on("updated", (event, state) => {
        if (state === "progressing") {
          if (item.isPaused()) {
            mainWindow.webContents.send("download-progress", "Đã tạm dừng");
          } else {
            const receivedBytes = item.getReceivedBytes();
            const progress = Math.round((receivedBytes / totalBytes) * 100);
            mainWindow.webContents.send(
              "download-progress",
              `Đang tải xuống: ${progress}%`
            );
          }
        }
      });

      item.on("done", (event, state) => {
        if (state === "completed") {
          mainWindow.webContents.send("download-progress", "Tải xuống hoàn tất");
        } else {
          mainWindow.webContents.send("download-progress", `Tải xuống bị lỗi: ${state}`);
        }
      });
    }
  );
}

ipcMain.on("open-link-in-new-tab", (event, url) => {
  mainWindow.webContents.send("create-new-tab", url);
});

ipcMain.on("check-close-all-tabs", () => {
  clearAllBrowsingData();
});

app.on("before-quit", clearAllBrowsingData);

function clearAllBrowsingData() {
  const currentSession = session.defaultSession;

  // Clear all storage data
  currentSession
    .clearStorageData({
      storages: [
        "cookies",
        "localStorage",
        "sessionStorage",
        "caches",
        "indexdb",
        "websql",
        "serviceworkers",
      ],
    })
    .then(() => {
      console.log("All storage data cleared");
    })
    .catch((error) => {
      console.error("Failed to clear storage data:", error);
    });

  // Clear cache
  currentSession
    .clearCache()
    .then(() => {
      console.log("Cache cleared");
    })
    .catch((error) => {
      console.error("Failed to clear cache:", error);
    });

  // Clear authentication cache
  currentSession
    .clearAuthCache()
    .then(() => {
      console.log("Auth cache cleared");
    })
    .catch((error) => {
      console.error("Failed to clear auth cache:", error);
    });

  // Clear all data including cookies
  currentSession.cookies
    .get({})
    .then((cookies) => {
      cookies.forEach((cookie) => {
        let url = "";
        if (cookie.secure) {
          url += "https://";
        } else {
          url += "http://";
        }
        url += cookie.domain;
        url += cookie.path;
        currentSession.cookies.remove(url, cookie.name);
      });
      console.log("Cookies cleared");
    })
    .catch((error) => {
      console.error("Failed to clear cookies:", error);
    });
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

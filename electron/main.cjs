const { app, BrowserWindow } = require("electron");
const path = require("node:path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: "#1a1a1a",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // Appen laddas från lokala filer (file://); utan detta blockeras
      // script och css av webbläsarens säkerhetsregler.
      webSecurity: false,
    },
  });

  win.loadFile(path.join(__dirname, "..", "electron-app", "dist", "index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

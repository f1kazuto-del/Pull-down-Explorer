const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Pull-down Explorer"
  });

  // Create Menu
  const { Menu } = require('electron');
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [{ role: 'quit' }]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ]
    },
    {
      label: 'Updates',
      submenu: [
        {
          label: 'Check for Updates...',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify();
          }
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  // Check for updates automatically on start
  autoUpdater.checkForUpdatesAndNotify();

  // Start the backend server
  const isDev = !app.isPackaged;
  
  // Directly use the Electron executable as node
  const command = process.execPath;
  const args = [
    path.join(app.getAppPath(), 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    path.join(app.getAppPath(), 'server.ts')
  ];

  console.log(`Starting server...`);
  console.log(`App Path: ${app.getAppPath()}`);

  serverProcess = spawn(command, args, {
    env: { 
      ...process.env, 
      NODE_ENV: isDev ? 'development' : 'production', 
      PORT: '3000',
      ELECTRON_RUN_AS_NODE: '1' // Make electron act like node
    },
    shell: false,
    cwd: app.getAppPath()
  });

  let serverStarted = false;

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Server: ${output}`);
    if (output.includes('Server running') && !serverStarted) {
      serverStarted = true;
      mainWindow.loadURL('http://localhost:3000');
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

  // Fallback: if server doesn't report "running" within 10 seconds, try loading anyway
  setTimeout(() => {
    if (!serverStarted) {
      console.log("Fallback: Attempting to load URL after timeout...");
      mainWindow.loadURL('http://localhost:3000').catch(err => {
        console.error("Failed to load URL in fallback:", err);
      });
    }
  }, 10000);

  mainWindow.on('closed', function () {
    mainWindow = null;
    if (serverProcess) serverProcess.kill();
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

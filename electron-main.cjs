const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
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
      preload: path.join(__dirname, 'preload.cjs')
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

  // Start the loading screen
  mainWindow.loadFile(path.join(__dirname, 'loading.html'));

  // Start the backend server
  const isPackaged = app.isPackaged;
  
  // Directly use the Electron executable as node
  const command = process.execPath;
  let args;
  
  if (isPackaged) {
    // In production, we run the compiled server.cjs
    args = [path.join(app.getAppPath(), 'server.cjs')];
  } else {
    // In dev, we use tsx to run server.ts
    args = [
      path.join(app.getAppPath(), 'node_modules', 'tsx', 'dist', 'cli.mjs'),
      path.join(app.getAppPath(), 'server.ts')
    ];
  }

  console.log(`Starting server... Mode: ${isPackaged ? 'Production' : 'Development'}`);
  console.log(`Command: ${command}`);
  console.log(`Args: ${JSON.stringify(args)}`);

  serverProcess = spawn(command, args, {
    env: { 
      ...process.env, 
      NODE_ENV: isPackaged ? 'production' : 'development', 
      PORT: '3000',
      ELECTRON_RUN_AS_NODE: '1'
    },
    shell: false,
    cwd: app.getAppPath()
  });

  let serverStarted = false;

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Server] ${output}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error] ${data}`);
  });

  // Poll for server readiness via health check
  const checkServer = async () => {
    if (serverStarted) return;
    try {
      const { net } = require('electron');
      // Try 127.0.0.1 first, then localhost in the logs if it fails
      const request = net.request('http://127.0.0.1:3000/api/health');
      request.on('response', (response) => {
        if (response.statusCode === 200 && !serverStarted) {
          serverStarted = true;
          console.log("Backend confirmed healthy. Switching from loading screen.");
          mainWindow.loadURL('http://127.0.0.1:3000');
        }
      });
      request.on('error', (err) => {
        // console.log("Waiting for backend...");
      });
      request.end();
    } catch (e) {
      // Ignored
    }
  };

  const pollInterval = setInterval(checkServer, 1000);

  // Fallback: if server doesn't report "running" within 45 seconds, notify user
  setTimeout(() => {
    clearInterval(pollInterval);
    if (!serverStarted) {
      console.log("Startup Timeout: Could not connect to backend.");
      mainWindow.webContents.executeJavaScript(`
        document.body.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">' +
          '<h2>Backend connection timeout</h2>' +
          '<p>The server at 127.0.0.1:3000 is not responding.</p>' +
          '<button onclick="location.reload()" style="padding: 8px 16px; cursor: pointer;">Retry</button>' +
          '</div>';
      `).catch(() => {});
    }
  }, 45000);

  mainWindow.on('closed', function () {
    mainWindow = null;
    if (serverProcess) serverProcess.kill();
  });
}

app.on('ready', () => {
  // Handle File Drag and Drop to outside
  ipcMain.on('ondragstart', (event, fileName, filePath) => {
    // Start the native drag using a generic icon reference
    event.sender.startDrag({
      file: filePath,
      icon: path.join(__dirname, 'dist', 'favicon.ico')
    });
  });

  // Handle Opening Path with Default Application
  ipcMain.handle('open-path', async (event, filePath) => {
    try {
      const error = await shell.openPath(filePath);
      return { success: !error, error };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  createWindow();
});

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

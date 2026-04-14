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
    title: "Local File Explorer"
  });

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();

  // Start the backend server
  const isDev = !app.isPackaged;
  const serverPath = path.join(__dirname, isDev ? 'server.ts' : 'server.ts');
  
  // Use tsx for .ts files, or node if it was compiled (but we are shipping .ts)
  const command = isDev ? 'npx' : 'npx';
  const args = isDev ? ['tsx', 'server.ts'] : ['tsx', 'server.ts'];

  serverProcess = spawn(command, args, {
    env: { ...process.env, NODE_ENV: isDev ? 'development' : 'production' },
    shell: true,
    cwd: __dirname
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
    if (data.toString().includes('Server running')) {
      mainWindow.loadURL('http://localhost:3000');
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

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

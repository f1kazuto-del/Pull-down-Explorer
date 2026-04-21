const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startDrag: (fileName, filePath) => {
    ipcRenderer.send('ondragstart', fileName, filePath);
  },
  openPath: (filePath) => {
    return ipcRenderer.invoke('open-path', filePath);
  }
});

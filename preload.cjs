const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startDrag: (fileName, filePath) => {
    ipcRenderer.send('ondragstart', fileName, filePath);
  },
  openPath: (filePath) => {
    return ipcRenderer.invoke('open-path', filePath);
  },
  selectProgram: () => {
    return ipcRenderer.invoke('select-program');
  },
  openWithProgram: (filePath, programPath) => {
    return ipcRenderer.invoke('open-with-program', filePath, programPath);
  }
});

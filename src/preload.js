// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts



const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  download: (filename,hash) => ipcRenderer.invoke('download', filename, hash),
  upload: () => ipcRenderer.invoke('upload'),
  refresh: () => ipcRenderer.invoke('refresh'),
  // expose a callback method from main to rendererer. Main invoke the stub
  // renderer handle the stub
  refreshReturn: (callback) => ipcRenderer.on('refresh-return', callback)
})
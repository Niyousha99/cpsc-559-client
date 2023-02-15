const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');
const express = require('express')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // create a handler for ipc 'download'
  ipcMain.handle('download', (event, ip, filename) => download(ip, filename))
  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});



// open express server on port 8888
const server = express()
const port = 8888


// host all the files in ./upload on port 8888
server.use(express.static('upload'))
server.listen(port, () => {
  console.log(`Client software is accessible on port ${port}`)
})



const download = (ip, filename) => {
  // the destination file is ./download/<filename>
  const file = fs.createWriteStream(`./download/${filename}`);
  // request the file
  const request = http.get(`http://${ip}:8888/${filename}`, function (response) {
    // pipe the binary stream into the file
    response.pipe(file);
    // after download completed close filestream
    file.on("finish", () => {
      file.close();
      console.log("Download Completed");
    });
  });
  return "download started"
}

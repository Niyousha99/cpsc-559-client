const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');
const express = require('express')
const crypto = require("crypto")
require('dotenv').config()

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
app.on('ready', () => {
  createWindow();

  tracker_join();
});

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
  // fetch('http://localhost:3001/').then(response => response.json())
  // .then(data => console.log(data))
  // .catch(error => console.error(error));
});


// notify the tracker before quitting
app.on('before-quit', () => {
  tracker_exit();
});




// open express server on port 8888
const server = express()
const port = 8888

server.get('/test', (req, res) => {
  console.log("for testing")
  res.sendStatus(200).end();
})
// host all the files in ./upload on port 8888
server.use(express.static(path.join(__dirname, '../../', 'upload')))

server.listen(port, () => {
  console.log(`${__dirname}`)
  console.log(`Client software is accessible on port ${port}`)
})


const tracker_join = () => {
  // create timestamp
  // timestampe is the number of milliseconds elapsed since the epoch
  const message = { ip: "127.0.0.1", timestamp: Date.now() };
  // send post request to the tracker
  fetch(`http://${process.env.TRACKER_IP}:${process.env.TRACKER_PORT}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })
    .then(data => console.log(data))
    .catch(error => console.error(error));
}

const tracker_getFile = (filename, hash) => {
  // create timestamp
  // timestampe is the number of milliseconds elapsed since the epoch
  const message = { ip: "127.0.0.1", timestamp: Date.now(), "filename":filename, "hash":hash};
  // send post request to the tracker
  fetch(`http://${process.env.TRACKER_IP}:${process.env.TRACKER_PORT}/getFile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })
    .then(data => console.log(data))
    .catch(error => console.error(error));
}

const tracker_getFiles = () => {
    // create timestamp
  // timestampe is the number of milliseconds elapsed since the epoch
  const message = { ip: "127.0.0.1", timestamp: Date.now() };
  // send post request to the tracker
  fetch(`http://${process.env.TRACKER_IP}:${process.env.TRACKER_PORT}/getFiles`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })
    .then(data => console.log(data))
    .catch(error => console.error(error));
}

const tracker_upload = () => {
  const hashes = [];
  const upload_folder = path.join(__dirname, '../../', 'upload')

  fs.readdir(upload_folder, (error, files) => {
    if (error) console.log(error);

    let processedFiles = 0;

    files.forEach(filename => {
      console.log(filename);

      // get the sha256 hash of the file
      const sha256sum = crypto.createHash('sha256');
      const s = fs.createReadStream(path.join(upload_folder, filename));

      s.on('data', function (d) {
        sha256sum.update(d);
      });

      s.on('end', function () {
        const hash = sha256sum.digest('hex');
        hashes.push({ filename, hash });

        processedFiles++;
        if (processedFiles === files.length) {
          const message = { ip: "127.0.0.1", timestamp: Date.now(), files: hashes }
          fetch(`http://${process.env.TRACKER_IP}:${process.env.TRACKER_PORT}/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
          })
            .then(data => console.log(data))
            .catch(error => console.error(error));
        }
      });
    });
  });
}

const tracker_exit = () => {

  // create timestamp
  // timestampe is the number of milliseconds elapsed since the epoch
    const message = { ip: "127.0.0.1", timestamp: Date.now() };
    // send post request to the tracker
    fetch(`http://${process.env.TRACKER_IP}:${process.env.TRACKER_PORT}/exit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    })
      .then(data => console.log(data))
      .catch(error => console.error(error));
}

const download = (ip, filename) => {
  // the destination file is ./download/<filename>
  const file = fs.createWriteStream(path.join(__dirname, '../../', 'download', filename));
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

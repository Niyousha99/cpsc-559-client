const { app, BrowserWindow,  ipcMain } = require('electron');
const path = require('path');

const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');
const express = require('express')
const crypto = require("crypto");
const { response } = require('express');
require('dotenv').config()

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  ipcMain.handle('upload', (event, fileToUpload) => tracker_upload(fileToUpload))
  // create a handler for ipc 'download'
  ipcMain.handle('download', (event, filename, hash) => tracker_getFile(filename, hash))
  // create a handler for ipc 'refresh'
  ipcMain.handle('refresh', (event) => tracker_getFiles())
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
  tracker_upload(); // this only upload at start up
  tracker_getFiles();
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
});


// notify the tracker before quitting
app.on('before-quit', () => {
  tracker_exit();
});




// open express server on port 8888
const server = express()
const port = 8888

server.get('/test', (req, res) => {
  // console.log("for testing")
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
  const message = { timestamp: Date.now() };
  // send post request to the tracker
  fetch(`http://${process.env.TRACKER_IP}:${process.env.TRACKER_PORT}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })
    .catch(error => console.error(`Error on join: ${error}`));
}

const tracker_getFile = (filename, hash) => {
  // create timestamp
  // timestampe is the number of milliseconds elapsed since the epoch
  // const message = { timestamp: Date.now(), "filename": filename, "hash": hash };
  // send post request to the tracker
  // let peers;

  fetch(`http://${process.env.TRACKER_IP}:${process.env.TRACKER_PORT}/getFile?timestamp=${Date.now()}&filename=${filename}&hash=${hash}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  })
    .then(response => response.json())
    .then(data => {
      let peers = data.peers;
      download(peers[0].ip, filename)
    })
    .catch(error => console.error(error));

  // return peers;
}

const tracker_getFiles = () => {
  // create timestamp
  // timestampe is the number of milliseconds elapsed since the epoch
  // send post request to the tracker
  fetch(`http://${process.env.TRACKER_IP}:${process.env.TRACKER_PORT}/getFiles?timestamp=${Date.now()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  })
    .then(response => response.json())
    .then(data => {
      mainWindow.webContents.send('refresh-return', data)
    })
    .catch(error => console.error(`Error on getFiles: ${error}`));
}

const tracker_upload = (fileToUpload) => {
  upload(fileToUpload);
  const hashes = [];
  const upload_folder = path.join(__dirname, '../../', 'upload')

  // read files from the upload directory
  fs.readdir(upload_folder, (error, files) => {
    // if error, print error
    if (error) console.log(error);

    // count the number of files processed
    let processedFiles = 0;

    // for each file, calculate sha256 hash result
    files.forEach(filename => {
      // console.log(filename);
      // get the sha256 hash of the file
      const sha256sum = crypto.createHash('sha256');
      const s = fs.createReadStream(path.join(upload_folder, filename));
      const stats = fs.statSync(path.join(upload_folder, filename));
      // on each chunk, update the PRNG state
      s.on('data', function (d) {
        sha256sum.update(d);
      });

      // on finish, produce the PRNG result
      s.on('end', function () {
        const hash = sha256sum.digest('hex');
        hashes.push({ filename:filename, hash:hash, size:stats.size });
        processedFiles++;
        // if all files processed
        if (processedFiles === files.length) {
          // send post request to the tracker
          const message = { timestamp: Date.now(), files: hashes }
          fetch(`http://${process.env.TRACKER_IP}:${process.env.TRACKER_PORT}/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
          })
            .catch(error => console.error(`Error on Join: ${error}`));
        }
      });
    });
  });
}

const tracker_exit = () => {
  // create timestamp
  // timestampe is the number of milliseconds elapsed since the epoch
  const message = { timestamp: Date.now() };
  // send post request to the tracker
  fetch(`http://${process.env.TRACKER_IP}:${process.env.TRACKER_PORT}/exit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })
    .catch(error => console.error(error));
}

const upload = (file) => {
  console.log("file selected: " + file)
  if (!file) {
    console.error('No file selected');
    return;
  }
  const folderPath = path.join(__dirname, '../../', 'upload')

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  const filePath = folderPath + '/' + file.name;
  const reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = () => {
    const fileContent = reader.result;
    fs.writeFile(filePath, fileContent, (err) => {
      if (err) {
        console.error('Error writing file:', err);
      } else {
        console.log('File written to:', filePath);
      }
    });
  };    
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
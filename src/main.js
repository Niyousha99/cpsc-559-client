const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

const http = require('http'); // or 'https' for https:// URLs
const fs = require('fs');
const express = require('express')
const crypto = require("crypto");
const { response } = require('express');
require('dotenv').config()


const tracker_locations = require('./trackerAddress.js')
let current_tracker = 0

console.log(tracker_locations)
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

  ipcMain.handle('upload', (event, file) => {
    if (file) {
      const filename = file.name;
      const filepath = file.path;

      // Copying the file to the "upload" folder
      fs.copyFile(filepath, path.join(__dirname, '../../', 'upload', filename), (err) => {
        if (err) {
          console.log("Fail to upload/copy file:", err);
        }
        else {
          tracker_upload();
        }
      });
    }
    else {
      tracker_upload();
    }
  })

  // create a handler for ipc 'download'
  ipcMain.handle('download', (event, filename, hash) => tracker_getFile(filename, hash))
  // create a handler for ipc 'refresh'
  ipcMain.handle('refresh', (event) => tracker_getFiles())

  // ipcMain.handle('local_files', (event) => local_files())
  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// const local_files = () => {

// }


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();

  // tracker_join();
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

let asyncOperationDone = false
let quitDialog = false

// notify the tracker before quitting
app.on('before-quit', async (e) => {
  if (current_tracker == tracker_locations["trackers"].length && !quitDialog){
    e.preventDefault();
  }
  else if (current_tracker != tracker_locations["trackers"].length && !asyncOperationDone) {
    e.preventDefault();
    await tracker_exit();
    asyncOperationDone = true;
    console.log("async operation done, quitting");
    app.quit();
  }
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


const switch_tracker = (last) => {
  if (last == current_tracker) {

    current_tracker += 1
    if(current_tracker==tracker_locations["trackers"].length){

      dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['OK'],
        defaultId: 0,
        title: 'Network Down',
        message: `No current available trackers online`,
        detail: 'Exiting'
      }).then(()=>{
        quitDialog = true
        app.quit()
      });
    }
    else {   
      console.log(`Timeout - Tracker changed to ${current_tracker}`)
      // tracker_join()
      tracker_upload()

      dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['OK'],
        defaultId: 0,
        title: 'Tracker Switched',
        message: `Tracker-${last} did not respond, switched to Tracker-${current_tracker}`,
        detail: 'Press Rrefresh to see the changes'
      })
    }
    // current_tracker %= tracker_locations["trackers"].length
  }
  else {
    console.log(`Timeout - tracker already switched to ${current_tracker}`)
  }
}

const tracker_join = () => {
  // create timestamp
  // timestampe is the number of milliseconds elapsed since the epoch
  const message = { timestamp: Date.now() };

  let last = current_tracker;
  // send post request to the tracker
  const request = fetch(`http://${tracker_locations["trackers"][current_tracker]['ip']}:${tracker_locations["trackers"][current_tracker]['port']}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })
    .catch(error => () => { 
      console.error(`timeout on join`)
      switch_tracker(last)
   });

}

const tracker_getFile = (filename, hash) => {
  // create timestamp
  // timestampe is the number of milliseconds elapsed since the epoch
  // const message = { timestamp: Date.now(), "filename": filename, "hash": hash };
  // send post request to the tracker
  // let peers;
  let last = current_tracker

  fetch(`http://${tracker_locations["trackers"][current_tracker]['ip']}:${tracker_locations["trackers"][current_tracker]['port']}/getFile?timestamp=${Date.now()}&filename=${filename}&hash=${hash}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  })
    .then(response => response.json())
    .then(data => {
      let peers = data.peers;
      download(filename, peers, 0)
      
    })
    .catch(error => switch_tracker(last));

  // return peers;
}

const tracker_getFiles = () => {
  // create timestamp
  // timestampe is the number of milliseconds elapsed since the epoch
  // send post request to the tracker

  let last = current_tracker

  fetch(`http://${tracker_locations["trackers"][current_tracker]['ip']}:${tracker_locations["trackers"][current_tracker]['port']}/getFiles?timestamp=${Date.now()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
  })
    .then(response => response.json())
    .then(data => {
      mainWindow.webContents.send('refresh-return', data)
    })
    .catch(error => switch_tracker(last));
}

const tracker_upload = () => {
  const hashes = [];
  const upload_folder = path.join(__dirname, '../../', 'upload')

  let last = current_tracker
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
        hashes.push({ filename: filename, hash: hash, size: stats.size });
        processedFiles++;
        // if all files processed
        if (processedFiles === files.length) {
          // send post request to the tracker
          const message = { timestamp: Date.now(), files: hashes }
          fetch(`http://${tracker_locations["trackers"][current_tracker]['ip']}:${tracker_locations["trackers"][current_tracker]['port']}/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
          })
            .catch(error => switch_tracker(last));
        }
      });
    });
  });
}

const tracker_exit = async () => {
  // create timestamp
  // timestampe is the number of milliseconds elapsed since the epoch
  const message = { timestamp: Date.now() };
  // send post request to the tracker
  const response = await fetch(`http://${tracker_locations["trackers"][current_tracker]['ip']}:${tracker_locations["trackers"][current_tracker]['port']}/exit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })
  // // .then(response => console.log(response.json))
  .catch(error => console.error(error));
}

const download = (filename, peers, i) => {
  // the destination file is ./download/<filename>
  const file = fs.createWriteStream(path.join(__dirname, '../../', 'download', filename));
  // request the file
  
  const request = http.get(`http://${peers[i].ipAddress}:8888/${filename}`, function (response) {
    if(response.statusCode != 200){
      if(i==peers.length-1){
        dialog.showMessageBox(null, {
          type: 'info',
          buttons: ['OK'],
          defaultId: 0,
          title: `Fail to download ${filename}`,
          message: `${filename} - is not available`,
          // detail: 'Press Rrefresh to see the changes'
        });
        fs.rmSync(path.join(__dirname, '../../', 'download', filename), {
          force: true,
        });
      }
      else {
        download(filename, peers, i+1);
      }
    }
    else {
      // pipe the binary stream into the file
      response.pipe(file);
      // after download completed close filestream
      file.on("finish", () => {
        file.close();
        console.log("Download Completed");
      });
    }
  });
  return "download started"
}
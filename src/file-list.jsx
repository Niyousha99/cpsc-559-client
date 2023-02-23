import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Tooltip
} from "@material-ui/core";
import { GetApp as DownloadIcon } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    backgroundColor: theme.palette.background.paper,
  },
}));

const formatFileSize = (bytes) => {
  if(bytes == 0) return '0 Bytes';
  var k = 1000,
  sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
  i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const FileList = () => {
  const classes = useStyles();

  const [files, setFiles] = useState([])
  const [searchTerm, setSearchTerm] = useState("");

  const handleFileChange = (event) => {
    let uFile = {name:event.target.files[0].name,path:event.target.files[0].path}
    window.versions.upload(uFile);
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  window.versions.refreshReturn((_event, value) => {
    // upon tracker_getFiles return
    setFiles(value.files)
  })

  const filteredList = files.filter((file) => (file.filename + file.hash.slice(0, 5)).toLowerCase().includes(searchTerm.toLowerCase()));
 
  return (
    <div>
      <div>
        <h1>Available Files for Download</h1>
        <div>
        <TextField
          id="search"
          label="Search"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        </div>
       <div>
          {/* refresh button: get the list of all files from the trackers */}
          <Button style={{marginTop:'10px'}} variant="contained" color="primary" onClick={()=> window.versions.refresh()}>Refresh</Button>
        </div>
        <List className={classes.root}>
          { filteredList.map((file, index) => (
            <ListItem key={index}>
              <Tooltip title={file.filename + file.hash} placement="top">
              <ListItemText primary={file.filename + file.hash.slice(0, 5)} secondary={formatFileSize(file.size)} />
              </Tooltip>
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="download"
                  onClick={() => window.versions.download(file.filename, file.hash)}
                >
                  <DownloadIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </div>

      <div>
        <h1>My Files</h1>
        <div>
          <input type="file" onChange={handleFileChange}/>
        </div>

        <List className={classes.root}>
          { files.map((file, index) => (
            <ListItem key={index}>
              <Tooltip title={file.filename + file.hash} placement="top">
              <ListItemText primary={file.filename + file.hash.slice(0, 5)} secondary={formatFileSize(file.size)} />
              </Tooltip>
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="download"
                  onClick={() => window.versions.download(file.filename, file.hash)}
                >
                  <DownloadIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        <div>
          {/* upload button: upload all files in the "upload" directory */}
          <Button style={{margin:'10px', float:'right'}} variant="contained" color="primary" onClick={() => window.versions.upload()}>
            Upload
          </Button>
        </div>
      </div>



    </div>
  );
};

export default FileList;

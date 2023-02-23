import React, { useState, useEffect } from "react";
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  window.versions.refreshReturn((_event, value) => {
    console.log(value.files)
    console.log(typeof(value.files))
    setFiles(value.files)
  })

  const filteredList = files.filter((file) => (file.filename + file.hash.slice(0, 5)).toLowerCase().includes(searchTerm.toLowerCase()));
 
  return (
    <div>
      <TextField
        id="search"
        label="Search"
        variant="outlined"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <div>
        <input type="file" onChange={handleFileChange}/>
        <Button style={{margin:'10px'}} variant="contained" color="primary" onClick={() => window.versions.upload(selectedFile)}>
          Upload
        </Button>
        <Button variant="contained" color="primary" onClick={()=> window.versions.refresh()}>Refresh</Button>

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
  );
};

export default FileList;

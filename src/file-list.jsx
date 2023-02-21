import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button
} from "@material-ui/core";
import { GetApp as DownloadIcon } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    backgroundColor: theme.palette.background.paper,
  },
}));

// TODO dynamically get list of files from the tracker
// const fileList = [
//   { name: "sample.pdf", ip: "10.0.0.206", size: "10 KB" },
//   { name: "file2.txt", ip: "10.0.0.206", size: "15 KB" },
//   { name: "file3.txt", ip: "10.0.0.206", size: "20 KB" },
//   { name: "file4.txt", ip: "10.0.0.206", size: "25 KB" },
// ];

const FileList = () => {

  const [files, setFiles] = useState([])
  // const [filteredList, setFilteredList] = useState([])

  
  const classes = useStyles();
  const [searchTerm, setSearchTerm] = useState("");

  // const handleChange = (event) => {
  //   setSearchTerm(event.target.value);
  // };

  // useEffect(()=>{
  //   const temp = files.filter((file) =>
  //   file.name.toLowerCase().includes(searchTerm.toLowerCase()));
  //   setFilteredList(temp)
  // }, files)

  // const filteredList = 
  // );

  // const handleDownload = async (filename, ip) => {
  //   // ipc: inter process call.
  //   // React is running on the renderer process
  //   // File-downloader/uploader is running on the main process
  //   // renderer process calls 'download' handler in the main process (main.js)
  //   const response = await window.versions.download(ip, filename);
  //   // alert(response);
  // };

  window.versions.refreshReturn((_event, value) => {
    console.log(value.files)
    console.log(typeof(value.files))
    setFiles(value.files)
  })



  return (
    <div>
      <TextField
        id="search"
        label="Search"
        variant="outlined"
        value={searchTerm}
        // onChange={handleChange}
      />
      <Button style={{margin:'10px'}}variant="contained" color="primary" component="label">
      Upload
      <input hidden multiple type="file" />
      </Button>
      <Button variant="contained" color="primary" onClick={()=> window.versions.refresh()}>Refresh</Button>

      <List className={classes.root}>
        { files.map((file, index) => (
          <ListItem key={index}>
            <ListItemText primary={file.filename} secondary={file.hash} />
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

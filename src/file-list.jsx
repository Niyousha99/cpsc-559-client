import React, { useState } from "react";
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
const fileList = [
  { name: "sample.pdf", ip: "10.0.0.206", size: "10 KB" },
  { name: "file2.txt", ip: "10.0.0.206", size: "15 KB" },
  { name: "file3.txt", ip: "10.0.0.206", size: "20 KB" },
  { name: "file4.txt", ip: "10.0.0.206", size: "25 KB" },
];

const FileList = () => {
  const classes = useStyles();
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredList = fileList.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (filename, ip) => {
    // ipc: inter process call.
    // React is running on the renderer process
    // File-downloader/uploader is running on the main process
    // renderer process calls 'download' handler in the main process (main.js)
    const response = await window.versions.download(ip, filename);
    alert(response);
  };

  return (
    <div>
      <TextField
        id="search"
        label="Search"
        variant="outlined"
        value={searchTerm}
        onChange={handleChange}
      />
      <Button style={{margin:'10px'}}variant="contained" color="primary" component="label">
      Upload
      <input hidden multiple type="file" />
      </Button>
      <Button variant="contained" color="primary">Refresh</Button>

      <List className={classes.root}>
        {filteredList.map((file, index) => (
          <ListItem key={index}>
            <ListItemText primary={file.name} secondary={file.size} />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="download"
                onClick={() => handleDownload(file.name, file.ip)}
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

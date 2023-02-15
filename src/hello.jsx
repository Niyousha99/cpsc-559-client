import * as React from 'react';


function Hello(){
    const func = async () => {
        // get the peer's ip address
        const ip = document.getElementById('ip').value
        // get the filename 
        const filename = document.getElementById('filename').value

        // ipc: inter process call.
        // React is running on the renderer process
        // File-downloader/uploader is running on the main process
        // renderer process calls 'download' handler in the main process (main.js)
        const response = await window.versions.download(ip,filename)
        alert(response)
    }

      
    return (<div>
        <form>
            <label>IP</label>
            <input type="text" id="ip"></input>
            <label>Filename</label>
            <input type="text" id="filename"></input>
        </form>

        {/* <h1>Hello, testing React component here.</h1> */}
        <button onClick={()=>func()}>Download</button>
    </div>);
}

export default Hello;
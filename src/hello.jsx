import * as React from 'react';


function Hello(){

    return (<div>
        <form>
            <label>Filename</label>
            <input type="text" id="filename"></input>
        </form>

        <h1>Hello, testing React component here.</h1>
        <button onClick={()=>alert(document.getElementById("filename").value)}>Click</button>
    </div>);
}

export default Hello;
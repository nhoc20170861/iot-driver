import React from "react";

import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { Terminal } from "@xterm/xterm";
import { ESPLoader, FlashOptions, LoaderOptions, Transport } from "esptool-js";
import { serial } from "web-serial-polyfill";
if (!navigator.serial && navigator.usb) navigator.serial = serial;
let device = null;
let transport;
let chip = null;
let esploader;
const term = new Terminal({ cols: 120, rows: 40 });
let baudrates = document.getElementById("baudrates");
let consoleBaudrates = document.getElementById("consoleBaudrates");
let connectButton = document.getElementById("connectButton");
let traceButton = document.getElementById("copyTraceButton");
let disconnectButton = document.getElementById("disconnectButton");
let resetButton = document.getElementById("resetButton");
let consoleStartButton = document.getElementById("consoleStartButton");
let consoleStopButton = document.getElementById("consoleStopButton");
let eraseButton = document.getElementById("eraseButton");
let addFileButton = document.getElementById("addFile");
let programButton = document.getElementById("programButton");
let filesDiv = document.getElementById("files");
let terminal = document.getElementById("terminal");
let programDiv = document.getElementById("program");
let consoleDiv = document.getElementById("console");
let lblBaudrate = document.getElementById("lblBaudrate");
let lblConsoleBaudrate = document.getElementById("lblConsoleBaudrate");
let lblConsoleFor = document.getElementById("lblConsoleFor");
let lblConnTo = document.getElementById("lblConnTo");
let table = document.getElementById("fileTable");
let alertDiv = document.getElementById("alertDiv");

import configs from "configs";
async function getBinary(folderName, fileName = "target.bin") {
  const url = configs.WS_BASE_URL + `downloadBinary/${folderName}/${fileName}`;
  console.log("🚀 ~ getBinary ~ url:", url);
  const response = await axios.get(url, {
    responseType: "blob", //"arraybuffer",
  });
  // const fileData = Buffer.from(response.data, "binary");
  // console.log("🚀 ~ getBinary ~ fileData:", fileData);
  return response.data;
}

const TestTool = () => {
  React.useEffect(() => {
    baudrates = document.getElementById("baudrates");
    consoleBaudrates = document.getElementById("consoleBaudrates");
    connectButton = document.getElementById("connectButton");
    traceButton = document.getElementById("copyTraceButton");
    disconnectButton = document.getElementById("disconnectButton");
    resetButton = document.getElementById("resetButton");
    consoleStartButton = document.getElementById("consoleStartButton");
    consoleStopButton = document.getElementById("consoleStopButton");
    eraseButton = document.getElementById("eraseButton");
    addFileButton = document.getElementById("addFile");
    programButton = document.getElementById("programButton");
    filesDiv = document.getElementById("files");
    terminal = document.getElementById("terminal");
    programDiv = document.getElementById("program");
    consoleDiv = document.getElementById("console");
    lblBaudrate = document.getElementById("lblBaudrate");
    lblConsoleBaudrate = document.getElementById("lblConsoleBaudrate");
    lblConsoleFor = document.getElementById("lblConsoleFor");
    lblConnTo = document.getElementById("lblConnTo");
    table = document.getElementById("fileTable");
    alertDiv = document.getElementById("alertDiv");
  }, []);
  function handleFileSelect(evt) {
    const file = evt.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (ev) => {
      evt.target.data = ev.target.result;
    };

    reader.readAsBinaryString(file);
  }

  const toArrayBuffer = (inputFile) => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onerror = () => {
        reader.abort();
        reject(new DOMException("Problem parsing input file."));
      };

      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsBinaryString(inputFile);
    });
  };
  const espLoaderTerminal = {
    clean() {
      term.clear();
    },
    writeLine(data) {
      term.writeln(data);
      console.log(data);
    },
    write(data) {
      term.write(data);
    },
  };
  const connectButtonOnclick = async () => {
    if (device === null) {
      device = await navigator.serial.requestPort({});
      console.log("🚀 ~ connectButtonOnclick ~ device:", device);
      transport = new Transport(device, true);
    }

    try {
      const flashOptions = {
        transport,
        baudrate: parseInt(baudrates.value),
        terminal: espLoaderTerminal,
      };
      esploader = new ESPLoader(flashOptions);

      chip = await esploader.main_fn();

      // Temporarily broken
      // await esploader.flashId();
    } catch (e) {
      console.error(e);
      term.writeln(`Error: ${e.message}`);
    }

    console.log("Settings done for :" + chip);
    lblBaudrate.style.display = "none";
    lblConnTo.innerHTML = "Connected to device: " + chip;
    lblConnTo.style.display = "block";
    baudrates.style.display = "none";
    connectButton.style.display = "none";
    disconnectButton.style.display = "initial";
    traceButton.style.display = "initial";
    eraseButton.style.display = "initial";
    filesDiv.style.display = "initial";
  };

  const eraseButtonOnclick = async () => {
    eraseButton.disabled = true;
    try {
      await esploader.eraseFlash();
    } catch (e) {
      console.error(e);
      term.writeln(`Error: ${e.message}`);
    } finally {
      eraseButton.disabled = false;
    }
  };

  const addFileButtonOnclick = () => {
    const rowCount = table.rows.length;
    const row = table.insertRow(rowCount);

    //Column 1 - Offset
    const cell1 = row.insertCell(0);
    const element1 = document.createElement("input");
    element1.type = "text";
    element1.id = "offset" + rowCount;
    element1.value = "0x1000";
    cell1.appendChild(element1);

    // Column 2 - File selector
    const cell2 = row.insertCell(1);
    const element2 = document.createElement("input");
    element2.type = "file";
    element2.id = "selectFile" + rowCount;
    element2.name = "selected_File" + rowCount;
    element2.addEventListener("change", handleFileSelect, false);
    cell2.appendChild(element2);

    // Column 3  - Progress
    const cell3 = row.insertCell(2);
    cell3.classList.add("progress-cell");
    cell3.style.display = "none";
    cell3.innerHTML = `<progress value="0" max="100"></progress>`;

    // Column 4  - Remove File
    const cell4 = row.insertCell(3);
    cell4.classList.add("action-cell");
    if (rowCount > 1) {
      const element4 = document.createElement("input");
      element4.type = "button";
      const btnName = "button" + rowCount;
      element4.name = btnName;
      element4.setAttribute("class", "btn");
      element4.setAttribute("value", "Remove"); // or element1.value = "button";
      element4.onclick = function () {
        removeRow(row);
      };
      cell4.appendChild(element4);
    }
  };

  function removeRow(row) {
    const rowIndex = Array.from(table.rows).indexOf(row);
    table.deleteRow(rowIndex);
  }

  /**
   * Clean devices variables on chip disconnect. Remove stale references if any.
   */
  function cleanUp() {
    device = null;
    transport = null;
    chip = null;
  }

  const disconnectButtonOnclick = async () => {
    if (transport) await transport.disconnect();

    term.reset();
    lblBaudrate.style.display = "initial";
    baudrates.style.display = "initial";
    consoleBaudrates.style.display = "initial";
    connectButton.style.display = "initial";
    disconnectButton.style.display = "none";
    traceButton.style.display = "none";
    eraseButton.style.display = "none";
    lblConnTo.style.display = "none";
    filesDiv.style.display = "none";
    alertDiv.style.display = "none";
    consoleDiv.style.display = "initial";
    cleanUp();
  };

  function validateProgramInputs() {
    const offsetArr = [];
    const rowCount = table.rows.length;
    let row;
    let offset = 0;
    let fileData = null;

    // check for mandatory fields
    for (let index = 1; index < rowCount; index++) {
      row = table.rows[index];

      //offset fields checks
      const offSetObj = row.cells[0].childNodes[0];
      offset = parseInt(offSetObj.value);

      // Non-numeric or blank offset
      if (Number.isNaN(offset))
        return "Offset field in row " + index + " is not a valid address!";
      // Repeated offset used
      else if (offsetArr.includes(offset))
        return "Offset field in row " + index + " is already in use!";
      else offsetArr.push(offset);

      const fileObj = row.cells[1].childNodes[0];
      fileData = fileObj.data;
      if (fileData == null) return "No file selected for row " + index + "!";
    }
    return "success";
  }

  const programButtonOnclick = async () => {
    const alertMsg = document.getElementById("alertmsg");
    const err = validateProgramInputs();
    console.log("🚀 ~ programButtonOnclick ~ err:", err);

    if (err != "success") {
      alertMsg.innerHTML = "<strong>" + err + "</strong>";
      alertDiv.style.display = "block";
      return;
    }

    // Hide error message
    alertDiv.style.display = "none";

    const fileArray = [];
    const progressBars = [];

    for (let index = 1; index < table.rows.length; index++) {
      const row = table.rows[index];

      const offSetObj = row.cells[0].childNodes[0];
      console.log(
        "🚀 ~ programButtonOnclick ~ offSetObj.value:",
        offSetObj.value
      );
      const offset = parseInt(offSetObj.value);

      const fileObj = row.cells[1].childNodes[0];
      const progressBar = row.cells[2].childNodes[0];

      progressBar.textContent = "0";
      progressBars.push(progressBar);

      row.cells[2].style.display = "initial";
      row.cells[3].style.display = "none";

      fileArray.push({ data: fileObj.data, address: offset });
      console.log("🚀 ~ programButtonOnclick ~ fileArray:", fileArray);
    }

    try {
      console.log("🚀 ~ programButtonOnclick ~ progress:");

      const fileInfo = await getBinary("Ver1_21_07", "target.bin");
      console.log("🚀 ~ programOneBinary ~ fileInfo:", fileInfo);
      const contents = await toArrayBuffer(fileInfo);
      const newFileArray = [];
      newFileArray.push({ data: contents, address: parseInt("0x0000") });
      console.log("🚀 ~ programButtonOnclick ~ newFileArray:", newFileArray);
      const flashOptions = {
        fileArray: newFileArray,
        flashSize: "keep",
        eraseAll: false,
        compress: true,
        reportProgress: (fileIndex, written, total) => {
          const progress = (written / total) * 100;
          if (progress == 100)
            console.log("🚀 ~ programButtonOnclick ~ progress:", progress);
          progressBars[fileIndex].value = progress;
        },
        // calculateMD5Hash: (image) =>
        //   CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)),
      };
      await esploader.write_flash(flashOptions);
    } catch (e) {
      console.error(e);
      term.writeln(`Error: ${e.message}`);
    } finally {
      // Hide progress bars and show erase buttons
      for (let index = 1; index < table.rows.length; index++) {
        table.rows[index].cells[2].style.display = "none";
        table.rows[index].cells[3].style.display = "initial";
      }
    }
  };

  return (
    <>
      <div className="container" id="main">
        <div id="program">
          <h3> Program </h3>

          <label htmlFor="baudrates" id="lblBaudrate">
            Baudrate:
          </label>
          <label style={{ display: "none" }} id="lblConnTo">
            Connected to device:{" "}
          </label>
          <select name="baudrates" id="baudrates">
            <option value="921600">921600</option>
            <option value="460800">460800</option>
            <option value="230400">230400</option>
            <option value="115200">115200</option>
          </select>

          <br></br>

          <input
            className="btn btn-info btn-sm"
            type="button"
            id="connectButton"
            value="Connect"
            onClick={connectButtonOnclick}
          />
          <input
            className="btn btn-info btn-sm"
            type="button"
            id="copyTraceButton"
            value="Copy Trace"
          />
          <input
            className="btn btn-warning btn-sm"
            type="button"
            id="disconnectButton"
            value="Disconnect"
            onClick={disconnectButtonOnclick}
          />
          <input
            className="btn btn-danger btn-sm"
            type="button"
            id="eraseButton"
            value="Erase Flash"
          />
          <br />

          <div
            className="alert alert-danger alert-dismissible"
            id="alertDiv"
            style={{ display: "none", marginTop: "10px" }}
          >
            <a
              href="#"
              className="close"
              aria-label="close"
              //onClick="$('.alert').hide()"
            >
              &times;
            </a>
            <span id="alertmsg"></span>
          </div>

          <div id="files">
            <table className="table table-striped" id="fileTable">
              <thead className="thead-light">
                <tr>
                  <th>Flash Address</th>
                  <th>File</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="tableBody"></tbody>
            </table>
            <input
              className="btn btn-info btn-sm"
              type="button"
              id="addFile"
              value="Add File"
              onClick={addFileButtonOnclick}
            />
            <input
              className="btn btn-info btn-sm"
              type="button"
              id="programButton"
              value="Program"
              onClick={programButtonOnclick}
            />
          </div>
          <output id="list"></output>
        </div>
        <div id="terminal"></div>
      </div>
    </>
  );
};
export default TestTool;

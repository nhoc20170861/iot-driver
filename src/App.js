import React, { useEffect } from "react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import Header from "./components/Header";
import Home from "./components/Home";
import FileList from "./components/FileList";
import Buttons from "./components/Buttons";
import Settings from "./components/Settings";
import ConfirmWindow from "./components/ConfirmWindow";
import axios from "axios";
import Container from "@mui/material/Container";
import BasicTabs from "./components/BasicTabs";
import TestTool from "TestTool";
import { ESPLoader, Transport } from "esptool-js";
import { serial } from "web-serial-polyfill";
import { Terminal } from "@xterm/xterm";
if (!navigator.serial && navigator.usb) navigator.serial = serial;

import {
  connectESP,
  formatMacAddr,
  sleep,
  loadFiles,
  supported,
} from "./lib/esp";
import { loadSettings, defaultSettings } from "./lib/settings";
import configs from "configs";
import "../node_modules/@xterm/xterm/css/xterm.css";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getBinary(folderName, fileName = "target.bin") {
  const url = configs.WS_BASE_URL + `downloadBinary/${folderName}/${fileName}`;
  console.log("🚀 ~ getBinary ~ url:", url);
  const response = await axios.get(url, {
    responseType: "blob",
  });
  return response.data;
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

const xTerm = new Terminal({ rows: 20 });
xTerm.options = {
  lineHeight: 1,
  fontFamily: "Courier New",
  //logLevel: "debug",
};
const App = () => {
  const [connected, setConnected] = React.useState(false); // Connection status
  const [connecting, setConnecting] = React.useState(false);
  const [output, setOutput] = React.useState({
    time: new Date(),
    value: "...",
  }); // Serial output
  const [espStub, setEspStub] = React.useState(undefined); // ESP flasher stuff
  const [uploads, setUploads] = React.useState([]); // Uploaded Files
  const [settingsOpen, setSettingsOpen] = React.useState(false); // Settings Window
  const [settings, setSettings] = React.useState({ ...defaultSettings }); // Settings
  const [confirmErase, setConfirmErase] = React.useState(false); // Confirm Erase Window
  const [confirmProgram, setConfirmProgram] = React.useState(false); // Confirm Flash Window
  const [flashing, setFlashing] = React.useState(false); // Enable/Disable buttons

  const [espInfo, setEspInfo] = React.useState({
    device: undefined,
    transport: undefined,
    chip: undefined,
    esploader: undefined,
  });

  const [binaryUpload, setbinaryUpload] = React.useState({
    folderBin: "",
    fileName: "target.bin",
  }); // Uploaded Files

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Add new message to output
  const addOutput = (msg) => {
    setOutput({
      time: new Date(),
      value: `${msg}\n`,
    });
  };

  React.useEffect(() => {
    const terminal = document.getElementById("terminal");
    xTerm.open(terminal);
  }, []);

  const espLoaderTerminal = {
    clean() {
      xTerm.clear();
    },
    writeLine(data) {
      xTerm.writeln(data);
      addOutput(data);
      // console.log(data);
    },
    write(data) {
      xTerm.write(data);
    },
  };

  // Connect to ESP & init flasher stuff

  navigator.serial.addEventListener("disconnect", async (event) => {
    console.log("🚀 ~ navigator.serial.addEventListener ~ disconnect:");
    if (espInfo.transport) {
      setEspInfo({
        device: undefined,
        transport: undefined,
        chip: undefined,
        esploader: undefined,
      });
      setConnected(false);
      setConnecting(false);
      xTerm.clear();
    }
  });
  const clickConnect = async () => {
    let newDevice, newTransport, newChip, newEspLoader;
    if (!espInfo.device) {
      newDevice = await navigator.serial.requestPort({});
      newTransport = new Transport(newDevice, true);
    }

    try {
      const flashOptions = {
        transport: newTransport,
        baudrate: parseInt(settings.baudRate),
        terminal: espLoaderTerminal,
      };
      setConnecting(true);
      toast.info("Connecting...", {
        position: "top-center",
        autoClose: false,
        toastId: "connecting",
      });
      toast.update("connecting", {
        render: "Connecting...",
        type: toast.TYPE.INFO,
        autoClose: false,
      });
      newEspLoader = new ESPLoader(flashOptions);

      newChip = await newEspLoader.main_fn();
      setEspInfo({
        device: newDevice,
        transport: newTransport,
        chip: newChip,
        esploader: newEspLoader,
      });
      setConnected(true);
      toast.update("connecting", {
        render: "Connected 🚀",
        type: toast.TYPE.SUCCESS,
        autoClose: 3000,
      });

      // Temporarily broken
      // await esploader.flashId();
    } catch (e) {
      console.error(e);
      addOutput(`Error: ${e.message}`);
    }
  };

  const programOneBinary = async () => {
    xTerm.clear();
    setConfirmProgram(false);
    setFlashing(true);

    //  let success = false;
    console.log("🚀 ~ programOneBinary ~ binaryUpload:", binaryUpload);
    if (!binaryUpload.folderBin) {
      toast.error(`Must select version image ...`, {
        position: "top-center",
        toastId: "upload_fail",
        autoClose: 3000,
      });
      setFlashing(false);
      return;
    }
    toast(`Uploading version ${binaryUpload.folderBin} ...`, {
      position: "top-center",
      progress: 0,
      toastId: "upload",
    });

    try {
      const fileInfo = await getBinary(
        binaryUpload.folderBin,
        binaryUpload.fileName
      );

      const contents = await toArrayBuffer(fileInfo);
      let eraseAll = false;
      let offset = "";
      if (binaryUpload.fileName === "target.bin") {
        eraseAll = true;
        offset = "0x0000";
      } else if (binaryUpload.fileName === "firmware.bin") {
        offset = "0x10000";
      }

      const newFileArray = [];
      newFileArray.push({ data: contents, address: parseInt(offset) });

      const flashOptions = {
        fileArray: newFileArray,
        flashSize: "keep",
        eraseAll: eraseAll,
        compress: true,
        reportProgress: (fileIndex, written, total) => {
          const progress = written / total;
          toast.update("upload", { progress: progress });
          if (progress >= 100) {
            addOutput(`Done!`);
            addOutput(`To run the new firmware please reset your device.`);

            toast.success("Done! Reset ESP to run new firmware.", {
              position: "top-center",
              toastId: "uploaded",
              autoClose: 3000,
            });
          }
        },
        // calculateMD5Hash: (image) =>
        //   CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)),
      };

      await espInfo.esploader.write_flash(flashOptions);
    } catch (e) {
      addOutput(`ERROR!`);
      addOutput(`${e}`);
      console.error(e);
    }
    setFlashing(false);
  };

  const eraseButtonOnclick = async () => {
    setConfirmErase(false);
    setFlashing(true);
    try {
      toast(`Erasing flash memory. Please wait...`, {
        position: "top-center",
        toastId: "erase",
        autoClose: false,
      });
      await espInfo.esploader.erase_flash();
      toast.update("erase", {
        render: "Finished erasing memory.",
        type: toast.TYPE.INFO,
        autoClose: 2000,
      });
      await delay(2000);
      disconnectButtonOnclick();
    } catch (e) {
      console.error(e);
      addOutput(`ERROR!\n${e}`);
      toast.update("erase", {
        render: `ERROR!\n${e}`,
        type: toast.TYPE.ERROR,
        autoClose: 3000,
      });
    } finally {
      setConfirmErase(false);
    }
  };

  const disconnectButtonOnclick = async () => {
    if (espInfo.transport) {
      await espInfo.transport.disconnect();
      setEspInfo({
        device: undefined,
        transport: undefined,
        chip: undefined,
        esploader: undefined,
      });
      setConnected(false);
      setConnecting(false);
      xTerm.clear();
    }
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Toaster */}
      <ToastContainer />
      <Header sx={{ mb: "1rem" }} />
      <Grid sx={{ flexGrow: 1 }} container spacing={2}>
        <Grid item xs={4}>
          <BasicTabs
            setbinaryUpload={setbinaryUpload}
            binaryUpload={binaryUpload}
          >
            {/* <FileList
              uploads={uploads}
              setUploads={setUploads}
              chipName={chipName}
            /> */}
          </BasicTabs>
        </Grid>

        <Grid item xs={8}>
          <div
            style={{
              display: "flex",
              padding: "0 24px 0 24px",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1, width: "100%" }}>
              {!connected && !connecting && (
                <Home
                  connect={clickConnect}
                  supported={supported}
                  openSettings={() => setSettingsOpen(true)}
                />
              )}
              {!connected && connecting && (
                <Grid item p="0 24px 0 24px">
                  <Typography
                    variant="h3"
                    component="h2"
                    sx={{ color: "#aaa" }}
                  >
                    Connecting...
                  </Typography>
                </Grid>
              )}

              {/* Erase & Program Buttons */}
              {connected && (
                <Grid item p="0 24px 0 24px">
                  <Buttons
                    erase={() => setConfirmErase(true)}
                    program={() => setConfirmProgram(true)}
                    disconnect={disconnectButtonOnclick}
                    disabled={flashing}
                  />
                </Grid>
              )}
            </div>
            <div style={{ flex: 1, width: "100%" }}>
              {/* Serial Output */}
              {supported() && (
                <div id="terminal" style={{ marginTop: "10px" }}></div>
              )}
            </div>
          </div>
        </Grid>
      </Grid>

      <Container maxWidth="sm">
        {/* Settings Window */}
        <Settings
          open={settingsOpen}
          close={() => setSettingsOpen(false)}
          setSettings={setSettings}
          settings={settings}
          connected={connected}
        />
      </Container>

      {/* Confirm Erase Window */}
      <ConfirmWindow
        open={confirmErase}
        text={"This will erase the memory of your ESP."}
        onOk={eraseButtonOnclick}
        onCancel={() => setConfirmErase(false)}
      />

      {/* Confirm Flash/Program Window */}
      <ConfirmWindow
        open={confirmProgram}
        text={"Flashing new firmware will override the current firmware."}
        onOk={programOneBinary}
        onCancel={() => setConfirmProgram(false)}
      />

      {/* <TestTool></TestTool> */}
    </div>
  );
};

export default App;

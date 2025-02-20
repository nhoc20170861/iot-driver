import React, { useEffect, createContext } from "react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import Header from "./components/Header";
import Home from "./components/Home";
import Buttons from "./components/Buttons";
import Settings from "./components/Settings";
import ConfirmWindow from "./components/ConfirmWindow";
import axios from "axios";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import BasicTabs from "./components/BasicTabs";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";

import { Card, CardHeader, CardBody, Row, Col, Media } from "reactstrap";

import { styled } from "@mui/material/styles";

import { ESPLoader, Transport } from "esptool-js";
import { serial } from "web-serial-polyfill";
import { Terminal } from "@xterm/xterm";
import "../node_modules/@xterm/xterm/css/xterm.css";

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
import { getListDevices, downloadBinary } from "network/ApiAxios";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const resetTransport = async (transport) => {
  await transport.device.setSignals({
    dataTerminalReady: false,
    requestToSend: true,
  });
  await delay(250);
  await transport.device.setSignals({
    dataTerminalReady: false,
    requestToSend: false,
  });
  await delay(250);
};
async function getBinary(esp32Version, folderName, fileName = "target.bin") {
  const requestBoday = { esp32Version, folderName, fileName };

  try {
    const data = await downloadBinary(requestBoday);
    return data;
  } catch (error) {
    console.log("🚀 ~ getBinary ~ error:", error);
    toast.error(`File not found!!!`, {
      position: "top-center",
      toastId: "download_fail",
      autoClose: 3000,
    });
    return null;
  }
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
  logLevel: "debug",
};

const StyledBadge = styled(Badge)(({ theme }) => {
  const style = {
    "& .MuiBadge-badge": {
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      "&::after": {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        animation: "ripple 1.2s infinite ease-in-out",
        border: "1px solid currentColor",
        content: '""',
      },
    },
    "@keyframes ripple": {
      "0%": {
        transform: "scale(.8)",
        opacity: 1,
      },
      "100%": {
        transform: "scale(2.4)",
        opacity: 0,
      },
    },
  };
  return style;
});

const App = () => {
  const [connected, setConnected] = React.useState(false); // Connection status
  const [connecting, setConnecting] = React.useState(false);

  const [settingsOpen, setSettingsOpen] = React.useState(false); // Settings Window
  const [settings, setSettings] = React.useState({ ...defaultSettings }); // Settings
  const [confirmErase, setConfirmErase] = React.useState(false); // Confirm Erase Window
  const [confirmProgram, setConfirmProgram] = React.useState(false); // Confirm Flash Window
  const [flashing, setFlashing] = React.useState(false); // Enable/Disable buttons
  const [esp32Version, setEsp32Version] = React.useState(""); // Enable/Disable buttons

  const [loading, setLoading] = React.useState(true);
  const [deviceList, setDeviceList] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getListDevices();
        setDeviceList(data.devices);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const [espInfo, setEspInfo] = React.useState({
    device: undefined,
    transport: undefined,
    chip: undefined,
    esploader: undefined,
  });

  const [binaryUpload, setbinaryUpload] = React.useState({
    folderContain: "",
    fileName: "target.bin",
  }); // Uploaded Files

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

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
    },
    write(data) {
      xTerm.write(data);
    },
  };

  const handleBtnSlectEspVersion = (key) => {
    const url = location.pathname + key;
    setEsp32Version(key);
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

    try {
      if (!espInfo.device) {
        newDevice = await navigator.serial.requestPort({});
        newTransport = new Transport(newDevice, true);
      }
      const flashOptions = {
        transport: newTransport,
        baudrate: parseInt(settings.baudRate),
        terminal: espLoaderTerminal,
        enableTracing: false,
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

      newChip = await newEspLoader.main();
      // Temporarily broken
      await newEspLoader.flashId();

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
    } catch (e) {
      console.error(e);
    }
  };

  const programOneBinary = async () => {
    xTerm.clear();
    setConfirmProgram(false);
    setFlashing(true);

    //  let success = false;
    console.log("🚀 ~ programOneBinary ~ binaryUpload:", binaryUpload);
    if (!binaryUpload.folderContain) {
      toast.error(`Must select version image ...`, {
        position: "top-center",
        toastId: "upload_fail",
        autoClose: 3000,
      });
      setFlashing(false);
      return;
    }

    try {
      const fileInfo = await getBinary(
        esp32Version,
        binaryUpload.folderContain,
        binaryUpload.fileName
      );
      if (!fileInfo) {
        delay(2000);
        disconnectButtonOnclick();
        return;
      }

      console.log("🚀 ~ programOneBinary ~ fileInfo:", fileInfo);
      const contents = await toArrayBuffer(fileInfo);
      let eraseAll = false;
      let offset = "";
      if (binaryUpload.fileName === "target.bin") {
        eraseAll = true;
        console.log("🚀 ~ programOneBinary ~ eraseAll:", eraseAll);
        offset = "0x0000";

        toast.warn(`Waiting to Erasing flash before flashing all...`, {
          position: "top-center",
          toastId: "notify_erasing",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        await espInfo.esploader.eraseFlash();
      } else if (binaryUpload.fileName === "firmware.bin") {
        offset = "0x10000";
      }

      toast(`Uploading version ${binaryUpload.folderContain} ...`, {
        position: "top-center",
        progress: 0,
        toastId: "upload",
      });

      const newFileArray = [];
      newFileArray.push({ data: contents, address: parseInt(offset) });

      const flashOptions = {
        fileArray: newFileArray,
        flashSize: "keep",
        flashMode: "keep",
        flashFreq: "keep",
        eraseAll: false,
        compress: true,
        reportProgress: (fileIndex, written, total) => {
          const progress = written / total;
          toast.update("upload", { progress: progress });
          if (progress >= 1) {
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

      await espInfo.esploader.writeFlash(flashOptions);
      delay(2000);
      disconnectButtonOnclick();
    } catch (e) {
      console.error(e);
      const currTransport = espInfo.transport;
      await resetTransport(currTransport);
      await currTransport.disconnect();
    }
    setFlashing(false);
  };

  const eraseButtonOnclick = async () => {
    setConfirmErase(false);
    setFlashing(true);
    try {
      toast.warning(`Erasing flash memory. Please wait...`, {
        position: "top-center",
        toastId: "erase_flash",
        autoClose: false,
      });
      await espInfo.esploader.eraseFlash();
      toast.update("erase_flash", {
        render: "Finished erasing memory.",
        type: toast.TYPE.SUCCESS,
        autoClose: 2000,
      });

      await delay(1000);
      // disconnectButtonOnclick();
    } catch (e) {
      console.error(e);
      toast.update("erase", {
        render: `ERROR!\n${e}`,
        type: toast.TYPE.ERROR,
        autoClose: 3000,
      });
    } finally {
      setFlashing(false);
    }
  };

  const disconnectButtonOnclick = async () => {
    if (espInfo.transport) {
      const currTransport = espInfo.transport;
      await resetTransport(currTransport);
      await currTransport.disconnect();

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

  const renderListDevice = (input) => {
    return (
      <Grid
        container
        rowSpacing={1}
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
      >
        {deviceList.map((device, index) => {
          return (
            <Grid
              item
              xs={12}
              key={index}
              style={{ width: "100%", padding: "8px" }}
            >
              <Button
                variant="outlined"
                fullWidth
                onClick={(e) => handleBtnSlectEspVersion(device.chipType)}
              >
                <Stack
                  style={{
                    display: "flex",
                    width: "100%",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <StyledBadge
                      overlap="circular"
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      color={device.isConnected ? "success" : "error"}
                      variant="dot"
                    >
                      <Avatar
                        alt={index}
                        src={device.srcImage}
                        sx={{ width: 50, height: 50 }}
                      />
                    </StyledBadge>
                  </div>

                  <span
                    style={{
                      flex: 2,
                      display: "flex",
                    }}
                  >
                    {device.deviceName + " (" + device.chipType + ")"}
                  </span>
                </Stack>
              </Button>
            </Grid>
          );
        })}
      </Grid>
    );
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
          {esp32Version != "" ? (
            <BasicTabs
              setbinaryUpload={setbinaryUpload}
              binaryUpload={binaryUpload}
              esp32Version={esp32Version}
              setEsp32Version={setEsp32Version}
            ></BasicTabs>
          ) : (
            <Card className="shadow">
              <CardHeader className="bg-transparent">
                <Typography
                  variant="h5"
                  component="h5"
                  sx={{ color: "black", paddingLeft: "5px" }}
                >
                  Các phiên bản sản phẩm
                </Typography>
              </CardHeader>
              <CardBody>
                {loading ? <CircularProgress /> : renderListDevice(deviceList)}
              </CardBody>
            </Card>
          )}
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
    </div>
  );
};

export default App;

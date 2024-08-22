import React, { useEffect, createContext } from "react";

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
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import BasicTabs from "./components/BasicTabs";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";

import { ESPLoader, Transport } from "esptool-js";
import { serial } from "web-serial-polyfill";
import { Terminal } from "@xterm/xterm";

import { Card, CardHeader, CardBody, Row, Col, Media } from "reactstrap";
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

async function getBinary(esp32Version, folderName, fileName = "target.bin") {
  const url = configs.WS_BASE_URL + `downloadBinary`;
  const data = { esp32Version, folderName, fileName };
  console.log("🚀 ~ getBinary ~ url:", data);
  const response = await axios.post(url, data, {
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
  logLevel: "debug",
};

const StyledBadge = styled(Badge)(({ theme }) => {
  console.log("🚀 ~ file: index.js:41 ~ theme:", theme.palette);
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

export const RosContext = createContext("RosHandle");
const App = () => {
  const [connected, setConnected] = React.useState(false); // Connection status
  const [connecting, setConnecting] = React.useState(false);

  const [settingsOpen, setSettingsOpen] = React.useState(false); // Settings Window
  const [settings, setSettings] = React.useState({ ...defaultSettings }); // Settings
  const [confirmErase, setConfirmErase] = React.useState(false); // Confirm Erase Window
  const [confirmProgram, setConfirmProgram] = React.useState(false); // Confirm Flash Window
  const [flashing, setFlashing] = React.useState(false); // Enable/Disable buttons
  const [esp32Version, setEsp32Version] = React.useState(""); // Enable/Disable buttons

  const [deviceList, setDeviceList] = React.useState([
    {
      deviceName: "Voice Box",
      chipType: "esp32",
      isConnected: true,
      srcImage:
        "https://image.made-in-china.com/2f0j00DZWqyScFShbf/4G-Static-Qr-Payment-Soundbox-Higher-Volume-Broadcast-with-POS-Payment-Z10-a.jpg",
    },
    {
      deviceName: "Pay Box",
      chipType: "esp32-s3",
      isConnected: true,
      srcImage:
        "https://vietqr.com/wp-content/uploads/2023/07/thoa-thuan-su-dung-vietqr.png",
    },
  ]);

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
      // console.log(data);
    },
    write(data) {
      xTerm.write(data);
    },
  };

  const handleBtnSlectEspVersion = (key) => {
    const url = location.pathname + key;
    console.log(
      "🚀 ~ file: index.js:107 ~ handleBtnSlectEspVersion ~ url:",
      url
    );
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

      newChip = await newEspLoader.main();
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
        esp32Version,
        binaryUpload.folderBin,
        binaryUpload.fileName
      );

      const contents = await toArrayBuffer(fileInfo);
      let eraseAll = false;
      let offset = "";
      if (binaryUpload.fileName === "target.bin") {
        eraseAll = true;
        offset = "0x0000";
        toast.warn(`Waiting to Erasing flash before flashing all...`, {
          position: "top-center",
          toastId: "notify_erasing",
          autoClose: 3000,
        });
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
    } catch (e) {
      console.error(e);
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
      disconnectButtonOnclick();
    } catch (e) {
      console.error(e);
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
                          onClick={(e) =>
                            handleBtnSlectEspVersion(device.chipType)
                          }
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

      {/* <TestTool></TestTool> */}
    </div>
  );
};

export default App;

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
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import ListVersions from "./components/ListVersions";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";

import { Card, CardHeader, CardBody } from "reactstrap";

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
import { getDevices, downloadFirmware } from "network/Firebase";
import { downloadBinary } from 'network/ApiAxios'

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

// Tải binary từ server
async function getBinary(filePath) {
  // const requestBoday = { filePath };

  try {
    // const data = await downloadBinary(requestBoday);
    // console.log("🚀 ~ getBinary ~ data:", data)

    const data2 = await downloadFirmware(filePath);
    return data2;
  } catch (error) {
    console.error("🚀 ~ getBinary ~ error:", error);
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
  const [branchName, setBranchName] = React.useState(""); // Enable/Disable buttons

  const [loading, setLoading] = React.useState(true);
  const [deviceList, setDeviceList] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const devices = await getDevices();
        console.log("🚀 ~ fetchData ~ data:", devices)
        setDeviceList(devices);
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
    files: [],
    boardType: "",
  }); // Uploaded Files

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (branchName === "") {
      setbinaryUpload({ files: [], boardType: "" });
    }

  }, [branchName]);

  React.useEffect(() => {
    if (!supported()) return;
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
    setBranchName(key);
  };

  // Connect to ESP & init flasher stuff

  if (navigator.serial != null) {
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
  }

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

    if (!binaryUpload.files || binaryUpload.files.length === 0) {
      toast.error(`Must select version image ...`, {
        position: "top-center",
        toastId: "upload_fail",
        autoClose: 3000,
      });
      setFlashing(false);
      return;
    }

    try {
      // Tạo mảng fileArray cho writeFlash
      const fileArray = [];
      for (const file of binaryUpload.files) {
        toast.info(`Đang tải file ${file.name}...`, {
          toastId: "download_file",
          position: "top-center",
        });
        const fileInfo = await getBinary(file.filePath);
        if (!fileInfo) {
          await delay(2000);
          disconnectButtonOnclick();
          toast.dismiss("download_file");
          return;
        }

        const contents = fileInfo
        fileArray.push({
          data: contents,
          address: parseInt(file.offset, 16),
        });
        toast.dismiss("download_file");
      }

      toast(`Uploading...`, {
        position: "top-center",
        progress: 0,
        toastId: "upload",
      });

      const flashOptions = {
        fileArray,
        flashSize: "keep",
        flashMode: "keep",
        flashFreq: "keep",
        eraseAll: false,
        compress: true,
        baudrate: 921600,
        reportProgress: (fileIndex, written, total) => {
          const progress = written / total;
          toast.update("upload", { progress: progress });
          if (progress >= 1) {
            toast.dismiss("upload"); // Đóng toast "upload"
            toast.success("Done! Reset ESP to run new firmware.", {
              position: "top-center",
              toastId: "uploaded",
              autoClose: 3000,
            });
          }
        },
      };

      await espInfo.esploader.writeFlash(flashOptions);
      await delay(2000);
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
                onClick={(e) => handleBtnSlectEspVersion(device.gitBranch)}
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
                      width: "40px",
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
                        alt={`img${index}`}
                        src={device.srcImage}
                        sx={{ width: 50, height: 50 }}
                      />
                    </StyledBadge>
                  </div>
                  <div
                    style={{
                      flex: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div>
                      {device.deviceName + " (" + device.chipType + ")"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#555",
                        textTransform: "none",
                      }}
                    >
                      {`Git branch: ${device.gitBranch}`}
                    </div>
                  </div>
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
          {supported() && connected && <></>}

          {(supported() && branchName != "") ? (
            <ListVersions
              setbinaryUpload={setbinaryUpload}
              binaryUpload={binaryUpload}
              branchName={branchName}
              setBranchName={setBranchName}
            ></ListVersions>
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

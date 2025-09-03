import * as React from "react";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ShowListBinary from "./ShowListBinary";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import styles from "./Output.module.css";
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function BasicTabs({
  setbinaryUpload,
  binaryUpload,
  setEsp32Version,
  esp32Version,
}) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    const newFileName = newValue === 1 ? "firmware.bin" : "target.bin";
    console.log("🚀 ~ handleChange ~ newValue:", newValue);
    console.log("🚀 ~ handleChange ~ newValue:", newFileName);
    setValue(newValue);
    setbinaryUpload((binaryUpload) => ({
      ...binaryUpload,
      fileName: newFileName,
    }));
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <div
          style={{
            position: "absolute",
            left: 50,
            top: 150,
          }}
        >
          <IconButton
            color="secondary"
            aria-label="show ros monit or"
            onClick={() => {
              setEsp32Version("");
            }}
            className={styles.button__background}
          >
            <ArrowBackIcon></ArrowBackIcon>
          </IconButton>
        </div>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
          centered
        >
          <Tab label="Flash All" {...a11yProps(0)} wrapped></Tab>
          <Tab label="Flash Only Firmware" {...a11yProps(1)} />
        </Tabs>
      </Box>
      {[0, 1].map((key, index) => (
        <CustomTabPanel value={value} index={index} key={index}>
          <Typography
            sx={{ mt: 0, mb: 2 }}
            variant="h6"
            component="div"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            Danh sách các version
            <br/>
            <div style={{fontSize: "0.75rem", color: "gray", marginTop: "0.7rem"}}>
            {esp32Version}
              </div>
          </Typography>
          <ShowListBinary
            setbinaryUpload={setbinaryUpload}
            binaryUpload={binaryUpload}
            currTab={value}
            esp32Version={esp32Version}
          />
        </CustomTabPanel>
      ))}
    </Box>
  );
}

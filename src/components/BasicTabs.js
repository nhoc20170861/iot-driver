import * as React from "react";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ShowListBinary from "./ShowListBinary";
import fileDownload from "js-file-download";
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

export default function BasicTabs({ setbinaryUpload, binaryUpload }) {
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

      <CustomTabPanel value={value} index={0}>
        <Typography
          sx={{ mt: 0, mb: 2 }}
          variant="h6"
          component="div"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Danh sách các version
        </Typography>
        <ShowListBinary
          setbinaryUpload={setbinaryUpload}
          binaryUpload={binaryUpload}
          currTab={value}
        />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <Typography
          sx={{ mt: 0, mb: 2 }}
          variant="h6"
          component="div"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Danh sách các version
        </Typography>
        <ShowListBinary
          setbinaryUpload={setbinaryUpload}
          binaryUpload={binaryUpload}
          currTab={value}
        />
      </CustomTabPanel>
    </Box>
  );
}

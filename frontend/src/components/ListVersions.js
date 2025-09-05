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
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import PermMedia from "@mui/icons-material/PermMedia";
import CircularProgress from "@mui/material/CircularProgress";
import { getListEsp32Binary } from "network/ApiAxios";

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

function getVnTime(utcTime) {
  const date = new Date(utcTime);
  const vnTime = date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  return vnTime;
}

export default function ListVersions({
  setbinaryUpload,
  binaryUpload,
  setBranchName,
  branchName,
}) {
  const [loading, setLoading] = React.useState(true);
  const [listVersionImage, setListVersionImage] = React.useState([]);
  const [ciDetail, setCiDetail] = React.useState({
    ciName: "",
    boards: [],
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getListEsp32Binary(branchName);
        console.log("🚀 ~ fetchData ~ response:", data.binaryEsp32List);
        setListVersionImage(data.binaryEsp32List);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleListItemClick = (event, ciInfo) => {
    setCiDetail(ciInfo);
  };

  const renderListVersion = (input) => {
    return (
      <Box className={styles.ContainerListImage}>
        {input.map((item, index) => {
            return (
            <ListItemButton
              key={`${input.length - index}`}
              onClick={(event) => handleListItemClick(event, item)}
            >
              <ListItemAvatar>
              <Avatar>
                <PermMedia />
              </Avatar>
              </ListItemAvatar>
              <ListItemText
              primary={item.ciName || ""}
              secondary={
                <>
                <span>issued at {getVnTime(item.buildDate)}</span>
                <br />
                <span>{item.commitMessage}</span>
                </>
              }
              secondaryTypographyProps={{
                style: {
                whiteSpace: 'normal',
                overflow: 'visible',
                textOverflow: 'clip'
                }
              }}
              />
            </ListItemButton>
            );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      {ciDetail.ciName == "" ? (
        <>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <div
              style={{
                position: "absolute",
                left: 50,
                top: 80,
              }}
            >
              <IconButton
                color="secondary"
                aria-label="show ros monit or"
                onClick={() => {
                  setBranchName("");
                }}
                className={styles.button__background}
              >
                <ArrowBackIcon></ArrowBackIcon>
              </IconButton>
            </div>
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
              <br />
              <div
                style={{
                  fontSize: "1rem",
                  color: "gray",
                  marginTop: "0.7rem",
                }}
              >
                {branchName}
              </div>
            </Typography>
            {/* <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
          centered
        >
          <Tab label="Flash All" {...a11yProps(0)} wrapped></Tab>
          <Tab label="Flash Only Firmware" {...a11yProps(1)} />
        </Tabs> */}
          </Box>
          <Box
            sx={{
              width: "100%",
              bgcolor: "background.paper",
              p: "0 0 0 1.5rem",
            }}
          >
            <List component="nav" aria-label="main mailbox folders">
              {loading ? (
                <CircularProgress />
              ) : (
                renderListVersion(listVersionImage)
              )}
            </List>
            <Divider />
          </Box>
        </>
      ) : (
        <ShowListBinary
          setbinaryUpload={setbinaryUpload}
          binaryUpload={binaryUpload}
          branchName={branchName}
          ciName={ciDetail.ciName || ""}
          boards={ciDetail.boards}
          setCiDetail={setCiDetail}
          createdAt={ciDetail.createdAt}
        />
      )}
    </Box>
  );
}

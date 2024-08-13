import React from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Grid";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import ChromeIcon from "../icons/Chrome";
import EdgeIcon from "../icons/Edge";
import OperaIcon from "../icons/Opera";
import SettingsIcon from "@mui/icons-material/Settings";

const Home = (props) => {
  return (
    <Grid
      container
      spacing={0}
      direction="row"
      alignItems="center"
      justifyContent="center"
    >
      {props.supported() ? (
        <Box align="center">
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-around",
              marginBottom: "0.5rem",
              width: "auto !important",
            }}
          >
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={props.connect}
              sx={{ m: 1 }}
            >
              Connect
            </Button>
            <Button
              size="large"
              onClick={props.openSettings}
              sx={{ m: 1, color: "#bebebe" }}
            >
              <SettingsIcon />
            </Button>
          </div>

          <Alert severity="info" align="left">
            1. Bấm nút CONNECT
            <br />
            2. Cắm mạch ESP và lựa chọn cổng COM
            <br />
            3. Chọn loại sản phẩm và chọn bản Image tương ứng
            <br />
            4. Bấm nút PROGRAM để nạp code mới vào mạch 😊
            <br />
          </Alert>
        </Box>
      ) : (
        <Alert severity="warning">
          <AlertTitle>
            Your browser doesn&apos;t support Web Serial 😭
          </AlertTitle>
          Try using&nbsp;
          <a href="https://www.google.com/chrome/" target="blank">
            <ChromeIcon fontSize="inherit" /> <b>Chrome</b>
          </a>
          ,&nbsp;
          <a href="https://www.microsoft.com/en-us/edge" target="blank">
            <EdgeIcon fontSize="inherit" /> <b>Edge</b>
          </a>
          , or&nbsp;
          <a href="https://www.opera.com/" target="blank">
            <OperaIcon fontSize="inherit" /> <b>Opera</b>
          </a>
          <br />
          (IOS & Android browsers are not supported)
          <br />
          <br />
          Learn more about&nbsp;
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/Serial#browser_compatibility"
            target="blank"
          >
            browser compatibility
          </a>
        </Alert>
      )}
    </Grid>
  );
};

Home.propTypes = {
  connect: PropTypes.func,
  supported: PropTypes.func,
  openSettings: PropTypes.func,
};

export default Home;

import * as React from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import PermMedia from "@mui/icons-material/PermMedia";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import styles from "./Output.module.css";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
// Offset mặc định cho từng file
const defaultOffsets = {
  "firmware.bin": "0x10000",
  "bootloader.bin": "0x8000",
  "spiffs.bin": "0x310000",
  "partitions.bin": "0x1000",
  "merged_firmware.bin": "0x00000",
};

function getVnTimeFromUnix(timeUnix) {
  const date = new Date(
    timeUnix._seconds * 1000 + Math.floor(timeUnix._nanoseconds / 1000000)
  );
  const vnTime = date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  return vnTime;
}

const ShowListBinary = (props) => {
  const [selectedIndex, setSelectedIndex] = React.useState(-1);

  const [openModal, setOpenModal] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState([]);
  const [modalBoard, setModalBoard] = React.useState(null);

  const handleFileToggle = (file) => {
  setSelectedFiles((prev) => {
    const exists = prev.find(
      (f) => f.name === file.name && f.filePath === file.filePath
    );
    // Nếu chọn merged_firmware.bin thì chỉ giữ lại nó
    if (file.name === "merged_firmware.bin" && !exists) {
      return [
        {
          name: file.name,
          filePath: file.filePath,
          size: file.size,
          offset: defaultOffsets[file.name] || "0x00000",
        },
      ];
    }
    // Nếu bỏ chọn merged_firmware.bin thì bỏ nó ra khỏi danh sách
    if (file.name === "merged_firmware.bin" && exists) {
      return [];
    }
    // Nếu đang chọn merged_firmware.bin thì không cho chọn file khác
    if (prev.some((f) => f.name === "merged_firmware.bin")) {
      return prev;
    }
    // Bình thường: toggle file
    if (exists) {
      return prev.filter(
        (f) => !(f.name === file.name && f.filePath === file.filePath)
      );
    } else {
      return [
        ...prev,
        {
          name: file.name,
          filePath: file.filePath,
          size: file.size,
          offset: defaultOffsets[file.name] || "0x00000",
        },
      ];
    }
  });
};

  React.useEffect(() => {
    console.log("selectedFiles", selectedFiles);
  }, [selectedFiles]);

  const handleModalConfirm = () => {
    props.setbinaryUpload({
      boardType: modalBoard.name,
      files: selectedFiles,
    });
    setOpenModal(false);
  };

  const handleModalClose = () => {
    setOpenModal(false);
  };

  // Khi mở modal, set sẵn firmware.bin (nếu có) với offset mặc định
  const handleListItemClick = (event, board, index) => {
    setModalBoard(board);
    const firmwareFile = (board.files || []).find(
      (f) => f.name === "firmware.bin"
    );
    setSelectedFiles(
      firmwareFile
        ? [
            {
              name: firmwareFile.name,
              filePath: firmwareFile.filePath,
              size: firmwareFile.size,
              offset: defaultOffsets[firmwareFile.name] || "0x10000",
            },
          ]
        : []
    );
    setOpenModal(true);
  };
  // Cập nhật offset khi nhập
  const handleOffsetChange = (file, value) => {
    setSelectedFiles((prev) =>
      prev.map((f) =>
        f.name === file.name && f.filePath === file.filePath
          ? { ...f, offset: value }
          : f
      )
    );
  };


  const isMergedFirmwareSelected = selectedFiles.some(
  (f) => f.name === "merged_firmware.bin"
);
  const renderListImage = (input) => {
    return (
      <Box className={styles.ContainerListImage}>
        {input.map((item, index) => {
          return (
            <ListItemButton
              key={`${input.length - index}`}
              selected={selectedIndex === index}
              onClick={(event) => handleListItemClick(event, item, index)}
            >
              <ListItemAvatar>
                <Avatar>
                  <PermMedia />
                </Avatar>
              </ListItemAvatar>

              <ListItemText primary={item.name || ""} secondary={`vietqr`} />
            </ListItemButton>
          );
        })}
      </Box>
    );
  };

  return (
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
              props.setCiDetail({ ciName: "", boards: [] });
            }}
            className={styles.button__background}
          >
            <ArrowBackIcon></ArrowBackIcon>
          </IconButton>
        </div>
        <Typography
          sx={{ mt: 0, mb: 2, pl: 5 }}
          variant="h6"
          component="div"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          Chọn loại board
          <br />
          <div
            style={{
              fontSize: "0.8rem",
              color: "gray",
              marginTop: "0.7rem",
            }}
          >
            CI: {props.ciName}, phát hành {getVnTimeFromUnix(props.createdAt)}
          </div>
        </Typography>
      </Box>
      <Box
        sx={{ width: "100%", bgcolor: "background.paper", p: "0 0 0 1.5rem" }}
      >
        <List component="nav" aria-label="main mailbox folders">
          {renderListImage(props.boards)}
        </List>
        <Divider />
      </Box>

      {/* Add modal to select file to flash */}
      <Dialog open={openModal} onClose={handleModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {`Chọn file để nạp cho board ${modalBoard?.name}`}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column">
            {modalBoard?.files.length === 0 && (
              <Typography>Không có file nào để chọn.</Typography>
            )}
            {(modalBoard?.files || []).map((file) => {
              const selected = selectedFiles.find(
                (f) => f.name === file.name && f.filePath === file.filePath
              );

                const disableOther =
    isMergedFirmwareSelected && file.name !== "merged_firmware.bin";
              return (
                <Box key={file.name} display="flex" alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!selected}
                        onChange={() => handleFileToggle(file)}
                        disabled={disableOther}
                      />
                    }
                    label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                    style={{ marginBottom: 4, flex: 1 }}
                  />
                  <TextField
                    label="Offset"
                    size="small"
                    value={
                      selected
                        ? selected.offset
                        : defaultOffsets[file.name] || "0x00000"
                    }
                    onChange={(e) => handleOffsetChange(file, e.target.value)}
                    style={{ width: 110, marginLeft: 8 }}
                    disabled={!selected}
                  />
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose}>Hủy</Button>
          <Button
            onClick={handleModalConfirm}
            disabled={selectedFiles.length === 0}
            variant="contained"
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
export default ShowListBinary;

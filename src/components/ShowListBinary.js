import * as React from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import PermMedia from "@mui/icons-material/PermMedia";
import CircularProgress from "@mui/material/CircularProgress";
import styles from "./Output.module.css";
import { getListEsp32Binary } from "network/ApiAxios";

const ShowListBinary = (props) => {
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [loading, setLoading] = React.useState(true);
  const [listImage, setListImage] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getListEsp32Binary(props.esp32Version);
        console.log("🚀 ~ fetchData ~ response:", data.binaryEsp32List);
        setListImage(data.binaryEsp32List);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  React.useEffect(() => {
    if (selectedIndex !== -1) {
      const infoBinary = { ...props.binaryUpload };
      infoBinary.folderContain = listImage[selectedIndex].folderContain;
      console.log("🚀 ~ React.useEffect ~ infoBinary:", infoBinary);
      props.setbinaryUpload(infoBinary);
    } else if (props.currTab === 0) {
      props.setbinaryUpload({ folderContain: "", fileName: "target.bin" });
    } else if (props.currTab === 1) {
      props.setbinaryUpload({ folderContain: "", fileName: "firmware.bin" });
    }
  }, [selectedIndex]);
  const handleListItemClick = (event, index) => {
    if (index === selectedIndex) {
      setSelectedIndex(-1);
    } else setSelectedIndex(index);
  };

  const renderListImage = (input) => {
    return (
      <Box className={styles.ContainerListImage}>
        {input.map((item, index) => {
          return (
            <ListItemButton
              key={`${input.length - index}`}
              selected={selectedIndex === index}
              onClick={(event) => handleListItemClick(event, index)}
            >
              <ListItemAvatar>
                <Avatar>
                  <PermMedia />
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={item.binaryName || ""}
                secondary={item.binaryDescription || ""}
              />
            </ListItemButton>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%", bgcolor: "background.paper", p: "0 0 0 1.5rem" }}>
      <List component="nav" aria-label="main mailbox folders">
        {loading ? <CircularProgress /> : renderListImage(listImage)}
      </List>
      <Divider />
    </Box>
  );
};
export default ShowListBinary;

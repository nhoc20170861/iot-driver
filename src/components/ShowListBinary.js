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
import Typography from "@mui/material/Typography";
import { getListEsp32Binary } from "network/ApiAxios";

const ShowListBinary = (props) => {
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [loading, setLoading] = React.useState(true);
  const [listImage, setListImage] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getListEsp32Binary();
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
    if (selectedIndex !== -1)
      props.setbinaryUpload(listImage[selectedIndex].folderBin);
  }, [selectedIndex]);
  const handleListItemClick = (event, index) => {
    if (index === selectedIndex) {
      setSelectedIndex(-1);
    } else setSelectedIndex(index);
  };

  const renderListImage = (input) => {
    return input.map((item, index) => {
      return (
        <ListItemButton
          key={`${index}`}
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
    });
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 480, bgcolor: "background.paper" }}>
      <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
        Danh sách các version binary
      </Typography>
      <List component="nav" aria-label="main mailbox folders">
        {loading ? <CircularProgress /> : renderListImage(listImage)}

        {/* <ListItemButton
          selected={selectedIndex === 1}
          onClick={(event) => handleListItemClick(event, 1)}
        >
          <ListItemIcon>🔥</ListItemIcon>
          <ListItemText primary="Drafts" />
        </ListItemButton> */}
      </List>
      <Divider />
      {/* <List component="nav" aria-label="secondary mailbox folder">
        <ListItemButton
          selected={selectedIndex === 2}
          onClick={(event) => handleListItemClick(event, 2)}
        >
          <ListItemText primary="Trash" />
        </ListItemButton>
        <ListItemButton
          selected={selectedIndex === 3}
          onClick={(event) => handleListItemClick(event, 3)}
        >
          <ListItemText primary="Spam" />
        </ListItemButton>
      </List> */}
    </Box>
  );
};
export default ShowListBinary;

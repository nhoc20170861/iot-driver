import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";

// Đọc username và password từ biến môi trường (REACT_APP_*)
const USERNAME = process.env.REACT_APP_USERNAME || "admin";
const PASSWORD = process.env.REACT_APP_PASSWORD || "admin";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Đơn giản: hardcode tài khoản, thực tế nên gọi API
    if (username === USERNAME && password === PASSWORD) {
      onLogin();
    } else {
      alert("Sai tài khoản hoặc mật khẩu!");
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Paper elevation={3} sx={{ p: 4, minWidth: 320 }}>
        <Typography variant="h5" align="center" mb={2}>
          Đăng nhập
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Tài khoản"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <TextField
            label="Mật khẩu"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Đăng nhập
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
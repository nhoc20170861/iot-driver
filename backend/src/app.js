import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
const port = 3000;
const fs = require("fs");

app.use("*", cors());

app.use(express.static(path.join(__dirname, "public")));
// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Use the cookie-parser middleware
app.use(cookieParser());

// Router init
import routes from "./routes";
app.use("/api", routes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

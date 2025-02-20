import { Router } from "express";
const multer = require("multer");

// Set up multer for handling file uploads
const upload = multer();

import verifyToken from "../middleware";
import firebaseDatabaseController from "../controllers/firebase-database-controller";
import firebaseAuthController from "../controllers/firebase-auth-controller";

const router = Router();

router.post("/register", firebaseAuthController.registerUser);
router.post("/login", firebaseAuthController.loginUser);
router.post("/logout", verifyToken, firebaseAuthController.logoutUser);
//router.post("/reset-password", resetPassword);

// api for connecting database
router.post("/downloadBinary", firebaseDatabaseController.downloadBinary);
router.get(
  "/getListEsp32Binary/:esp32Version",
  firebaseDatabaseController.getBinaries
);

// Route to add a new binary
router.post(
  "/addBinary",
  upload.fields([{ name: "targetBin" }, { name: "firmwareBin" }]),
  firebaseDatabaseController.addBinary
);

// Route to get all deviceEsp32
router.get("/devices", firebaseDatabaseController.getDevices);
export default router;

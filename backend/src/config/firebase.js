import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";

dotenv.config();
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

import admin from "firebase-admin";

var serviceAccount = require("../../FirebaseService.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://iotproject-13482.appspot.com",
  databaseURL: "https://iotproject-13482.firebaseio.com",
});

const bucket = admin.storage().bucket();
const firestore = admin.firestore();

// async function listChildFolders(parentFolder) {
//   try {
//     const [files] = await bucket.getFiles({
//       prefix: `${parentFolder}/`,
//     }); // Get files under the parent folder

//     const childFolders = files
//       .filter((file) => file.name.includes("/")) // Filter out files that are not folders
//       .filter((file) => file.name.split("/").length >= 3)
//       .map((file) => {
//         const parts = file.name.split("/");
//         console.log("🚀 ~ .map ~ parts:", parts);
//         return parts[parts.length - 2]; // Get the folder name from the path
//       })
//       .filter((folder, index, self) => self.indexOf(folder) === index); // Remove duplicates
//     console.log("Child folders in", parentFolder, ":", childFolders);
//   } catch (error) {
//     console.error("Error listing child folders:", error.message);
//   }
// }

// const parentFolder = "esp32"; // Replace with the path to your parent folder
// listChildFolders(parentFolder).catch(console.error);

const firebase = initializeApp(firebaseConfig);

module.exports = {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  admin,
  bucket,
  firestore,
};

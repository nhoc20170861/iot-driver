import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getStorage, getDownloadURL, getBytes, ref } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Kết nối Firestore & Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function getListVersion(gitBranch) {
  const snapshot = await getDocs(collection(db, gitBranch));
  const binaries = snapshot.docs.map(doc => doc.data());

  // sort theo createdAt
  return binaries.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
}



export async function getDevices() {
  const snapshot = await getDocs(collection(db, "deviceEsp32"));
  return snapshot.docs.map(doc => doc.data());
}

/**
 * Convert a unsigned 8 bit integer array to byte string.
 * @param {Uint8Array} u8Array - magic hex number to select ROM.
 * @returns {string} Return the equivalent string.
 */

function ui8ToBstr(u8Array) {
  let bStr = "";
  for (let i = 0; i < u8Array.length; i++) {
    bStr += String.fromCharCode(u8Array[i]);
  }
  return bStr;
}

export async function downloadFirmware(filePath) {
  try {
    const storage = getStorage();
    const fileRef = ref(storage, filePath);

  

    const arrayBuffer = await getBytes(fileRef);   // ⬅️ getBytes trả thẳng Uint8Array
     const bytes =  new Uint8Array(arrayBuffer);
   
    return ui8ToBstr(bytes)
  } catch (error) {
    console.error("Error downloading firmware:", error);
    return null;
  }
}
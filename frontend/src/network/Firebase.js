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

  function uint8ArrayToBinaryString(uint8Array) {
    let binary = "";
    const chunkSize = 0x8000; // đọc từng khúc tránh stack overflow
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return binary;
  }

export async function downloadFirmware(filePath) {
  try {
    const storage = getStorage();
    const fileRef = ref(storage, filePath);

    const url = await getDownloadURL(fileRef);

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch file");

    const blob = await response.blob();
    
    // return blob;
    // ArrayBuffer → Uint8Array
      const arrayBuffer = await blob.arrayBuffer();


    const bytes = new Uint8Array(arrayBuffer);

    // Uint8Array → Binary String (để flash bằng esptool-js)
    const binaryString = uint8ArrayToBinaryString(bytes);

    return binaryString;
  } catch (error) {
    console.error("Error downloading firmware:", error);
    return null;
  }
}
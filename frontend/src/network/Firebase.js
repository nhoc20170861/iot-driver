import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getStorage, getDownloadURL, ref } from "firebase/storage";

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

export async function downloadBinary(filePath) {
  try {
    const storage = getStorage();
    const url = await getDownloadURL(ref(storage, filePath));

    // Fetch raw binary
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch binary");

    return await response.arrayBuffer(); // Raw binary buffer
  } catch (error) {
    console.error("Error fetching binary:", error);
    return null;
  }
}

// ✅ All imports go first
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// ✅ Then your config and setup
const firebaseConfig = {
  apiKey: "AIzaSyBYeiOgnd3p6yre5-0YhuCVOho9F06cQbg",
  authDomain: "appv1-729f7.firebaseapp.com",
  projectId: "appv1-729f7",
  storageBucket: "appv1-729f7.firebasestorage.app",
  messagingSenderId: "540046339276",
  appId: "1:540046339276:web:0b59000bcbf94200782669",
  measurementId: "G-ETG0ELZTTJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// ✅ Export at the bottom
export { auth, storage };
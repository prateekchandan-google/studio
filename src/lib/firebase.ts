// Import the functions you need from the SDKs you need
import {initializeApp, getApp, getApps} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_6j6rJypuTzhCO80OXkC8Fgj97XKiGow",
  authDomain: "gtv-treasure-hunt-2025.firebaseapp.com",
  projectId: "gtv-treasure-hunt-2025",
  storageBucket: "gtv-treasure-hunt-2025.firebasestorage.app",
  messagingSenderId: "806363809215",
  appId: "1:806363809215:web:5ecad81315ebc2d58b4d0a"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export {app, db, auth};

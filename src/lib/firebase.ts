
// Import the functions you need from the SDKs you need
import {initializeApp, getApp, getApps} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBdw69_G1BgZxTQVMplfXyUqGluT7HxUY",
  authDomain: "b0785d6b-0dd4-4617-b812-15a496914d78.firebaseapp.com",
  projectId: "b0785d6b-0dd4-4617-b812-15a496914d78",
  storageBucket: "b0785d6b-0dd4-4617-b812-15a496914d78.appspot.com",
  messagingSenderId: "624941622563",
  appId: "1:624941622563:web:b9571e86b115646a9fd896"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export {app, db, auth, storage};

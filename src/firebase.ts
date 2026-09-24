import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import configJson from '../firebase-applet-config.json';

const firebaseConfig = {
  projectId: configJson.projectId || "jaunty-pattern-rf6jr",
  appId: configJson.appId || "1:47521668962:web:92abaccc7ad79141a8963b",
  apiKey: configJson.apiKey || "AIzaSyDDFEDIoDzVt1kwuAKH1o9fsEBw64eThkc",
  authDomain: configJson.authDomain || "jaunty-pattern-rf6jr.firebaseapp.com",
  storageBucket: configJson.storageBucket || "jaunty-pattern-rf6jr.firebasestorage.app",
  messagingSenderId: configJson.messagingSenderId || "47521668962"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, configJson.firestoreDatabaseId || undefined);
export const auth = getAuth(app);

export {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  firebaseUpdateProfile
};

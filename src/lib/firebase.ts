import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration loaded from firebase-applet-config.json or hardcoded safely
const firebaseConfig = {
  apiKey: "AIzaSyAh5is9npKtL0ikAgEAco6vPilREqf7Pdc",
  authDomain: "light-road-jn50x.firebaseapp.com",
  projectId: "light-road-jn50x",
  storageBucket: "light-road-jn50x.firebasestorage.app",
  messagingSenderId: "755227475565",
  appId: "1:755227475565:web:cb7ea4cad413ffd2cc8964"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if provided in config
// In firebase-applet-config.json, firestoreDatabaseId is "ai-studio-aiplannerpro-bee4d23a-606e-4796-8624-195ad2b3e274"
export const db = getFirestore(app, "ai-studio-aiplannerpro-bee4d23a-606e-4796-8624-195ad2b3e274");

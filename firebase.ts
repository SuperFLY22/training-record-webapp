import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCyi_XKAnAu0zklWexpN5dpmkswqy6TZ4o",
  authDomain: "training-record-system-a996b.firebaseapp.com",
  projectId: "training-record-system-a996b",
  storageBucket: "training-record-system-a996b.appspot.com",
  messagingSenderId: "573958918001",
  appId: "1:573958918001:web:4b435037e3310da27db0d0",
  measurementId: "G-57Q46Z5XVP"
};

const app = initializeApp(firebaseConfig);

// Firestore export (중복 선언 제거)
export const db = getFirestore(app);
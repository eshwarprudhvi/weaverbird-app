import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBHZtXb4428fW-nVSTDBVNasZfpLj324Yg",
  authDomain: "weaverbird-project-manager.firebaseapp.com",
  projectId: "weaverbird-project-manager",
  storageBucket: "weaverbird-project-manager.firebasestorage.app",
  messagingSenderId: "973323732782",
  appId: "1:973323732782:web:2c0276e365ad969f779cbf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const updateRef = doc(db, "system", "update");
setDoc(updateRef, { 
    version: "1.1.1", 
    url: "https://weaverbird-app.vercel.app/1.1.1.zip" 
}, { merge: true })
.then(() => {
    console.log("Firestore updated successfully.");
    process.exit(0);
})
.catch(err => {
    console.error("Error updating Firestore", err);
    process.exit(1);
});

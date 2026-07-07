import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBHZtXb4428fW-nVSTDBVNasZfpLj324Yg",
  authDomain: "weaverbird-project-manager.firebaseapp.com",
  projectId: "weaverbird-project-manager",
  storageBucket: "weaverbird-project-manager.firebasestorage.app",
  messagingSenderId: "973323732782",
  appId: "1:973323732782:web:2c0276e365ad969f779cbf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  console.log("Signing in...");
  const userCredential = await signInWithEmailAndPassword(auth, "owner_1783391609149@gmail.com", "password123");
  const user = userCredential.user;
  console.log("Signed in. User UID:", user.uid);

  const workspaceId = "ws_debug_1783391609200";
  
  const wsSnap = await getDoc(doc(db, 'workspaces', workspaceId));
  console.log("Workspace exists:", wsSnap.exists, wsSnap.data());
  
  const memberSnap = await getDoc(doc(db, 'workspaces', workspaceId, 'members', user.uid));
  console.log("Member exists:", memberSnap.exists, memberSnap.data());
}

run().catch(console.error);

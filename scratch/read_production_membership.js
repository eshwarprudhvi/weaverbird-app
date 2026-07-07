import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

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
  console.log("Signing in as demo@gmail.com...");
  // Let's try password as "password123" or similar.
  let user;
  try {
    const cred = await signInWithEmailAndPassword(auth, "demo@gmail.com", "password123");
    user = cred.user;
  } catch (err) {
    console.log("Failed login with password123, trying default passwords...");
    try {
      const cred = await signInWithEmailAndPassword(auth, "demo@gmail.com", "demo123");
      user = cred.user;
    } catch (e2) {
      try {
        const cred = await signInWithEmailAndPassword(auth, "demo@gmail.com", "password");
        user = cred.user;
      } catch (e3) {
        console.error("Could not sign in as demo@gmail.com:", e3.message);
        return;
      }
    }
  }

  console.log("Logged in UID:", user.uid, "Email:", user.email);

  const workspaceId = "ws_1783387463831";
  
  const wsSnap = await getDoc(doc(db, 'workspaces', workspaceId));
  console.log("Workspace exists:", wsSnap.exists, wsSnap.data());
  
  const memberRef = doc(db, 'workspaces', workspaceId, 'members', user.uid);
  const memberSnap = await getDoc(memberRef);
  console.log("Member document exists:", memberSnap.exists, memberSnap.data());

  // Also print all members of this workspace
  console.log("\nAll members in workspace:");
  const membersSnap = await getDocs(collection(db, 'workspaces', workspaceId, 'members'));
  membersSnap.forEach(d => {
    console.log(`- Member ID: ${d.id}, Email: ${d.data().email}, Role: ${d.data().role}, Status: ${d.data().status}`);
  });
}

run().catch(console.error);

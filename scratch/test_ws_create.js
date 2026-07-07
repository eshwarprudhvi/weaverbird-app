import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

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
  console.log("Registering test user...");
  const testEmail = `test_ws_create_${Date.now()}@gmail.com`;
  const userCredential = await createUserWithEmailAndPassword(auth, testEmail, "password123");
  const user = userCredential.user;
  const workspaceId = `ws_test_${Date.now()}`;

  console.log("Testing individual workspace doc creation...");
  try {
    await setDoc(doc(db, 'workspaces', workspaceId), {
      companyName: 'Test Workspace',
      status: 'active',
      createdAt: serverTimestamp(),
      schemaVersion: 1
    });
    console.log("✅ WORKSPACE CREATION SUCCESSFUL!");
  } catch (err) {
    console.error("❌ WORKSPACE CREATION FAILED:", err.message);
  }
}

run().catch(console.error);

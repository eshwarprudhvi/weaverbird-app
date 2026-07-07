import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

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
  console.log("Creating test user...");
  const testEmail = `diag_${Date.now()}@gmail.com`;
  const userCredential = await createUserWithEmailAndPassword(auth, testEmail, "password123");
  const user = userCredential.user;
  console.log("Logged in UID:", user.uid);

  const workspaceId = `ws_diag_${Date.now()}`;
  console.log(`Setting up workspace ${workspaceId}...`);

  await setDoc(doc(db, 'workspaces', workspaceId), {
    companyName: 'Diagnose Workspace',
    status: 'active',
    createdAt: serverTimestamp(),
    schemaVersion: 1
  });

  await setDoc(doc(db, 'workspaces', workspaceId, 'members', user.uid), {
    email: user.email,
    role: 'owner',
    status: 'active',
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  console.log("\n--- TEST 1: isWorkspaceMember verification (write project doc) ---");
  try {
    await setDoc(doc(db, 'workspaces', workspaceId, 'projects', 'test_proj_id'), {
      name: 'Diagnostics Project',
      status: 'active',
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      isTrashed: false,
      schemaVersion: 1
    });
    console.log("✅ TEST 1 SUCCESSFUL: isWorkspaceMember works!");
  } catch (err) {
    console.error("❌ TEST 1 FAILED:", err);
  }

  console.log("\n--- TEST 2: isWorkspaceAdmin verification (update workspace doc) ---");
  try {
    await updateDoc(doc(db, 'workspaces', workspaceId), {
      companyName: 'Updated Diagnostics Workspace',
      updatedAt: serverTimestamp()
    });
    console.log("✅ TEST 2 SUCCESSFUL: isWorkspaceAdmin works!");
  } catch (err) {
    console.error("❌ TEST 2 FAILED:", err);
  }
}

run().catch(console.error);

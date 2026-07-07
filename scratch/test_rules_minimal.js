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
  console.log("Registering owner...");
  const testEmail = `owner_min_${Date.now()}@gmail.com`;
  const userCredential = await createUserWithEmailAndPassword(auth, testEmail, "password123");
  const user = userCredential.user;
  const workspaceId = `ws_min_${Date.now()}`;

  console.log("Creating workspace and member doc...");
  await setDoc(doc(db, 'workspaces', workspaceId), {
    companyName: 'Minimal Workspace',
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

  const invitationId = `tok_min_${Math.random().toString(36).substr(2, 9)}`;
  const inviteRef = doc(db, 'invitations', invitationId);

  // Test 1: Minimal fields matching hasAll exactly
  console.log("--- TEST 1: Minimal fields matching hasAll exactly ---");
  try {
    await setDoc(inviteRef, {
      email: "test@gmail.com",
      workspaceId: workspaceId,
      role: "member",
      status: "pending",
      schemaVersion: 1
    });
    console.log("✅ TEST 1 SUCCESSFUL!");
  } catch (err) {
    console.error("❌ TEST 1 FAILED:", err.message);
  }

  // Test 2: Adding extra fields (id, token, invitedBy, expiresAt)
  console.log("\n--- TEST 2: Adding extra fields ---");
  try {
    await setDoc(inviteRef, {
      id: invitationId,
      token: invitationId,
      email: "test@gmail.com",
      workspaceId: workspaceId,
      workspaceName: "Minimal Workspace",
      role: "member",
      status: "pending",
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      invitedBy: "owner_min",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      schemaVersion: 1
    });
    console.log("✅ TEST 2 SUCCESSFUL!");
  } catch (err) {
    console.error("❌ TEST 2 FAILED:", err.message);
  }
}

run().catch(console.error);

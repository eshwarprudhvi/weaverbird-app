import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, writeBatch, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

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
  console.log("Creating new test owner user...");
  const testEmail = `owner_${Date.now()}@gmail.com`;
  const userCredential = await createUserWithEmailAndPassword(auth, testEmail, "password123");
  const user = userCredential.user;
  console.log("Logged in test user UID:", user.uid, "Email:", user.email);

  const workspaceId = `ws_debug_${Date.now()}`;
  console.log(`Creating test workspace ${workspaceId} and membership...`);
  
  try {
    // 1. Create workspace document
    await setDoc(doc(db, 'workspaces', workspaceId), {
      companyName: 'Debug Rules Workspace',
      status: 'active',
      createdAt: serverTimestamp(),
      schemaVersion: 1
    });
    console.log("Workspace document created successfully.");
  } catch (err) {
    console.error("Workspace document creation failed:", err);
  }

  try {
    // 2. Create owner membership document
    await setDoc(doc(db, 'workspaces', workspaceId, 'members', user.uid), {
      email: user.email,
      role: 'owner',
      status: 'active',
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log("Membership document created successfully.");
  } catch (err) {
    console.error("Membership document creation failed:", err);
  }

  // Verify they exist on client
  try {
    const wsSnap = await getDoc(doc(db, 'workspaces', workspaceId));
    console.log("Verification - Workspace exists:", wsSnap.exists, wsSnap.data());
    
    const memberSnap = await getDoc(doc(db, 'workspaces', workspaceId, 'members', user.uid));
    console.log("Verification - Member exists:", memberSnap.exists, memberSnap.data());
  } catch (err) {
    console.error("Verification reads failed:", err);
  }

  const invitationId = `tok_${Math.random().toString(36).substr(2, 9)}`;
  const inviteRef = doc(db, 'invitations', invitationId);
  const activeRef = doc(db, 'invitationsActive', `${workspaceId}_demo2@gmail.com`);

  const normalizedEmail = "demo2@gmail.com";
  const inviteDoc = {
    id: invitationId,
    token: invitationId,
    email: normalizedEmail,
    workspaceId,
    workspaceName: 'Studio Workspace',
    role: 'member',
    status: 'pending',
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    invitedBy: 'debug_test',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    schemaVersion: 1
  };

  console.log("\n--- TRYING INDIVIDUAL WRITE 1: INVITATION DOC ---");
  try {
    const batch2 = writeBatch(db);
    batch2.set(inviteRef, inviteDoc);
    await batch2.commit();
    console.log("✅ INVITATION DOC WRITE SUCCESSFUL!");
  } catch (err) {
    console.error("❌ INVITATION DOC WRITE FAILED:", err);
  }

  console.log("\n--- TRYING INDIVIDUAL WRITE 2: ACTIVE POINTER DOC ---");
  try {
    const batch3 = writeBatch(db);
    batch3.set(activeRef, {
      invitationId: invitationId,
      workspaceId: workspaceId,
      email: normalizedEmail,
      status: 'pending',
      updatedAt: serverTimestamp()
    });
    await batch3.commit();
    console.log("✅ ACTIVE POINTER DOC WRITE SUCCESSFUL!");
  } catch (err) {
    console.error("❌ ACTIVE POINTER DOC WRITE FAILED:", err);
  }
}

run().catch(console.error);

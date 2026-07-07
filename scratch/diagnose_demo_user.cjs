const { cert, initializeApp: initAdminApp } = require('firebase-admin/app');
const { getAuth: getAdminAuth } = require('firebase-admin/auth');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');
const { getFirestore, writeBatch, doc, getDoc, serverTimestamp } = require('firebase/firestore');

// 1. Initialize Admin SDK to generate custom token
const serviceAccountPath = 'C:\\Users\\prudhvishwar\\Documents\\project-manager\\backend\\serviceAccountKey.json';
const serviceAccount = require(serviceAccountPath);

const adminApp = initAdminApp({
  credential: cert(serviceAccount)
}, 'adminApp');

const adminAuth = getAdminAuth(adminApp);

// 2. Initialize Client SDK
const firebaseConfig = {
  apiKey: "AIzaSyBHZtXb4428fW-nVSTDBVNasZfpLj324Yg",
  authDomain: "weaverbird-project-manager.firebaseapp.com",
  projectId: "weaverbird-project-manager",
  storageBucket: "weaverbird-project-manager.firebasestorage.app",
  messagingSenderId: "973323732782",
  appId: "1:973323732782:web:2c0276e365ad969f779cbf"
};

const clientApp = initializeApp(firebaseConfig);
const clientAuth = getAuth(clientApp);
const clientDb = getFirestore(clientApp);

async function run() {
  const uid = "LYEiTnja9GT6vwgaLK7c37PtF822"; // demo@gmail.com
  const email = "demo@gmail.com";
  const workspaceId = "ws_1783387463831";

  console.log(`Generating custom token for ${email} (UID: ${uid})...`);
  const customToken = await adminAuth.createCustomToken(uid, {
    email: email
  });

  console.log("Signing in with custom token on client...");
  const userCredential = await signInWithCustomToken(clientAuth, customToken);
  const user = userCredential.user;
  console.log("Logged in UID:", user.uid, "Email:", user.email);

  // Check if membership doc exists via client SDK
  try {
    const mRef = doc(clientDb, 'workspaces', workspaceId, 'members', user.uid);
    const mSnap = await getDoc(mRef);
    console.log("Client Read - Member doc exists:", mSnap.exists, mSnap.data());
  } catch (err) {
    console.error("Client Read - Member doc failed:", err.message);
  }

  const invitationId = `tok_test_${Math.random().toString(36).substr(2, 9)}`;
  const inviteRef = doc(clientDb, 'invitations', invitationId);
  const activeRef = doc(clientDb, 'invitationsActive', `${workspaceId}_demo2@gmail.com`);

  const normalizedEmail = "demo2@gmail.com";
  const inviteDoc = {
    id: invitationId,
    token: invitationId,
    email: normalizedEmail,
    workspaceId,
    workspaceName: 'demo',
    role: 'member',
    status: 'pending',
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    invitedBy: 'debug_demo_user',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    schemaVersion: 1
  };

  console.log("\n--- TRYING BATCH WRITE FOR DEMO USER ---");
  const batch = writeBatch(clientDb);
  batch.set(inviteRef, inviteDoc);
  batch.set(activeRef, {
    invitationId: invitationId,
    workspaceId: workspaceId,
    email: normalizedEmail,
    status: 'pending',
    updatedAt: serverTimestamp()
  });

  try {
    await batch.commit();
    console.log("✅ BATCH WRITE SUCCESSFUL FOR DEMO USER!");
  } catch (err) {
    console.error("❌ BATCH WRITE FAILED FOR DEMO USER:", err);
  }

  // Try writing only invitation doc
  console.log("\n--- TRYING INDIVIDUAL WRITE: INVITATION DOC ---");
  try {
    const batch2 = writeBatch(clientDb);
    batch2.set(inviteRef, inviteDoc);
    await batch2.commit();
    console.log("✅ INVITATION DOC WRITE SUCCESSFUL!");
  } catch (err) {
    console.error("❌ INVITATION DOC WRITE FAILED:", err);
  }

  // Try writing only active pointer doc
  console.log("\n--- TRYING INDIVIDUAL WRITE: ACTIVE POINTER DOC ---");
  try {
    const batch3 = writeBatch(clientDb);
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

run().catch(console.error).finally(() => process.exit(0));

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, addDoc, setDoc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInWithCustomToken } = require('firebase/auth');
const { cert, initializeApp: initAdminApp } = require('firebase-admin/app');
const { getAuth: getAdminAuth } = require('firebase-admin/auth');

// 1. Production Config
const firebaseConfig = {
  apiKey: "AIzaSyBHZtXb4428fW-nVSTDBVNasZfpLj324Yg",
  authDomain: "weaverbird-project-manager.firebaseapp.com",
  projectId: "weaverbird-project-manager",
  storageBucket: "weaverbird-project-manager.firebasestorage.app",
  messagingSenderId: "973323732782",
  appId: "1:973323732782:web:2c0276e365ad969f779cbf"
};

const serviceAccountPath = 'C:\\Users\\prudhvishwar\\Documents\\project-manager\\backend\\serviceAccountKey.json';
const serviceAccount = require(serviceAccountPath);

const adminApp = initAdminApp({
  credential: cert(serviceAccount)
}, 'adminApp');

const clientApp = initializeApp(firebaseConfig);
const clientDb = getFirestore(clientApp);
const clientAuth = getAuth(clientApp);

async function run() {
  const targetEmail = "demo@gmail.com";
  const targetUid = "LYEiTnja9GT6vwgaLK7c37PtF822";
  const workspaceId = "ws_1783387463831";

  console.log(`Generating custom token for ${targetEmail} (UID: ${targetUid})...`);
  const customToken = await getAdminAuth(adminApp).createCustomToken(targetUid);

  console.log("Signing in with custom token on client...");
  await signInWithCustomToken(clientAuth, customToken);
  console.log(`Logged in. Current user UID: ${clientAuth.currentUser.uid}, Email: ${clientAuth.currentUser.email}`);

  // Standalone check: does member doc exist from client's perspective?
  const memberRef = doc(clientDb, 'workspaces', workspaceId, 'members', targetUid);
  try {
    const snap = await getDoc(memberRef);
    if (snap.exists()) {
      console.log("✅ Client read member doc successfully:", snap.data());
    } else {
      console.warn("❌ Client read: member doc does not exist!");
    }
  } catch (err) {
    console.error("❌ Client read member doc failed:", err.message);
  }

  // Standalone create: write to /invitations
  const inviteRef = doc(collection(clientDb, 'invitations'));
  const payload = {
    email: "test_new_invite@gmail.com",
    workspaceId,
    workspaceName: 'Studio Workspace',
    role: 'member',
    status: 'pending',
    createdAt: serverTimestamp(),
    createdBy: targetUid,
    invitedBy: "demo@gmail.com",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    schemaVersion: 1
  };

  console.log(`Attempting to setDoc at /invitations/${inviteRef.id}...`);
  try {
    await setDoc(inviteRef, payload);
    console.log("✅ standalone setDoc SUCCESS!");
  } catch (err) {
    console.error("❌ standalone setDoc FAILED:", err.code, err.message);
  }
}

run().catch(console.error).finally(() => process.exit(0));

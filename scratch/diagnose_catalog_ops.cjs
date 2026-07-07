import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-app.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runTest() {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, 'demo@gmail.com', 'password123');
    const uid = userCredential.user.uid;
    console.log(`\n--- Authenticated UID: ${uid} ---`);

    // Get the first workspace for the user
    const wsRef = collection(db, 'workspaces');
    const wsSnap = await getDocs(wsRef);
    let workspaceId = null;
    for (const doc of wsSnap.docs) {
      workspaceId = doc.id;
      break;
    }
    
    if (!workspaceId) {
      console.error("No workspaces found!");
      return;
    }

    console.log(`\n--- Selected Workspace: ${workspaceId} ---`);

    // 1. Test Create
    const tempId = `temp_${Date.now()}`;
    const newDocRef = doc(collection(db, 'workspaces', workspaceId, 'catalog'));
    const itemId = newDocRef.id;
    
    const createPayload = {
      id: itemId,
      tempId: tempId,
      name: 'Test Item',
      price: '100',
      createdAt: serverTimestamp(),
      createdBy: uid,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
      status: 'active',
      schemaVersion: 1
    };

    console.log(`\n--- CREATE OPERATION ---`);
    console.log(`Firestore document path: workspaces/${workspaceId}/catalog/${itemId}`);
    console.log(`Payload:`, createPayload);

    await setDoc(newDocRef, createPayload);
    console.log(`✓ Create succeeded`);

    // 2. Test Update
    const updatePayload = {
      name: 'Test Item Updated',
      price: '200',
      updatedAt: serverTimestamp(),
      updatedBy: uid
    };

    console.log(`\n--- UPDATE OPERATION ---`);
    console.log(`workspaceId: ${workspaceId}`);
    console.log(`catalogId: ${itemId}`);
    console.log(`Firestore document path: workspaces/${workspaceId}/catalog/${itemId}`);
    console.log(`Payload:`, updatePayload);
    console.log(`authenticated uid: ${uid}`);

    try {
      await updateDoc(newDocRef, updatePayload);
      console.log(`✓ Update succeeded`);
    } catch (err) {
      console.error(`✗ Update failed:`, err.message);
    }

    // 3. Test Delete
    console.log(`\n--- DELETE OPERATION ---`);
    console.log(`workspaceId: ${workspaceId}`);
    console.log(`catalogId: ${itemId}`);
    console.log(`Firestore document path: workspaces/${workspaceId}/catalog/${itemId}`);

    const deletePayload = { status: 'deleted', updatedAt: serverTimestamp(), updatedBy: uid };
    try {
      await updateDoc(newDocRef, deletePayload);
      console.log(`✓ Soft Delete succeeded`);
    } catch (err) {
      console.error(`✗ Soft Delete failed:`, err.message);
    }
    
    // Clean up
    await deleteDoc(newDocRef);
    console.log(`\n--- Cleaned up test document ---`);

  } catch (error) {
    console.error("Test error:", error);
  } finally {
    process.exit();
  }
}

require('dotenv').config({ path: '.env' });
runTest();

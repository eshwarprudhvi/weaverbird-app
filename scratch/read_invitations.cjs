const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccountPath = 'C:\\Users\\prudhvishwar\\Documents\\project-manager\\backend\\serviceAccountKey.json';
const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log('=== INVITATIONS ===');
  const invSnap = await db.collection('invitations').get();
  invSnap.forEach(d => {
    console.log(`Invite ID: ${d.id} ->`, d.data());
  });

  console.log('\n=== ACTIVE POINTERS ===');
  const activeSnap = await db.collection('invitationsActive').get();
  activeSnap.forEach(d => {
    console.log(`Pointer ID: ${d.id} ->`, d.data());
  });
}

run().catch(console.error);

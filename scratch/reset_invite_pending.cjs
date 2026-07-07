const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const serviceAccountPath = 'C:\\Users\\prudhvishwar\\Documents\\project-manager\\backend\\serviceAccountKey.json';
const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  const invitationId = 'tok_test_kvst0gew7';
  const activePointerId = 'ws_1783387463831_demo2@gmail.com';

  console.log(`Resetting invitation ${invitationId} to pending...`);
  await db.collection('invitations').doc(invitationId).update({
    status: 'pending',
    declinedAt: null,
    updatedAt: FieldValue.serverTimestamp()
  });

  console.log(`Resetting active pointer ${activePointerId} to pending...`);
  await db.collection('invitationsActive').doc(activePointerId).update({
    status: 'pending',
    updatedAt: FieldValue.serverTimestamp()
  });

  console.log('✅ Invitation successfully reset to pending!');
}

run().catch(console.error);

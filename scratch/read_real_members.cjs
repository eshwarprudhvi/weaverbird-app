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
  console.log('=== WORKSPACES ===');
  const wsSnap = await db.collection('workspaces').get();
  for (const docSnap of wsSnap.docs) {
    const data = docSnap.data();
    console.log(`Workspace ID: ${docSnap.id}`);
    console.log(`  Name: ${data.companyName || data.name}`);
    console.log(`  Status: ${data.status}`);
    
    const membersSnap = await docSnap.ref.collection('members').get();
    membersSnap.forEach(mSnap => {
      console.log(`    Member ID: ${mSnap.id}, Email: ${mSnap.data().email}, Role: ${mSnap.data().role}, Status: ${mSnap.data().status}`);
    });
  }

  console.log('\n=== CURRENT WORKSPACE INDICES ===');
  const indexSnap = await db.collection('workspaceIndex').get();
  indexSnap.forEach(docSnap => {
    console.log(`User: ${docSnap.id} ->`, docSnap.data());
  });
}

run().catch(console.error);

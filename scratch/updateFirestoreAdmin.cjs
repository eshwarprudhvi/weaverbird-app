const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccountPath = 'C:\\Users\\prudhvishwar\\Documents\\project-manager\\backend\\serviceAccountKey.json';
const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log("Updating system/update Firestore document to 1.1.11 via Admin SDK...");
  const docRef = db.collection('system').doc('update');
  await docRef.set({
    version: '1.1.11',
    url: 'https://weaverbird-app.vercel.app/1.1.11.zip'
  }, { merge: true });
  console.log("✅ Successfully updated to 1.1.11 in Firestore!");
}

run().catch(console.error);

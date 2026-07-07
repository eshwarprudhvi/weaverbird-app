const { cert, initializeApp: initAdminApp } = require('firebase-admin/app');
const { getAuth: getAdminAuth } = require('firebase-admin/auth');

const serviceAccountPath = 'C:\\Users\\prudhvishwar\\Documents\\project-manager\\backend\\serviceAccountKey.json';
const serviceAccount = require(serviceAccountPath);

const adminApp = initAdminApp({
  credential: cert(serviceAccount)
}, 'adminApp');

const adminAuth = getAdminAuth(adminApp);

async function run() {
  console.log("Fetching auth user info for demo@gmail.com...");
  try {
    const userRecord = await adminAuth.getUserByEmail("demo@gmail.com");
    console.log(`Found User:`);
    console.log(`- UID: ${userRecord.uid}`);
    console.log(`- Email: ${userRecord.email}`);
    console.log(`- ProviderData:`, userRecord.providerData.map(p => ({ providerId: p.providerId, uid: p.uid, email: p.email })));
  } catch (err) {
    console.error("Error fetching user by email:", err.message);
  }
}

run().catch(console.error).finally(() => process.exit(0));

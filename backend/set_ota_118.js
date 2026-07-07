const { db } = require('./src/config/firebase');

async function run() {
  try {
    await db.collection('system').doc('update').set({
      version: '1.1.8',
      url: 'https://weaverbird-app.vercel.app/1.1.8.zip'
    }, { merge: true });
    console.log("✅ Successfully updated Firestore /system/update to version 1.1.8 pointing to Vercel!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err);
    process.exit(1);
  }
}

run();

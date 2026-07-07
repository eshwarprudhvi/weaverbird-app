import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-app.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  const wsRef = collection(db, 'workspaces');
  const wsSnap = await getDocs(wsRef);
  let checked = 0;
  for (const doc of wsSnap.docs) {
    const catRef = collection(db, 'workspaces', doc.id, 'catalog');
    const catSnap = await getDocs(catRef);
    if (!catSnap.empty) {
      console.log(`Workspace ${doc.id} catalog:`);
      catSnap.docs.forEach(c => console.log(c.id, c.data()));
      checked++;
      if (checked > 2) break;
    }
  }
}

test().catch(console.error);

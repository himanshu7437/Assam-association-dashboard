import { db } from "./src/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

async function checkData() {
  const collections = ["membership_submissions", "contact_submissions", "albums", "services", "committee", "notices"];
  
  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Collection "${colName}": ${snap.size} documents found.`);
    } catch (e: any) {
      console.error(`Error checking "${colName}": ${e.message}`);
    }
  }
}

checkData();

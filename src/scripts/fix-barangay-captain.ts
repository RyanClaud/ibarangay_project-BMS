/**
 * Script to fix Barangay Captain accounts that were incorrectly saved as Residents
 * 
 * Run this script to:
 * 1. Find users with role "Resident" but have barangay captain email patterns
 * 2. Update their role to "Barangay Captain"
 * 3. Remove residentId field (staff shouldn't have this)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore';
import { firebaseConfig } from '../firebase/config';

async function fixBarangayCaptainAccounts() {
  console.log('🔧 Starting Barangay Captain Account Fix...\n');

  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);

  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    let fixedCount = 0;

    console.log(`📊 Found ${usersSnapshot.size} total users\n`);

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Check if this looks like it should be a Barangay Captain
      // (has "captain" in email or was manually identified)
      const shouldBeBarangayCaptain = 
        userData.email?.toLowerCase().includes('brgycaptain') ||
        userData.email?.toLowerCase().includes('captain') ||
        userData.email?.toLowerCase().includes('brgy.captain');

      if (shouldBeBarangayCaptain && userData.role === 'Resident') {
        console.log(`🔍 Found misclassified account:`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Current Role: ${userData.role}`);
        console.log(`   Has residentId: ${!!userData.residentId}`);
        
        // Fix the account
        const userRef = doc(firestore, 'users', userDoc.id);
        await updateDoc(userRef, {
          role: 'Barangay Captain',
          residentId: deleteField(), // Remove residentId field
        });

        console.log(`   ✅ Fixed! Updated to Barangay Captain\n`);
        fixedCount++;
      }
    }

    console.log(`\n✨ Fix Complete!`);
    console.log(`📊 Fixed ${fixedCount} account(s)`);
    
    if (fixedCount === 0) {
      console.log('\n💡 No accounts needed fixing. If you still have issues:');
      console.log('   1. Manually update the role in Firestore Console');
      console.log('   2. Remove the residentId field');
      console.log('   3. Make sure barangayId is set correctly');
    }

  } catch (error) {
    console.error('❌ Error fixing accounts:', error);
  }
}

// Run the script
fixBarangayCaptainAccounts()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

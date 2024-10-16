const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin SDK
// json s privatnimi udaji, dostanes z firebase webovky
const serviceAccount = require('./pk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// json s daty pro import
const data = JSON.parse(fs.readFileSync('./import.json', 'utf8'));

// Recursive function to add data to Firestore
const importData = async (collectionPath, jsonData) => {
  for (const [key, value] of Object.entries(jsonData)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      // This is an object, so we check if it should be a document or a sub-collection
      const documentRef = db.collection(collectionPath).doc(key);
      
      // Separate fields from potential sub-collections
      const fields = {};
      const subCollections = {};
      
      for (const [subKey, subValue] of Object.entries(value)) {
        if (typeof subValue === 'object' && !Array.isArray(subValue)) {
          // Treat as a sub-collection
          subCollections[subKey] = subValue;
        } else {
          // Treat as a field
          fields[subKey] = subValue;
        }
      }

      // Add the document fields
      await documentRef.set(fields);

      // Add sub-collections if any
      for (const [subCollectionName, subCollectionData] of Object.entries(subCollections)) {
        await importData(`${collectionPath}/${key}/${subCollectionName}`, subCollectionData);
      }
    } else {
      // If it's not an object, this is an invalid structure for Firestore
      console.error(`Invalid structure for document ${key}. Each document must be an object.`);
    }
  }
};

//nazev collection NESMI existovat (mozna muze a prepise se?)
importData('fotbal', data)
  .then(() => console.log('Data imported successfully'))
  .catch((error) => console.error('Error importing data:', error));


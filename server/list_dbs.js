import mongoose from 'mongoose';
import 'dotenv/config';

async function listDbs() {
  try {
    console.log('Connecting...');
    await mongoose.connect('mongodb://127.0.0.1:27017/admin', { serverSelectionTimeoutMS: 5000 });
    console.log('Connected.');
    const result = await mongoose.connection.db.admin().listDatabases();
    console.log('Databases:');
    result.databases.forEach(db => {
      console.log(`- ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Also check pu_tiffin specifically
    const puTiffin = result.databases.find(d => d.name === 'pu_tiffin');
    if (puTiffin) {
        console.log('\nFound pu_tiffin database.');
        const tiffinDb = mongoose.connection.useDb('pu_tiffin');
        const collections = await tiffinDb.db.listCollections().toArray();
        console.log('Collections in pu_tiffin:');
        for (const c of collections) {
            const count = await tiffinDb.db.collection(c.name).countDocuments();
            console.log(`  - ${c.name}: ${count} docs`);
        }
    } else {
        console.log('\n❌ pu_tiffin database NOT found in the list!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

listDbs();

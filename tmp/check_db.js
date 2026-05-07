import mongoose from 'mongoose';
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pu_tiffin';

async function checkDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`- ${coll.name}: ${count} documents`);
      if (coll.name === 'orders') {
          const latestOrder = await mongoose.connection.db.collection(coll.name).findOne({}, { sort: { createdAt: -1 } });
          console.log('Latest Order:', JSON.stringify(latestOrder, null, 2));
      }
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkDb();

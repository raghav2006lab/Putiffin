import mongoose from 'mongoose';
import 'dotenv/config';
import Order from './models/Order.js';
import MenuItem from './models/MenuItem.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pu_tiffin';

async function verify() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connection: SUCCESS');
    
    const orderCount = await Order.countDocuments();
    const menuCount = await MenuItem.countDocuments();
    
    console.log(`📊 Statistics:`);
    console.log(`   - Total Orders: ${orderCount}`);
    console.log(`   - Total Menu Items: ${menuCount}`);
    
    if (orderCount > 0) {
      const lastOrder = await Order.findOne().sort({ createdAt: -1 });
      console.log(`📝 Latest Order details:`);
      console.log(`   - Order ID: ${lastOrder._id}`);
      console.log(`   - Customer: ${lastOrder.customer_name}`);
      console.log(`   - Amount: ₹${lastOrder.total_amount}`);
      console.log(`   - Date: ${lastOrder.createdAt}`);
    } else {
      console.log('ℹ️ No orders found in the database yet.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB Connection: FAILED');
    console.error(`   Error: ${err.message}`);
    process.exit(1);
  }
}

verify();

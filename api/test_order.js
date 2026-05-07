import mongoose from 'mongoose';
import 'dotenv/config';
import Order from './models/Order.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pu_tiffin';

async function createTestOrder() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const countBefore = await Order.countDocuments();
    console.log(`Orders before: ${countBefore}`);
    
    const newOrder = await Order.create({
      customer_name: "Test User",
      phone: "9876543210",
      hostel: "BH-1",
      items: [{
        name: "Test Food",
        price: 150,
        qty: 1
      }],
      total_amount: 150,
      status: "pending"
    });
    
    console.log('✅ Test order created successfully:', newOrder._id);
    
    const countAfter = await Order.countDocuments();
    console.log(`Orders after: ${countAfter}`);
    
    // Clean up if you want, but I'll leave it for now so I can show it to the user.
    // await Order.deleteOne({ _id: newOrder._id });
    // console.log('🗑️ Test order cleaned up.');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating order:', err.message);
    process.exit(1);
  }
}

createTestOrder();

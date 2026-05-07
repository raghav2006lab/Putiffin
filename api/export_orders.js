import mongoose from 'mongoose';
import 'dotenv/config';
import Order from './models/Order.js';
import fs from 'fs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pu_tiffin';

async function exportOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const orders = await Order.find().sort({ createdAt: -1 });
    
    if (orders.length === 0) {
      console.log('ℹ️ No orders found to export.');
      process.exit(0);
    }

    // CSV Headers
    const headers = [
      'Order #',
      'Date',
      'Customer Name',
      'Phone',
      'Hostel',
      'Room',
      'Items',
      'Total Amount (₹)',
      'Status',
      'Notes'
    ];

    const rows = orders.map(o => {
      const itemsString = o.items.map(it => `${it.name}${it.variant ? ` (${it.variant})` : ''} x${it.qty}`).join('; ');
      return [
        o.order_number || '',
        new Date(o.createdAt).toLocaleString(),
        `"${o.customer_name.replace(/"/g, '""')}"`,
        o.phone,
        o.hostel,
        o.room_number || '',
        `"${itemsString.replace(/"/g, '""')}"`,
        o.total_amount,
        o.status,
        `"${(o.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    const fileName = 'orders_export.csv';
    fs.writeFileSync(fileName, csvContent);
    
    console.log(`✅ Successfully exported ${orders.length} orders to ${fileName}`);
    console.log(`📂 You can now open ${fileName} in Excel.`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Export failed:', err.message);
    process.exit(1);
  }
}

exportOrders();

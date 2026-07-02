require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  const db = mongoose.connection.db;
  const studentEmail = 'sandipan.goswami@synthweb.in';
  
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  const res = await db.collection('users').updateOne(
    { email: studentEmail },
    { $set: { password: hashedPassword, isEmailVerified: true, isActive: true } }
  );

  console.log('Password update result:', res);
  await mongoose.disconnect();
}

run().catch(console.error);

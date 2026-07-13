require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/statvox';

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const result = await db.collection('users').updateOne(
    { email: 'anassamiri87@gmail.com' },
    { $set: { role: 'admin' } }
  );
  console.log('Modified:', result.modifiedCount);
  const user = await db.collection('users').findOne({ email: 'anassamiri87@gmail.com' });
  console.log('User now:', user.name, user.role);
  await mongoose.disconnect();
}

main().catch(console.error);

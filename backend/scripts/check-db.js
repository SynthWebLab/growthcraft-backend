require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  const db = mongoose.connection.db;

  const bootcamps = await db.collection('bootcamps').find({}).toArray();
  console.log('=== BOOTCAMPS ===');
  console.log(bootcamps.map(b => ({ id: b._id, title: b.title, status: b.status })));

  const batches = await db.collection('batches').find({}).toArray();
  console.log('=== BATCHES ===');
  console.log(batches.map(b => ({ id: b._id, code: b.code, status: b.status, bootcampId: b.bootcampId, courseId: b.courseId })));

  const enrollments = await db.collection('enrollments').find({}).toArray();
  console.log('=== unified ENROLLMENTS ===');
  console.log(enrollments.map(e => ({ id: e._id, studentUserId: e.studentUserId, batchId: e.batchId, status: e.status })));

  const eventEnrollments = await db.collection('eventenrollments').find({}).toArray();
  console.log('=== EVENT ENROLLMENTS ===');
  console.log(eventEnrollments.map(e => ({ id: e._id, email: e.email, eventId: e.eventId, title: e.title, status: e.status })));

  await mongoose.disconnect();
}

run().catch(console.error);

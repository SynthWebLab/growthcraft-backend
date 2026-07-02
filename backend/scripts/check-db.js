require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  const db = mongoose.connection.db;

  const users = await db.collection('users').find({}).toArray();
  console.log('=== USERS ===');
  console.log(users.map(u => ({ id: u._id, name: u.fullName, email: u.email, role: u.role })));

  const employers = await db.collection('employerprofiles').find({}).toArray();
  console.log('=== EMPLOYERS ===');
  console.log(employers.map(e => ({ id: e._id, userId: e.userId, companyName: e.companyName })));

  const jobs = await db.collection('jobpostings').find({}).toArray();
  console.log('=== JOBS ===');
  console.log(jobs.map(j => ({ id: j._id, title: j.title, hiringPartnerId: j.hiringPartnerId, status: j.status })));

  const apps = await db.collection('jobapplications').find({}).toArray();
  console.log('=== APPLICATIONS ===');
  console.log(apps.map(a => ({ id: a._id, jobId: a.jobId, studentId: a.studentId, status: a.status })));

  await mongoose.disconnect();
}

run().catch(console.error);

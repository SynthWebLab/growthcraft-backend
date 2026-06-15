import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import { JwtConfig } from '../src/config/jwt.config';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5002;
const BASE_URL = `http://localhost:${PORT}`;
const MONGODB_URI = process.env.MONGODB_URI;

// Helper functions to find items in responses
function findCourse(res: any, id: string) {
  const arr = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.items || res.data?.data?.courses || []);
  return arr.find((c: any) => c.id === id || c._id === id);
}

function findBootcamp(res: any, id: string) {
  const arr = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.items || res.data?.data?.bootcamps || []);
  return arr.find((b: any) => b.id === id || b._id === id);
}

function findProgram(res: any, id: string) {
  const arr = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.programs || res.data?.data?.items || []);
  return arr.find((p: any) => p._id === id || p.id === id);
}

async function run() {
  console.log('🚀 Running Dynamic CTA Verification Tests...\n');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in env');
    process.exit(1);
  }

  // Connect to DB
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  try {
    // 1. Get a student
    const student = await mongoose.connection.db.collection('users').findOne({ 
      $or: [{ role: 'Student' }, { role: 'student' }]
    });

    if (!student) {
      console.error('❌ No student user found in database');
      process.exit(1);
    }
    const userId = student._id.toString();
    console.log(`👤 Found student: ${student.fullName} (${student.email}) [ID: ${userId}]`);

    // Generate JWT access token for student
    const jwtConfig = JwtConfig.getInstance();
    const token = jwtConfig.generateAccessToken({
      userId,
      email: student.email,
      role: student.role
    });
    console.log('🔑 Generated access token for student');

    const authHeaders = {
      Authorization: `Bearer ${token}`
    };

    // 2. Find a course, event/bootcamp, and training program
    const Course = mongoose.models.Course || mongoose.model('Course', new mongoose.Schema({}, { strict: false }));
    const Bootcamp = mongoose.models.Bootcamp || mongoose.model('Bootcamp', new mongoose.Schema({}, { strict: false }));
    const TrainingProgram = mongoose.models.TrainingProgram || mongoose.model('TrainingProgram', new mongoose.Schema({}, { strict: false }));

    const courseDoc = await Course.findOne({ isPublished: true }) || await Course.findOne();
    const bootcampDoc = await Bootcamp.findOne({ isPublished: true }) || await Bootcamp.findOne();
    const trainingProgramDoc = await TrainingProgram.findOne({ isPublished: true }) || await TrainingProgram.findOne();

    if (!courseDoc || !bootcampDoc || !trainingProgramDoc) {
      console.error('❌ Missing published course, bootcamp or training program in database');
      process.exit(1);
    }

    const courseId = courseDoc._id.toString();
    const courseSlug = (courseDoc as any).get ? (courseDoc as any).get('slug') : (courseDoc as any).slug;
    
    const bootcampId = bootcampDoc._id.toString();
    const bootcampSlug = (bootcampDoc as any).get ? (bootcampDoc as any).get('slug') : (bootcampDoc as any).slug;

    const trainingProgramId = trainingProgramDoc._id.toString();
    const trainingProgramSlug = (trainingProgramDoc as any).get ? (trainingProgramDoc as any).get('slug') : (trainingProgramDoc as any).slug;

    console.log(`📚 Target Course: ${courseSlug} [ID: ${courseId}]`);
    console.log(`🎪 Target Bootcamp/Event: ${bootcampSlug} [ID: ${bootcampId}]`);
    console.log(`🎓 Target Training Program: ${trainingProgramSlug} [ID: ${trainingProgramId}]`);

    console.log('\n--- TEST CASE 1: GUEST USER (Unauthenticated) ---');
    
    const guestCoursesRes = await axios.get(`${BASE_URL}/api/v1/courses`);
    const guestCourse = findCourse(guestCoursesRes, courseId);
    console.log('Guest Course CTA:', guestCourse ? { primary: guestCourse.primaryCTA, secondary: guestCourse.secondaryCTA, isEnrolled: guestCourse.isEnrolled, hasCallback: guestCourse.hasCallbackRequest } : 'Not found');

    const guestBootcampsRes = await axios.get(`${BASE_URL}/api/v1/events?search=${bootcampSlug}`);
    const guestBootcamp = findBootcamp(guestBootcampsRes, bootcampId);
    console.log('Guest Bootcamp CTA:', guestBootcamp ? { primary: guestBootcamp.primaryCTA, secondary: guestBootcamp.secondaryCTA, isEnrolled: guestBootcamp.isEnrolled, hasCallback: guestBootcamp.hasCallbackRequest } : 'Not found');

    const guestProgramsRes = await axios.get(`${BASE_URL}/api/v1/training-programs`);
    const guestProgram = findProgram(guestProgramsRes, trainingProgramId);
    console.log('Guest Program CTA:', guestProgram ? { primary: guestProgram.primaryCTA, secondary: guestProgram.secondaryCTA, isEnrolled: guestProgram.isEnrolled, hasCallback: guestProgram.hasCallbackRequest } : 'Not found');

    console.log('\n--- TEST CASE 2: LOGGED-IN NO ENROLLMENT / NO CALLBACK ---');
    const loggedInCoursesRes = await axios.get(`${BASE_URL}/api/v1/courses`, { headers: authHeaders });
    const loggedInCourse = findCourse(loggedInCoursesRes, courseId);
    console.log('Logged-in Course CTA:', loggedInCourse ? { primary: loggedInCourse.primaryCTA, secondary: loggedInCourse.secondaryCTA, isEnrolled: loggedInCourse.isEnrolled, hasCallback: loggedInCourse.hasCallbackRequest } : 'Not found');

    const loggedInBootcampsRes = await axios.get(`${BASE_URL}/api/v1/events?search=${bootcampSlug}`, { headers: authHeaders });
    const loggedInBootcamp = findBootcamp(loggedInBootcampsRes, bootcampId);
    console.log('Logged-in Bootcamp CTA:', loggedInBootcamp ? { primary: loggedInBootcamp.primaryCTA, secondary: loggedInBootcamp.secondaryCTA, isEnrolled: loggedInBootcamp.isEnrolled, hasCallback: loggedInBootcamp.hasCallbackRequest } : 'Not found');

    const loggedInProgramsRes = await axios.get(`${BASE_URL}/api/v1/training-programs`, { headers: authHeaders });
    const loggedInProgram = findProgram(loggedInProgramsRes, trainingProgramId);
    console.log('Logged-in Program CTA:', loggedInProgram ? { primary: loggedInProgram.primaryCTA, secondary: loggedInProgram.secondaryCTA, isEnrolled: loggedInProgram.isEnrolled, hasCallback: loggedInProgram.hasCallbackRequest } : 'Not found');


    console.log('\n--- TEST CASE 3: ENROLLED USER ---');
    
    // Inject mock enrollments in parallel
    const CourseEnrollment = mongoose.models.CourseEnrollment || mongoose.model('CourseEnrollment', new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      courseId: mongoose.Schema.Types.ObjectId,
      status: String
    }, { collection: 'courseenrollments' }));

    const EventEnrollment = mongoose.models.EventEnrollment || mongoose.model('EventEnrollment', new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      eventId: mongoose.Schema.Types.ObjectId,
      status: String
    }, { collection: 'eventenrollments' }));

    const TrainingProgramEnrollment = mongoose.models.TrainingProgramEnrollment || mongoose.model('TrainingProgramEnrollment', new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      programId: mongoose.Schema.Types.ObjectId,
      status: String
    }, { collection: 'trainingprogramenrollments' }));

    // Create enrollments
    const cEnroll = await CourseEnrollment.create({ userId, courseId, status: 'confirmed' });
    const eEnroll = await EventEnrollment.create({ userId, eventId: bootcampId, status: 'confirmed' });
    const tEnroll = await TrainingProgramEnrollment.create({ userId, programId: trainingProgramId, status: 'confirmed' });

    try {
      // Query endpoints as student
      const enrolledCoursesRes = await axios.get(`${BASE_URL}/api/v1/courses`, { headers: authHeaders });
      const enrolledCourse = findCourse(enrolledCoursesRes, courseId);
      console.log('Enrolled Course CTA (Expect Already Enrolled):', enrolledCourse ? { primary: enrolledCourse.primaryCTA, secondary: enrolledCourse.secondaryCTA, isEnrolled: enrolledCourse.isEnrolled } : 'Not found');

      const enrolledBootcampsRes = await axios.get(`${BASE_URL}/api/v1/events?search=${bootcampSlug}`, { headers: authHeaders });
      const enrolledBootcamp = findBootcamp(enrolledBootcampsRes, bootcampId);
      console.log('Enrolled Bootcamp CTA (Expect Already Enrolled):', enrolledBootcamp ? { primary: enrolledBootcamp.primaryCTA, secondary: enrolledBootcamp.secondaryCTA, isEnrolled: enrolledBootcamp.isEnrolled } : 'Not found');

      const enrolledProgramsRes = await axios.get(`${BASE_URL}/api/v1/training-programs`, { headers: authHeaders });
      const enrolledProgram = findProgram(enrolledProgramsRes, trainingProgramId);
      console.log('Enrolled Program CTA (Expect Already Enrolled):', enrolledProgram ? { primary: enrolledProgram.primaryCTA, secondary: enrolledProgram.secondaryCTA, isEnrolled: enrolledProgram.isEnrolled } : 'Not found');

      // Test event details
      const detailRes = await axios.get(`${BASE_URL}/api/v1/events/${bootcampSlug}/details`, { headers: authHeaders });
      const evId = detailRes.data.data.eventDetails.eventId;
      console.log('Enrolled Event Details CTA (Expect Already Enrolled):', evId ? { primary: evId.primaryCTA, secondary: evId.secondaryCTA, isEnrolled: evId.isEnrolled } : 'Not found');

      // Test training program details
      const programDetailRes = await axios.get(`${BASE_URL}/api/v1/training-programs/${trainingProgramSlug}/details`, { headers: authHeaders });
      const pd = programDetailRes.data.data.programDetails;
      console.log('Enrolled Program Details (Expect isEnrolled = true):', pd ? { isEnrolled: pd.isEnrolled, hasCallbackRequest: pd.hasCallbackRequest } : 'Not found');

    } finally {
      // Clean up enrollments
      await CourseEnrollment.deleteOne({ _id: cEnroll._id });
      await EventEnrollment.deleteOne({ _id: eEnroll._id });
      await TrainingProgramEnrollment.deleteOne({ _id: tEnroll._id });
      console.log('🧹 Cleaned up mock enrollments');
    }

    console.log('\n--- TEST CASE 4: CALLBACK REQUESTED USER ---');

    // Inject mock callback requests
    const CourseCallbackRequest = mongoose.models.CourseCallbackRequest || mongoose.model('CourseCallbackRequest', new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      courseId: mongoose.Schema.Types.ObjectId,
      status: String
    }, { collection: 'coursecallbackrequests' }));

    const EventCallbackRequest = mongoose.models.EventCallbackRequest || mongoose.model('EventCallbackRequest', new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      eventId: mongoose.Schema.Types.ObjectId,
      status: String
    }, { collection: 'eventcallbackrequests' }));

    const TrainingProgramCallbackRequest = mongoose.models.TrainingProgramCallbackRequest || mongoose.model('TrainingProgramCallbackRequest', new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      programId: mongoose.Schema.Types.ObjectId,
      status: String
    }, { collection: 'trainingprogramcallbackrequests' }));

    const cCallback = await CourseCallbackRequest.create({ userId, courseId, status: 'pending' });
    const eCallback = await EventCallbackRequest.create({ userId, eventId: bootcampId, status: 'pending' });
    const tCallback = await TrainingProgramCallbackRequest.create({ userId, programId: trainingProgramId, status: 'pending' });

    try {
      // Query endpoints as student
      const callbackCoursesRes = await axios.get(`${BASE_URL}/api/v1/courses`, { headers: authHeaders });
      const callbackCourse = findCourse(callbackCoursesRes, courseId);
      console.log('Callback Course CTA (Expect Callback Requested):', callbackCourse ? { primary: callbackCourse.primaryCTA, secondary: callbackCourse.secondaryCTA, hasCallbackRequest: callbackCourse.hasCallbackRequest } : 'Not found');

      const callbackBootcampsRes = await axios.get(`${BASE_URL}/api/v1/events?search=${bootcampSlug}`, { headers: authHeaders });
      const callbackBootcamp = findBootcamp(callbackBootcampsRes, bootcampId);
      console.log('Callback Bootcamp CTA (Expect Callback Requested):', callbackBootcamp ? { primary: callbackBootcamp.primaryCTA, secondary: callbackBootcamp.secondaryCTA, hasCallbackRequest: callbackBootcamp.hasCallbackRequest } : 'Not found');

      const callbackProgramsRes = await axios.get(`${BASE_URL}/api/v1/training-programs`, { headers: authHeaders });
      const callbackProgram = findProgram(callbackProgramsRes, trainingProgramId);
      console.log('Callback Program CTA (Expect Callback Requested):', callbackProgram ? { primary: callbackProgram.primaryCTA, secondary: callbackProgram.secondaryCTA, hasCallbackRequest: callbackProgram.hasCallbackRequest } : 'Not found');

      // Test event details
      const detailRes = await axios.get(`${BASE_URL}/api/v1/events/${bootcampSlug}/details`, { headers: authHeaders });
      const evId = detailRes.data.data.eventDetails.eventId;
      console.log('Callback Event Details CTA (Expect Callback Requested):', evId ? { primary: evId.primaryCTA, secondary: evId.secondaryCTA, hasCallbackRequest: evId.hasCallbackRequest } : 'Not found');

      // Test training program details
      const programDetailRes = await axios.get(`${BASE_URL}/api/v1/training-programs/${trainingProgramSlug}/details`, { headers: authHeaders });
      const pd = programDetailRes.data.data.programDetails;
      console.log('Callback Program Details (Expect hasCallbackRequest = true):', pd ? { isEnrolled: pd.isEnrolled, hasCallbackRequest: pd.hasCallbackRequest } : 'Not found');

    } finally {
      // Clean up callback requests
      await CourseCallbackRequest.deleteOne({ _id: cCallback._id });
      await EventCallbackRequest.deleteOne({ _id: eCallback._id });
      await TrainingProgramCallbackRequest.deleteOne({ _id: tCallback._id });
      console.log('🧹 Cleaned up mock callback requests');
    }

  } catch (err: any) {
    console.error('❌ Error during test run:', err.message);
    if (err.response) {
      console.error('   Response status:', err.response.status);
      console.error('   Response data:', JSON.stringify(err.response.data, null, 2));
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
}

run().catch(console.error);

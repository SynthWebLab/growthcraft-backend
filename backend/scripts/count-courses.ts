import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const courseSchema = new mongoose.Schema({
  title: String,
  slug: String,
  description: String,
  category: String,
  difficultyLevel: String,
  duration: Number,
  lessonsCount: Number,
  price: Number,
  originalPrice: Number,
  rating: Number,
  instructor: {
    name: String,
    avatar: String,
  },
  tags: [String],
  enrollmentCount: Number,
  isActive: Boolean,
  isDraft: Boolean,
  publishedAt: Date,
  type: String,
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);

async function countCourses() {
  console.log('Script started...');
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/growthcraft';
    
    console.log('Connecting to MongoDB...');
    console.log('URI:', mongoUri ? 'Found' : 'Not found');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully\n');

    const totalCourses = await Course.countDocuments();
    console.log(`Total Courses: ${totalCourses}`);

    const activeCourses = await Course.countDocuments({ isActive: true, isDraft: false });
    const draftCourses = await Course.countDocuments({ isDraft: true });
    const inactiveCourses = await Course.countDocuments({ isActive: false });

    console.log(`\nBreakdown:`);
    console.log(`  Active: ${activeCourses}`);
    console.log(`  Draft: ${draftCourses}`);
    console.log(`  Inactive: ${inactiveCourses}`);

    const regularCourses = await Course.countDocuments({ type: 'Course' });
    const bootcamps = await Course.countDocuments({ type: 'Bootcamp' });

    console.log(`\nBy Type:`);
    console.log(`  Courses: ${regularCourses}`);
    console.log(`  Bootcamps: ${bootcamps}`);

    const categories = await Course.distinct('category');
    console.log(`\nCategories (${categories.length}):`);
    for (const category of categories) {
      const count = await Course.countDocuments({ category });
      console.log(`  ${category}: ${count}`);
    }

    const courses = await Course.find()
      .select('title type category price enrollmentCount isActive isDraft')
      .sort({ createdAt: -1 });

    console.log(`\nCourse List:`);
    if (courses.length === 0) {
      console.log('  No courses found');
    } else {
      courses.forEach((course, index) => {
        const status = course.isDraft ? 'Draft' : course.isActive ? 'Active' : 'Inactive';
        console.log(`  ${index + 1}. ${course.title} [${course.type}] - ${status}`);
      });
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
    process.exit(0);
  }
}

console.log('About to run countCourses...');
countCourses();

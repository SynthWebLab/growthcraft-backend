import { databaseConfig } from '../src/config/database.config';
import mongoose from 'mongoose';

async function updateDatesToTBA() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await databaseConfig.connect();
    const db = mongoose.connection.db!;
    console.log(`Connected to database: ${db.databaseName}`);

    // 1. Update Courses
    const courseResult = await db.collection('courses').updateMany(
      {},
      {
        $set: {
          isDateTBA: true,
          startDate: null,
        },
      }
    );
    console.log(`✓ Updated ${courseResult.modifiedCount} courses to "To be announced" (isDateTBA = true)`);

    // 2. Update Training Programs
    const tpResult = await db.collection('trainingprograms').updateMany(
      {},
      {
        $set: {
          isDateTBA: true,
          startDate: null,
        },
      }
    );
    console.log(`✓ Updated ${tpResult.modifiedCount} training programs to "To be announced" (isDateTBA = true)`);

    // 3. Update Bootcamps / Events
    const bootcampResult = await db.collection('bootcamps').updateMany(
      {},
      {
        $set: {
          isDateTBA: true,
          startDate: null,
          endDate: null,
          registrationDeadline: null,
        },
      }
    );
    console.log(`✓ Updated ${bootcampResult.modifiedCount} bootcamps/events to "To be announced" (isDateTBA = true)`);

    // 4. Update EventDetails (venue.date and venue.time)
    const eventDetailsResult = await db.collection('eventdetails').updateMany(
      {},
      {
        $set: {
          isDateTBA: true,
          'venue.date': 'To be announced',
          'venue.time': 'To be announced',
        },
      }
    );
    console.log(`✓ Updated ${eventDetailsResult.modifiedCount} event details to "To be announced"`);

    console.log('\nAll course, training program, and event dates have been successfully updated to "To be announced"!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await databaseConfig.disconnect();
    console.log('Disconnected from database.');
  }
}

updateDatesToTBA();

import 'tsconfig-paths/register';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Batch, BatchStatus } from '@/database/models';

dotenv.config();

async function checkBatches() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // Check total batches
    const totalBatches = await Batch.countDocuments();
    console.log(`📊 Total batches in database: ${totalBatches}\n`);

    if (totalBatches === 0) {
      console.log('❌ No batches found in database!');
      console.log('\n💡 Create some batches first using:');
      console.log('   POST /api/v1/admin/batches\n');
      return;
    }

    // Get all batches with details
    const allBatches = await Batch.find()
      .select('code status startDate endDate capacity enrolledCount')
      .sort({ startDate: -1 })
      .exec();

    console.log('📋 All Batches:\n');
    allBatches.forEach((batch, index) => {
      console.log(`${index + 1}. ${batch.code}`);
      console.log(`   Status: ${batch.status}`);
      console.log(`   Start Date: ${batch.startDate.toISOString().split('T')[0]}`);
      console.log(`   End Date: ${batch.endDate.toISOString().split('T')[0]}`);
      console.log(`   Capacity: ${batch.enrolledCount}/${batch.capacity}`);
      
      // Check if visible in public endpoint
      const isOpen = batch.status === BatchStatus.OPEN || batch.status === BatchStatus.FILLING;
      const isFuture = batch.startDate >= new Date();
      const isPublic = isOpen && isFuture;
      
      console.log(`   Public Visibility: ${isPublic ? '✅ YES' : '❌ NO'} (${isOpen ? 'Open/Filling' : 'Wrong status'}, ${isFuture ? 'Future date' : 'Past date'})`);
      console.log('');
    });

    // Check public-visible batches
    const today = new Date();
    const publicBatches = await Batch.find({
      status: { $in: [BatchStatus.OPEN, BatchStatus.FILLING] },
      startDate: { $gte: today },
    }).exec();

    console.log(`\n🌐 Public Endpoint Would Show: ${publicBatches.length} batches`);
    
    if (publicBatches.length === 0) {
      console.log('\n⚠️  No batches are visible to public because:');
      console.log('   - All batches have status other than Open/Filling, OR');
      console.log('   - All batches have past start dates\n');
      console.log('💡 To make batches visible:');
      console.log('   1. Update status to "Open" or "Filling"');
      console.log('   2. Set startDate to a future date');
      console.log('   3. Use: PATCH /api/v1/admin/batches/:id');
      console.log('      {"status": "Open"}\n');
    } else {
      console.log('\n✅ These batches are visible on public endpoint:');
      publicBatches.forEach(b => {
        console.log(`   - ${b.code} (${b.status}, starts ${b.startDate.toISOString().split('T')[0]})`);
      });
    }

    console.log(`\n🔐 Admin Endpoint Would Show: ${totalBatches} batches (all)`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkBatches();

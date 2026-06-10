# Nightly Enrollment Metrics Job - GC-601-T3

## Overview

Automated background job that runs every night at **02:00 IST** to recompute attendance percentage and average rubric scores for all active enrollments.

## Features

- **Automatic Scheduling**: Runs daily at 02:00 IST via BullMQ cron
- **Idempotent**: Safe to run multiple times
- **Fault Tolerant**: Individual enrollment failures don't stop the entire job
- **Retry Logic**: Automatic retries with exponential backoff
- **Comprehensive Logging**: Full job execution tracking

## Architecture

```
┌─────────────────────────────────────────┐
│  BullMQ Cron Scheduler (02:00 IST)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Find Active Enrollments               │
│  (status = 'Confirmed')                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  FOR EACH Enrollment:                  │
│                                         │
│  1. Count attendance (Present/Late)    │
│  2. Count total classes held           │
│  3. Calculate attendance %             │
│  4. Fetch all progress notes           │
│  5. Calculate average rubric score     │
│  6. Update enrollment record           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Log Results (success/error counts)    │
└─────────────────────────────────────────┘
```

## Database Models

### 1. Attendance Model
```typescript
{
  studentUserId: ObjectId,      // Student reference
  batchId: ObjectId,            // Batch reference
  attendanceDate: Date,         // Class date
  status: 'Present' | 'Absent' | 'Late' | 'Excused',
  remarks?: string,
  markedBy: ObjectId            // Who marked attendance
}
```

### 2. ProgressNote Model
```typescript
{
  studentUserId: ObjectId,      // Student reference
  batchId: ObjectId,            // Batch reference
  mentorId: ObjectId,           // Mentor who wrote note
  noteDate: Date,               // Note creation date
  rubricScore: number,          // 0-100 score
  feedback: string,             // Detailed feedback
  strengths?: string,
  areasForImprovement?: string
}
```

### 3. Enrollment Model (Updated Fields)
```typescript
{
  attendancePercent: number,    // 0-100 (updated by job)
  avgRubricScore: number,       // 0-100 (updated by job)
  // ... other fields
}
```

## Metrics Calculation

### Attendance Percentage
```typescript
attendancePercent = (Present + Late classes / Total unique class dates) × 100
```

### Average Rubric Score
```typescript
avgRubricScore = SUM(all rubric scores) / COUNT(progress notes)
```

## Job Configuration

- **Queue Name**: `enrollment-metrics`
- **Schedule**: Daily at 02:00 IST (20:30 UTC)
- **Cron Pattern**: `30 20 * * *`
- **Timezone**: UTC (converted from IST)
- **Retry Attempts**: 3
- **Retry Backoff**: Exponential (starts at 5 seconds)
- **Concurrency**: 1 (processes one job at a time)

## Requirements

- **Redis**: Required for BullMQ job queue
- **MongoDB**: Stores all data
- **Node.js**: v16+

## Setup Instructions

### 1. Ensure Redis is Running

```bash
# Check Redis connection
redis-cli ping
# Should return: PONG
```

### 2. Environment Variables

Add to `.env` file:
```env
REDIS_URL=localhost:6379
REDIS_PASSWORD=your_redis_password  # if applicable
```

### 3. Install Dependencies

Already installed:
```bash
npm install bullmq
```

### 4. Start the Server

The job will automatically initialize when the server starts:

```bash
npm run dev
```

You should see in logs:
```
✓ Redis connected successfully
✓ Scheduled jobs initialized
Scheduled nightly enrollment metrics job at 02:00 IST (20:30 UTC)
```

## Testing

### Test 1: Seed Test Data

Create sample attendance and progress notes:

```bash
npm run seed:metrics
```

This creates:
- 10 attendance records (8 present, 2 absent = 80%)
- 5 progress notes (scores: 85, 90, 78, 92, 88 = avg 86.6)

### Test 2: Trigger Job Manually

Run the job immediately without waiting for 02:00 IST:

```bash
npm run trigger-metrics
```

### Test 3: Check Results

Query the database to verify updates:

```javascript
// Find the enrollment
const enrollment = await Enrollment.findOne({ status: 'Confirmed' });

console.log(enrollment.attendancePercent); // Should be 80
console.log(enrollment.avgRubricScore);    // Should be 86.6
```

## Monitoring

### View Logs

Job execution is logged to:
- Console (stdout)
- `logs/app.log`
- `logs/error.log`

### Log Messages

**Job Start:**
```
Starting nightly enrollment metrics recomputation job
Found X active enrollments to process
```

**Processing:**
```
Updated metrics for enrollment <id>: attendance=80%, score=86.6
```

**Job Complete:**
```
Completed enrollment metrics job in 1234ms: X successful, Y errors
```

### Job Queue Monitoring

BullMQ provides monitoring capabilities. You can:

1. **Install BullMQ Board** (optional):
```bash
npm install @bull-board/express @bull-board/api
```

2. **Check Redis directly**:
```bash
redis-cli
KEYS bull:enrollment-metrics:*
```

## Error Handling

### Individual Enrollment Errors
- Logged but don't stop the job
- Other enrollments continue processing
- Failed enrollments are retried in the next run

### Job-Level Errors
- Automatic retry (up to 3 attempts)
- Exponential backoff between retries
- Full error logging

### Common Issues

**Issue**: Job not starting
- **Check**: Redis connection in logs
- **Fix**: Ensure Redis is running and credentials are correct

**Issue**: No enrollments processed
- **Check**: Are there enrollments with status = 'Confirmed'?
- **Fix**: Create active enrollments first

**Issue**: Metrics always 0
- **Check**: Are there attendance records and progress notes?
- **Fix**: Run `npm run seed:metrics` to create test data

## File Structure

```
backend/
├── src/
│   ├── database/
│   │   └── models/
│   │       ├── Attendance.model.ts      # NEW
│   │       ├── ProgressNote.model.ts    # NEW
│   │       ├── Enrollment.model.ts      # (existing)
│   │       └── index.ts                 # UPDATED
│   ├── jobs/
│   │   ├── enrollment-metrics.job.ts    # NEW - Main job logic
│   │   └── index.ts                     # NEW - Job initializer
│   └── server.ts                        # UPDATED - Initialize jobs
├── scripts/
│   ├── seed-test-metrics-data.ts        # NEW - Test data seeder
│   └── trigger-metrics-job.ts           # NEW - Manual trigger
└── package.json                         # UPDATED - New scripts
```

## API Endpoints (Optional - Future Enhancement)

You can add these endpoints to manually trigger or monitor the job:

```typescript
// POST /api/admin/jobs/trigger-metrics
// Manually trigger the job

// GET /api/admin/jobs/metrics-status
// Check last job execution status
```

## Production Considerations

### Scaling
- Current implementation processes sequentially
- For large datasets (>10,000 enrollments), consider:
  - Batch processing
  - Multiple workers
  - Job partitioning

### Performance Optimization
```typescript
// Process in batches of 100
const batchSize = 100;
for (let i = 0; i < enrollments.length; i += batchSize) {
  const batch = enrollments.slice(i, i + batchSize);
  await Promise.all(batch.map(e => processEnrollment(e._id)));
}
```

### Alerts
- Set up alerts for job failures
- Monitor execution time
- Track error rates

### Database Indexes
Already optimized with:
```typescript
// Attendance indexes
{ studentUserId: 1, batchId: 1 }
{ batchId: 1, attendanceDate: 1 }

// ProgressNote indexes
{ studentUserId: 1, batchId: 1 }

// Enrollment indexes
{ status: 1 }
```

## Maintenance

### View Scheduled Jobs
```bash
# In Redis CLI
redis-cli
KEYS bull:enrollment-metrics:repeat:*
```

### Remove Scheduled Job
```typescript
import { enrollmentMetricsQueue } from './src/jobs/enrollment-metrics.job';

await enrollmentMetricsQueue.removeRepeatable('nightly-metrics-recomputation', {
  pattern: '30 20 * * *',
});
```

### Reschedule Job
```bash
# Restart the server - job auto-registers
npm run dev
```

## Troubleshooting

### Debug Mode

Enable detailed logging:
```typescript
// In enrollment-metrics.job.ts
logger.level = 'debug';
```

### Manual Verification

```bash
# Connect to MongoDB
mongo

# Check enrollments
db.enrollments.find({ status: 'Confirmed' }).pretty()

# Check attendance records
db.attendances.countDocuments()

# Check progress notes
db.progressnotes.countDocuments()
```

## Future Enhancements

1. **Email Reports**: Send daily summary email to admins
2. **Dashboard**: Real-time job monitoring UI
3. **Webhooks**: Notify external systems when job completes
4. **Custom Schedules**: Allow different schedules per batch
5. **Historical Tracking**: Store metrics history for trends

## Support

For issues or questions:
1. Check logs: `logs/app.log` and `logs/error.log`
2. Review this documentation
3. Test with `npm run seed:metrics` and `npm run trigger-metrics`

---

**Last Updated**: 2026-06-09
**Task ID**: GC-601-T3
**Version**: 1.0.0

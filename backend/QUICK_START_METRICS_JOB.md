# Quick Start: Nightly Metrics Job

## What Was Implemented

✅ **Attendance Model** - Track student attendance  
✅ **ProgressNote Model** - Record mentor evaluations  
✅ **BullMQ Job Scheduler** - Automated nightly execution  
✅ **Metrics Calculator** - Compute attendance % and avg scores  
✅ **Test Scripts** - Easy testing without waiting for 2 AM

## Quick Test (5 minutes)

### Step 1: Ensure Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

### Step 2: Start the Server
```bash
npm run dev
```

Look for these log messages:
```
✓ Redis connected successfully
✓ Scheduled jobs initialized
Scheduled nightly enrollment metrics job at 02:00 IST
```

### Step 3: Seed Test Data
```bash
# In another terminal
npm run seed:metrics
```

This creates:
- 10 attendance records (8 present, 2 absent)
- 5 progress notes with scores (85, 90, 78, 92, 88)

Expected output:
```
Created 10 attendance records (8 present, 2 absent)
Created 5 progress notes (average: 86.6)
✓ Test data seeded successfully!
Expected metrics:
  - Attendance: 80%
  - Average Score: 86.6
```

### Step 4: Trigger Job Manually
```bash
npm run trigger-metrics
```

Wait ~30 seconds, then check logs:
```
Starting nightly enrollment metrics recomputation job
Found X active enrollments to process
Updated metrics for enrollment <id>: attendance=80%, score=86.6
Completed enrollment metrics job: X successful, 0 errors
```

### Step 5: Verify Results

Connect to MongoDB and check:
```javascript
db.enrollments.findOne({ status: 'Confirmed' })
```

Should show:
```json
{
  "attendancePercent": 80,
  "avgRubricScore": 86.6,
  ...
}
```

## How It Works

### Automated Schedule
- **Runs daily at 02:00 IST** (20:30 UTC)
- No manual intervention needed
- Just keep the server running

### What It Does
For each active enrollment:
1. Counts attendance (Present/Late only)
2. Calculates attendance %
3. Gets all progress note scores
4. Calculates average score
5. Updates enrollment record

### Idempotent
- Safe to run multiple times
- Always produces the same result
- No data duplication

## New Commands

```bash
# Seed test data
npm run seed:metrics

# Manually trigger job (don't wait for 2 AM)
npm run trigger-metrics
```

## Files Created

```
backend/
├── src/
│   ├── database/models/
│   │   ├── Attendance.model.ts          # NEW
│   │   ├── ProgressNote.model.ts        # NEW
│   │   └── index.ts                     # UPDATED
│   ├── jobs/
│   │   ├── enrollment-metrics.job.ts    # NEW
│   │   └── index.ts                     # NEW
│   └── server.ts                        # UPDATED
├── scripts/
│   ├── seed-test-metrics-data.ts        # NEW
│   └── trigger-metrics-job.ts           # NEW
├── package.json                         # UPDATED
├── NIGHTLY_METRICS_JOB.md              # NEW (full docs)
└── QUICK_START_METRICS_JOB.md          # NEW (this file)
```

## Monitoring

### Check Job Status
```bash
# View logs
tail -f logs/app.log

# Check Redis queue
redis-cli
KEYS bull:enrollment-metrics:*
```

### Expected Log Messages

**Job Scheduled:**
```
✓ Scheduled jobs initialized
Scheduled nightly enrollment metrics job at 02:00 IST (20:30 UTC)
```

**Job Running:**
```
Starting nightly enrollment metrics recomputation job
Found 5 active enrollments to process
Updated metrics for enrollment 60a1b2c3d4e5f6g7h8i9j0k1: attendance=80%, score=86.6
Completed enrollment metrics job in 1234ms: 5 successful, 0 errors
```

**Job Failed:**
```
Failed to process enrollment <id>: <error message>
Job <id> failed: <error>
```

## Troubleshooting

### Job Not Starting?
**Issue**: No job logs after server start  
**Fix**: Check Redis connection
```bash
redis-cli ping
```

### No Data to Process?
**Issue**: "Found 0 active enrollments"  
**Fix**: Create enrollments first, then seed data
```bash
npm run seed:metrics
```

### Metrics Still 0?
**Issue**: Job ran but metrics unchanged  
**Fix**: 
1. Check attendance/progress notes exist
2. Check student & batch IDs match enrollment
3. Run `npm run seed:metrics` to create test data

## Production Ready

✅ Error handling with retries  
✅ Comprehensive logging  
✅ Idempotent (safe to rerun)  
✅ Graceful shutdown  
✅ Redis connection pooling  
✅ Database indexes optimized

## Next Steps

1. **Test with real data**: Create actual enrollments, attendance, progress notes
2. **Monitor first run**: Check logs at 02:00 IST tomorrow
3. **Set up alerts**: Monitor job failures
4. **Add dashboard**: (Optional) Build admin UI to view job history

## Support

- **Full Documentation**: See `NIGHTLY_METRICS_JOB.md`
- **Logs**: Check `logs/app.log` and `logs/error.log`
- **Test Data**: Run `npm run seed:metrics`
- **Manual Trigger**: Run `npm run trigger-metrics`

---

**Task**: GC-601-T3  
**Status**: ✅ Complete  
**Date**: 2026-06-09

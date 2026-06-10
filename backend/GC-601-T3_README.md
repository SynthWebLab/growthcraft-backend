# GC-601-T3: Nightly Enrollment Metrics Job

## Overview

Automated background job that runs nightly at 02:00 IST to recompute attendance percentage and average rubric scores for all active enrollments.

## Features

- **Automated Scheduling**: Runs daily at 02:00 IST via BullMQ
- **Attendance Tracking**: Calculates % based on Present/Late vs Total classes
- **Rubric Score Averaging**: Computes average from all progress notes
- **Idempotent**: Safe to run multiple times
- **Fault Tolerant**: Individual failures don't stop entire job
- **Admin APIs**: Manual trigger, status check, history view

## Quick Start

### Prerequisites
- Redis server running
- MongoDB connected
- Admin account with token

### 1. Seed Test Data
```bash
npm run seed:metrics
```

### 2. Trigger Job Manually
```bash
npm run trigger-metrics
```

### 3. Test APIs (see API_TESTING_METRICS_JOB.md)

## Documentation

- **NIGHTLY_METRICS_JOB.md** - Complete technical documentation
- **QUICK_START_METRICS_JOB.md** - 5-minute setup guide
- **API_TESTING_METRICS_JOB.md** - API testing with curl/Postman
- **GC-601-T3_IMPLEMENTATION_SUMMARY.md** - Implementation details

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/admin/jobs/trigger-metrics` | Manually trigger job |
| GET | `/api/v1/admin/jobs/metrics-status` | Check queue status |
| GET | `/api/v1/admin/jobs/metrics-history?limit=10` | View execution history |

All require: `Authorization: Bearer <admin-token>`

## Database Models

### New Models
- **Attendance** - Track student attendance per class
- **ProgressNote** - Store mentor evaluations with rubric scores

### Updated Models
- **Enrollment** - Added `attendancePercent` and `avgRubricScore` fields

## Job Configuration

- **Schedule**: 02:00 IST daily (20:30 UTC)
- **Cron Pattern**: `30 20 * * *`
- **Target**: Enrollments with status = 'Confirmed'
- **Retry Logic**: 3 attempts with exponential backoff

## NPM Scripts

```bash
npm run seed:metrics      # Create test data
npm run trigger-metrics   # Run job manually
npm run dev              # Start server (auto-starts scheduler)
```

## Testing

1. Start server: `npm run dev`
2. Seed data: `npm run seed:metrics`
3. Trigger job: `npm run trigger-metrics`
4. Verify MongoDB: Check `attendancePercent` and `avgRubricScore` fields

## Files Added

### Source Code
- `src/database/models/Attendance.model.ts`
- `src/database/models/ProgressNote.model.ts`
- `src/jobs/enrollment-metrics.job.ts`
- `src/jobs/index.ts`
- `src/modules/admin/controllers/metrics-job.controller.ts`
- `src/modules/admin/routes/metrics-job.routes.ts`

### Scripts
- `scripts/seed-test-metrics-data.ts`
- `scripts/trigger-metrics-job.ts`
- `test-metrics-api.ps1`

### Documentation
- `NIGHTLY_METRICS_JOB.md`
- `QUICK_START_METRICS_JOB.md`
- `API_TESTING_METRICS_JOB.md`
- `GC-601-T3_IMPLEMENTATION_SUMMARY.md`
- `GC-601-T3_README.md` (this file)

## Files Modified

- `package.json` - Added npm scripts
- `src/database/models/index.ts` - Export new models
- `src/server.ts` - Initialize jobs on startup
- `src/modules/admin/routes/admin.routes.ts` - Added job routes
- `src/modules/admin/services/enrollment.service.ts` - Fixed role check bug

## Troubleshooting

**Job not starting:**
- Check Redis: `redis-cli ping`
- Check logs: `logs/app.log`

**Metrics not updating:**
- Ensure test data exists: `npm run seed:metrics`
- Check job completed: View history API

**Redis connection error:**
- Verify REDIS_URL in .env
- Ensure Redis server is running

## Support

For detailed documentation, see the docs listed above or check:
- `logs/app.log` for execution logs
- `logs/error.log` for errors

---

**Task**: GC-601-T3  
**Status**: Complete  
**Date**: June 9, 2026

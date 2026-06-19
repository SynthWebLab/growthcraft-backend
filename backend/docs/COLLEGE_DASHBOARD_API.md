# College Dashboard API

Backend APIs for the College Dashboard (frontend: `growthcraft-frontend` → `src/app/(dashboard)/college`).

- **Base path:** `/api/v1/colleges`
- **Auth:** every route requires a valid access token **and** the `college` role (`authenticate` + `authorize([COLLEGE])`). Non-college roles get `403`.
- **Response envelope:** standard `{ success, message, data, meta }` (see `SuccessResponseHelper`).
- Password change reuses the existing `POST /api/v1/auth/change-password` (not duplicated here).

## Endpoints

| Method | Path | Frontend page | Purpose |
|---|---|---|---|
| GET | `/dashboard` | dashboard | KPIs + 6-month enrollment trend + top performers + recent activity |
| GET | `/cohort` | students | Cohort usage vs the tier cap |
| POST | `/students/import` | students | Bulk-import students (enforces tier cap) |
| GET | `/students` | students | Paginated/filterable list of campus students |
| GET | `/profile` | profile | Institution details + point of contact |
| PUT | `/profile` | profile | Update institution details + POC |
| GET | `/partnership` | partnership | Current tier, active flag, SPOC, benefits, tier comparison |
| POST | `/subscription` | partnership | Activate / choose a subscription plan |
| POST | `/partnership/upgrade-request` | partnership | Request a tier upgrade |
| GET | `/reports` | reports | Monthly reports (trailing 6 months) |
| GET | `/settings` | settings | Account info + notification prefs |
| PUT | `/settings/account` | settings | Update institution name + phone |
| PUT | `/settings/notifications` | settings | Update notification toggles |
| POST | `/support` | support | Submit a support query |
| GET | `/support` | support | List the college's support tickets |

## Selected shapes

**GET `/dashboard`** → `data`:
```json
{
  "kpis": { "totalStudentsEnrolled": 245, "activeCourses": 6, "partnershipTier": "Gold" },
  "enrollmentTrend": [{ "month": "Jan", "students": 55 }],
  "topPerformers": [{ "name": "Priya Devi", "course": "", "progress": 96 }],
  "recentActivity": [{ "text": "Ravi enrolled in Full Stack Dev", "date": "2026-06-19T..." }]
}
```

**GET `/students`** (query: `status` = active|completed|pending, `search`, `page`, `limit`) → paginated `data: [{ userId, name, email, courses, avgProgress, status, lastActive }]` with `meta.pagination`.

**GET `/partnership`** → `{ currentTier, nextTier, startDate, spoc, benefits, tiers, comparison }`.

**POST `/partnership/upgrade-request`** body `{ requestedTier: "Gold"|"Platinum"|..., note? }` — requested tier must be **higher** than current (else `400`).

## Subscription gate

A college must have an **active subscription** before it can use cohort features (import students; the frontend should likewise gate the Export CSV button on this).

- `GET /cohort` and `GET /partnership` both return whether a subscription is active (`cohort.subscribed`, `partnership.active`).
- If a college with **no active subscription** calls `POST /students/import`, it fails with **`403 SUBSCRIPTION_REQUIRED`** ("Choose a partnership plan before importing students.") — the UI should route them to choose a plan.
- **`POST /subscription`** body `{ tier: "Silver"|"Gold"|"Platinum" }` activates the plan immediately (sets it active + stamps the start date). This is the "choose a plan" action.

> **TESTING PHASE:** every college is auto-activated on **Silver** — new colleges get it at registration, and existing colleges read as active Silver via the model default. So the gate currently never blocks. To enforce real subscriptions later, flip `partnershipActive`'s default to `false` in `CollegeProfile.model.ts` (and stop setting it in the register flow).

## Cohort quota & bulk import (subscription-gated)

Cohort capacity is fixed by the partnership tier (from the public `/for-colleges` page):

| Tier | Cohort cap |
|---|---|
| Silver | 50 students |
| Gold | 150 students |
| Platinum | Unlimited |

**GET `/cohort`** → `{ tier, limit, used, remaining, unlimited }` (`limit`/`remaining` are `null` for Platinum). Use this to render the live count and gate the import button.

**POST `/students/import`** — body:
```json
{
  "students": [{ "fullName": "A B", "email": "ab@x.edu", "phone": "+91...", "enrollmentNumber": "...", "degree": "...", "branch": "...", "yearOfStudy": 3 }],
  "csv": "fullName,email,phone\nA B,ab@x.edu,+91...",
  "eventIds": ["<bootcampId>"],
  "defaultPassword": "optional-shared-initial-pw"
}
```
- Accepts a parsed `students[]` and/or a raw `csv` string (header row required; aliases like `name`, `roll`, `mobile`, `year` are mapped).
- The tier cap is enforced **server-side before any writes**. If `used + newStudents > limit`, the request fails atomically:
  ```json
  // HTTP 403
  { "success": false, "error": {
      "message": "Your Silver plan allows up to 50 students (48 used). This import would add 5, exceeding the limit. Upgrade to Gold to add more.",
      "code": "COHORT_LIMIT_EXCEEDED",
      "details": { "tier": "Silver", "limit": 50, "used": 48, "attempted": 5, "remaining": 2, "nextTier": "Gold" }
  } }
  ```
  The frontend should catch `code === "COHORT_LIMIT_EXCEEDED"` and show the upgrade prompt (the loader stops, the export/import is blocked).
- Success (`201`) → `{ created, linkedExisting, alreadyInCohort, eventsEnrolled, skipped: [{email, reason}], cohort }`.
- Imported students become real `student` accounts (added to `registeredStudents`, given a `StudentProfile` tagged with the college, can sign into the student dashboard). New accounts get `defaultPassword` or a random one (reset via forgot-password). Existing student emails are linked into the cohort; non-student emails are skipped with a reason.
- `eventIds` (optional) enrolls every imported student into those events via `EventEnrollment` — this is how cohort students "get the event access subscribed by the college."

> Note: only **new-to-cohort** students count against the cap. Re-importing students already in the cohort, or linking an existing student account, does not double-count.

## Data model changes

- `CollegeProfile` extended with: `partnershipTier` (`Silver`|`Gold`|`Platinum`, default `Silver`), `partnershipStartDate`, `spoc {name,email,phone,designation}`, `notificationPreferences {studentEnrollments, programUpdates, reportsReady, marketingEmails}`.
- New model `CollegePartnershipRequest` (upgrade requests).
- Support tickets reuse the shared `SupportTicket` model.

## Known data gaps (mock in the frontend, approximated here)

The frontend mocked several metrics the backend does not yet track. Where there's no source, the API derives a labeled proxy rather than fabricating:

- **`avgProgress`** — derived as `completedCourses / enrolledCourses` from `StudentProfile` (no per-course progress % exists yet).
- **Student `status`** — derived: all enrolled completed → `completed`; has enrollments → `active`; registered but none → `pending`.
- **Report `completionRate`** — approximated as `confirmed / total` enrollments for the month (no completion tracking yet).
- **`avgStudentRating`** KPI — **omitted** (no rating data exists).
- **Student ↔ college association** — uses `CollegeProfile.registeredStudents`, falling back to `StudentProfile.collegeName` match when that list is empty.

These are the natural follow-ups once progress/rating tracking is added.

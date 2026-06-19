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
| GET | `/students` | students | Paginated/filterable list of campus students |
| GET | `/profile` | profile | Institution details + point of contact |
| PUT | `/profile` | profile | Update institution details + POC |
| GET | `/partnership` | partnership | Current tier, SPOC, benefits, tier comparison |
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

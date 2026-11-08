# Phase 3 — Laravel backend foundation

This phase adds the first production-oriented backend layer on top of the Phase
2 schema and the existing alumni registration workflow.

## Database and models

The migrations add:

- Roles, permissions, user role assignments, program scopes, departments,
  academic programs, degrees, and program-degree offerings.
- Alumni profile names/status, education records, contacts, addresses, claim
  requests, employment statuses/history, private alumni documents, and merge
  audit records.
- Employers and employer memberships, privacy acceptances, append-only
  activity entries, database notifications, and administrative review fields
  for registration-assistance requests.

Student numbers remain globally unique. The existing student-number table is
renamed to `alumni_education_records`, preserving existing registrations while
adding optional program-degree and graduation-year references. New API-created
education records require both values.

## Authenticated API

The API accepts Laravel session authentication for the same-origin application
and Sanctum personal access tokens for API clients. Both use the same policy
and permission checks; token issuance requires verified email and tokens expire
after 30 days.

| Method        | Path                                               | Purpose                                                                         |
| ------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| GET           | `/api/me/alumni`                                   | Current user's linked alumni profile                                            |
| GET, POST     | `/api/alumni`                                      | Search/list (with `?claim_status=`) and staff-created alumni records            |
| POST          | `/api/alumni/import`                               | CSV/Excel batch import with auto-cataloging and multi-degree consolidation      |
| GET           | `/api/alumni/import-template`                      | Download formatted CSV import sample template                                   |
| GET, PATCH    | `/api/alumni/{profile}`                            | Read and update authorized profile fields                                       |
| POST          | `/api/alumni/{profile}/education-records`          | Add a student number/credential (with optional GWA & honors)                    |
| GET, POST     | `/api/alumni/{profile}/employment`                 | Read or append tracer history (with `is_related_to_degree` Option B flag)       |
| GET           | `/api/employment-statuses`                         | Active tracer categories                                                        |
| GET, POST     | `/api/alumni/{profile}/documents`                  | List/upload private documents                                                   |
| GET, DELETE   | `/api/alumni-documents/{document}`                 | Authorized private download/delete                                              |
| GET, POST     | `/api/departments`                                 | Read departments or create one                                                  |
| PATCH         | `/api/departments/{department}`                    | Update an academic department/college                                           |
| GET           | `/api/programs`                                    | Read active programs and degree offerings                                       |
| POST          | `/api/departments/{department}/programs`           | Create a program                                                                |
| PATCH         | `/api/programs/{program}`                          | Update an academic program                                                      |
| POST          | `/api/programs/{program}/degrees`                  | Attach a degree offering                                                        |
| GET, POST     | `/api/employers`                                   | Staff list or authenticated employer registration                               |
| GET           | `/api/employers/mine`                              | Employer user's member companies only (no member/contact details)               |
| GET, PATCH    | `/api/employers/{employer}`                        | View/update an authorized company                                               |
| PATCH         | `/api/employers/{employer}/verification`           | Staff verification decision                                                     |
| GET           | `/api/registration-assistance`                     | Staff queue of assistance requests with live Registrar Match Diagnostics        |
| PATCH         | `/api/registration-assistance/{assistanceRequest}` | Record staff review outcome and execute resolution (`sync_record`, etc.)        |
| GET           | `/api/notifications`                               | Current user's notifications                                                    |
| PATCH         | `/api/notifications/{notificationId}/read`         | Mark own notification read                                                      |
| GET           | `/api/reports`                                     | Generate any of the 18 institutional reports with 5-dimension filters           |
| GET           | `/api/reports/export/excel`                        | Download styled SpreadsheetML (`.xls`) workbook for any report                  |
| GET           | `/api/reports/export/pdf`                          | Download native `%PDF-1.4` document for any report                              |
| GET           | `/api/reports/employment-outcomes`                 | Aggregate outcomes, optionally filtered by program/year                         |
| GET           | `/api/activity-logs`                               | Administrator-only activity history                                             |
| GET           | `/api/dashboard`                                   | Authorized workspace dashboard role, aggregate metrics, and employment outcomes |
| GET           | `/api/dashboard/stats`                             | Backward-compatible alias for `/api/dashboard`                                  |
| GET, POST     | `/api/surveys`                                     | Alumni list published surveys; staff list or create surveys                     |
| PATCH         | `/api/surveys/{survey}`                            | Staff update survey details/questions/cohort targets                            |
| POST          | `/api/surveys/{survey}/publish`                    | Staff publish a survey                                                          |
| POST          | `/api/surveys/{survey}/close`                      | Staff close a published survey                                                  |
| GET           | `/api/surveys/{survey}/analytics`                  | Survey response analytics with anonymous respondent masking                     |
| POST          | `/api/surveys/{survey}/responses`                  | Linked alumni submit one response to an open survey                             |
| GET           | `/api/announcements`                               | List published announcements visible to the authenticated role/cohort           |
| GET           | `/api/announcements/manage`                        | Staff list all announcements, including drafts and archived items               |
| POST          | `/api/announcements`                               | Staff create an announcement                                                    |
| PATCH, DELETE | `/api/announcements/{announcement}`                | Staff update or delete an announcement                                          |
| POST          | `/api/announcements/{announcement}/publish`        | Staff publish an announcement                                                   |
| POST          | `/api/announcements/{announcement}/unpublish`      | Staff revert/archive a published announcement                                   |
| GET           | `/api/events`                                      | List published alumni events visible to the authenticated user                  |
| GET           | `/api/events/manage`                               | Staff list all events for management                                            |
| POST          | `/api/events`                                      | Staff create an alumni event                                                    |
| PATCH, DELETE | `/api/events/{event}`                              | Staff update or delete an alumni event                                          |
| POST          | `/api/events/{event}/publish`                      | Staff publish an alumni event                                                   |
| POST          | `/api/events/{event}/status`                       | Staff transition event status (`draft`, `published`, `cancelled`, `completed`)  |
| POST          | `/api/events/{event}/rsvp`                         | Alumni/Employer one-click RSVP (`going`, `interested`, `cancelled`)             |
| GET           | `/api/events/{event}/attendees`                    | Staff view RSVP attendee roster                                                 |
| GET           | `/api/jobs`                                        | Alumni list currently open published jobs                                       |
| GET           | `/api/jobs/{jobPosting}`                           | View a published job, or an owned employer's own draft                          |
| POST          | `/api/jobs/{jobPosting}/applications`              | Linked alumnus applies with frozen RA 10173 snapshot & optional resume upload   |
| GET, POST     | `/api/employer/jobs`                               | Employer members list their postings or create a draft posting                  |
| PATCH, DELETE | `/api/employer/jobs/{jobPosting}`                  | Employer members manage their own posting                                       |
| POST          | `/api/employer/jobs/{jobPosting}/publish`          | Employer members publish a posting after verification                           |
| GET           | `/api/employer/jobs/{jobPosting}/applications`     | Employer members list applicants (with frozen snapshots) for their posting      |
| GET           | `/api/applications/me`                             | Linked alumni view their own applications and review status                     |
| GET           | `/api/applications/{application}/resume`           | Authorized download of an application's private resume snapshot                 |
| PATCH         | `/api/applications/{application}/status`           | Owning employer or staff updates application review status                      |
| GET, POST     | `/api/admin/users`                                 | System Admin user listing, invitation, or direct account creation               |
| PATCH         | `/api/admin/users/{user}/roles`                    | System Admin update user role assignments                                       |
| PATCH         | `/api/admin/users/{user}/programs`                 | System Admin assign academic programs to a Department Coordinator               |
| PATCH         | `/api/admin/roles/{role}/permissions`              | System Admin toggle granular permissions in the Role Permissions Matrix         |
| PATCH, DELETE | `/api/admin/users/{user}/suspension` / `{user}`    | System Admin suspend, reactivate, or soft-delete user accounts                  |

Use the `system-administrator`, `alumni-coordinator`,
`department-coordinator`, `alumni`, and `employer` role codes. Department
coordinator access is constrained by their assigned program IDs. Employer
verification defaults to pending; job publication must remain gated on a
verified employer.

## Operations

Run `php artisan migrate` and `php artisan db:seed` to install the schema and
seed the role/permission and employment-status catalogs. Uploaded resumes and
supporting files use the private `local` disk and require an authenticated,
authorized download request. Activity logs record allowlisted metadata, not
full request payloads or file contents.

Employment reports append a new period and close the previous open period at
the preceding day. Overlapping periods and invalid end dates are rejected.
Outcome reports use only each alumnus's latest reported status and return
aggregates rather than personal details.

## Module endpoint details (Milestones 1–18)

- **Surveys**: Create/update payloads include `title`, optional
  `description`/`starts_at`/`closes_at`, `is_anonymous`, cohort target arrays
  (`target_department_ids`, `target_program_ids`, `target_graduation_years`),
  and a `questions` array. Question types support all 9 types (`text` /
  `short_text`, `textarea` / `long_text`, `radio` / `multiple_choice`,
  `multiselect` / `checkbox`, `select` / `dropdown`, `rating` 1–5, `date`,
  `number`, and `boolean` / `yes_no`); choice types accept an `options` array.
  Alumni submit `answers` keyed by question ID. Responses are unique per survey
  and linked alumni profile (`409 Conflict` on duplicate); questions cannot be
  edited after the first response. Coordinators with survey-management
  authorization can view drafts, close surveys (`POST /api/surveys/{survey}/close`),
  and inspect analytics (`GET /api/surveys/{survey}/analytics`).
- **Announcements & Events**: Announcements accept `title`, `body`, `category`,
  `is_pinned`, `is_public`, `expires_at`, `action_label`, `action_url`,
  `notify_audience`, `audience_roles`, `target_program_ids`, and
  `target_graduation_years`. Alumni Events (`AlumniEvent`) support `event_type`,
  `format`, `venue`, `meeting_url`, `starts_at`, `ends_at`,
  `registration_deadline`, `capacity`, `is_featured`, `is_public`, cohort
  targeting, one-click RSVP (`POST /api/events/{event}/rsvp`), and attendee
  rosters (`GET /api/events/{event}/attendees`).
- **Job Postings & RA 10173 Snapshots**: Job posting create payloads include
  `employer_id`, `title`, `description`, and optional `location`,
  `employment_type`, `workplace_type`, `salary_min`, `salary_max`, and
  `closes_at`. Employer membership, not a client-selected role, authorizes
  employer actions. Unverified employers may save drafts but cannot publish.
  Applications require an authenticated `alumni` user with a linked
  `alumni_profile_id`, serialize an immutable `profile_snapshot` JSON payload,
  and store resumes on the private disk (`GET /api/applications/{application}/resume`).
- **Dashboard (`GET /api/dashboard`)**: Returns
  `{ "data": { "role": "...", "metrics": { ... }, "employment_outcomes": [...] } }`.
  `role` is derived from the authenticated user's assigned role codes (or an
  authorized `?role=` switch among the user's assigned roles). If multiple
  roles are assigned, default selection follows this priority:
  `system-administrator`, `alumni-coordinator`, `department-coordinator`,
  `employer`, then `alumni`. Dashboard metrics and all 18 institutional reports
  (`GET /api/reports`, `/api/reports/export/excel`, `/api/reports/export/pdf`)
  enforce strict role and Option A program scoping.

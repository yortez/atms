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
| GET, POST     | `/api/alumni`                                      | Search/list and staff-created alumni records                                    |
| GET, PATCH    | `/api/alumni/{profile}`                            | Read and update authorized profile fields                                       |
| POST          | `/api/alumni/{profile}/education-records`          | Add a student number/credential                                                 |
| GET, POST     | `/api/alumni/{profile}/employment`                 | Read or append tracer history                                                   |
| GET           | `/api/employment-statuses`                         | Active tracer categories                                                        |
| GET, POST     | `/api/alumni/{profile}/documents`                  | List/upload private documents                                                   |
| GET, DELETE   | `/api/alumni-documents/{document}`                 | Authorized private download/delete                                              |
| GET, POST     | `/api/departments`                                 | Read departments or create one                                                  |
| GET           | `/api/programs`                                    | Read active programs and degree offerings                                       |
| POST          | `/api/departments/{department}/programs`           | Create a program                                                                |
| POST          | `/api/programs/{program}/degrees`                  | Attach a degree offering                                                        |
| GET, POST     | `/api/employers`                                   | Staff list or authenticated employer registration                               |
| GET           | `/api/employers/mine`                              | Employer user's member companies only (no member/contact details)               |
| GET, PATCH    | `/api/employers/{employer}`                        | View/update an authorized company                                               |
| PATCH         | `/api/employers/{employer}/verification`           | Staff verification decision                                                     |
| GET           | `/api/registration-assistance`                     | Staff queue of pending assistance requests                                      |
| PATCH         | `/api/registration-assistance/{assistanceRequest}` | Record staff review outcome                                                     |
| GET           | `/api/notifications`                               | Current user's notifications                                                    |
| PATCH         | `/api/notifications/{notificationId}/read`         | Mark own notification read                                                      |
| GET           | `/api/reports/employment-outcomes`                 | Aggregate outcomes, optionally filtered by program/year                         |
| GET           | `/api/activity-logs`                               | Administrator-only activity history                                             |
| GET           | `/api/dashboard`                                   | Authorized workspace dashboard role, aggregate metrics, and employment outcomes |
| GET           | `/api/dashboard/stats`                             | Backward-compatible alias for `/api/dashboard`                                  |
| GET, POST     | `/api/surveys`                                     | Alumni list published surveys; staff list or create surveys                     |
| PATCH         | `/api/surveys/{survey}`                            | Staff update survey details/questions                                           |
| POST          | `/api/surveys/{survey}/publish`                    | Staff publish a survey                                                          |
| POST          | `/api/surveys/{survey}/responses`                  | Linked alumni submit one response to an open survey                             |
| GET           | `/api/announcements`                               | List published announcements visible to the authenticated role                  |
| GET           | `/api/announcements/manage`                        | Staff list all announcements, including drafts                                  |
| POST          | `/api/announcements`                               | Staff create an announcement                                                    |
| PATCH         | `/api/announcements/{announcement}`                | Staff update an announcement                                                    |
| POST          | `/api/announcements/{announcement}/publish`        | Staff publish an announcement                                                   |
| GET           | `/api/jobs`                                        | Alumni list currently open published jobs                                       |
| GET           | `/api/jobs/{jobPosting}`                           | View a published job, or an owned employer's own draft                          |
| POST          | `/api/jobs/{jobPosting}/applications`              | A linked alumnus applies to an open published job                               |
| GET, POST     | `/api/employer/jobs`                               | Employer members list their postings or create a draft posting                  |
| PATCH, DELETE | `/api/employer/jobs/{jobPosting}`                  | Employer members manage their own posting                                       |
| POST          | `/api/employer/jobs/{jobPosting}/publish`          | Employer members publish a posting after verification                           |
| GET           | `/api/employer/jobs/{jobPosting}/applications`     | Employer members list applicants for their posting                              |
| GET           | `/api/applications/me`                             | Linked alumni view their own applications and review status                     |
| PATCH         | `/api/applications/{application}/status`           | Owning employer or staff updates application review status                      |

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

## Remaining modules

Phase 5 endpoint details:

- Survey create payloads include `title`, optional `description`/`closes_at`,
  and a `questions` array. Question types are `text`, `textarea`, `number`,
  `boolean`, `select`, `multiselect`, and `rating` (1–5); choice types accept
  an `options` array. Alumni submit `answers` keyed by question ID. Responses
  are unique per survey and linked alumni profile; questions cannot be edited
  after the first response. Coordinators with survey-management authorization
  can view drafts and manage surveys. Department coordinators can view open,
  published survey questions but cannot manage surveys or submit responses.
- Announcements accept `title`, `body`, and optional `audience_roles` (role
  codes such as `alumni` or `employer`). A null/omitted audience is visible to
  all authenticated API users. Drafts are not visible through the feed.
- Job posting create payloads include `employer_id`, `title`, `description`,
  and optional `location`, `employment_type`, `workplace_type`, `salary_min`,
  `salary_max`, and `closes_at`. Employer membership, not a client-selected
  role, authorizes employer actions. Unverified employers may save drafts but
  cannot publish. Applications require an authenticated `alumni` user with a
  linked `alumni_profile_id`; an alumnus can apply once per posting.
- `GET /api/dashboard` returns
  `{ "data": { "role": "...", "metrics": { ... }, "employment_outcomes": [...] } }`.
  `role` is derived from the authenticated user's assigned role codes, never a
  request parameter. If multiple roles are assigned, the selected role follows
  this priority: `system-administrator`, `alumni-coordinator`,
  `department-coordinator`, `employer`, then `alumni` (other role codes follow
  those). `metrics` contains `alumni_count`, `users_count`, `survey_count`,
  `survey_response_count`, `announcements_published_count`, `employers`
  (`total`, `verified`, `pending`), `jobs` (`total`, `published`), and
  `applications` (`total`, `by_status`, an array of `{status, count}`). The
  top-level `employment_outcomes` array contains `{code, label, alumni_count}`
  rows for each latest reported outcome. These are aggregate-only values and
  contain no alumni-identifying data. Dashboard access is restricted to the
  five assigned workspace roles; alumni require a linked profile and employers
  require a company membership.
- Dashboard metrics are role-scoped. Staff retains institutional aggregates.
  Department-coordinator alumni/account counts, survey counts/responses, and
  employment outcomes are limited to assigned programs; recruitment metrics are
  zero because job/applicant data is outside that program scope.
  Alumni get only their own linked-profile count, own survey response count,
  own application counts/by-status, plus counts of open published surveys,
  announcements visible to their assigned roles, and jobs currently open to
  alumni at verified employers; their employment outcome rows are for their
  own linked profile only. Employer users get counts only for companies where
  they are members, those companies' postings, and applications to those
  postings; unrelated metrics and employment outcomes are empty/zero.
  `GET /api/employers/mine` returns `data` as an array of the signed-in
  employer's member companies (`id`, `company_name`, `industry`, `website`,
  `verification_status`) and never includes other companies or membership
  contact details. All employer dashboard and company results are membership
  scoped in addition to the authenticated role.

Excel import processing, event management, system settings, and export
generation still need their own migrations, policies, services, and endpoints
before those modules are production-ready.

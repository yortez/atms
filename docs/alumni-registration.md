# Alumni registration and verification

## Alumni roster

Automatic registration uses records in `alumni_profiles` and
`alumni_education_records` (also accessible via the backward-compatible
`AlumniStudentNumber` model). Load each graduate's name (`first_name`,
`middle_name`, `last_name`), date of birth, and optional contact email into the
profile table, then add every student number and degree credential belonging to
that person to `alumni_education_records`. Student numbers are normalized to
uppercase and are globally unique across profiles. A single centralized
`AlumniProfile` can have multiple student numbers and degrees, and can be
claimed by at most one user account (`users.alumni_profile_id`).

## Registration and 3-field verification

Dual-mode registration supports both **Alumni Account Claiming** (`/register`)
and **Employer Partner Registration** (`/register?type=employer`).

Alumni claiming enforces a **3-field verification tuple** against the roster:

1. `student_number` (normalized, uppercase exact match in `alumni_education_records`).
2. `last_name` (normalized, case-insensitive match against `alumni_profiles`).
3. `date_of_birth` (exact `Y-m-d` match against `alumni_profiles`).

User account email is intentionally decoupled from legacy college roster emails
so graduates can register with their current personal email address. A
successful match links the newly created `User` account (`alumni_profile_id`),
assigns the `alumni` role, and marks `email_verified_at` as verified.

When a student number is missing, already claimed, or fails the 3-field match,
no user account is created. Instead, the system automatically records or allows
submission of an `AlumniRegistrationAssistanceRequest` routed to the
corresponding Academic Program / Department Coordinator (`academic_program_id`,
`graduation_year`). Staff can inspect live **Registrar Match Diagnostics**
(`not_found`, `already_claimed`, `ready_to_claim`, `dob_mismatch`,
`name_mismatch`, `multiple_mismatches`) and execute one-click resolution
workflows (`sync_record`, `create_record`, `provision_account`, or
`manual_review`). Applicants can also track their request decision using the
self-service **Check Request Status** lookup at `/alumni/registration-assistance`.

## Audit trail

`alumni_registration_logs` records registration attempts, completed
registrations, automatic verification, denied claims, and assistance requests.
It stores an HMAC-SHA-256 of the normalized student number rather than the
number itself, along with the event time, request IP, and user agent. Administrative
resolutions and batch imports are additionally recorded in `activity_logs`.

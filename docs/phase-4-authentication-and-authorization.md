# Phase 4 — Authentication and authorization

## Authentication

- Fortify provides session login/logout, dual-mode registration (Alumni Claim
  at `/register` and Employer Partner Registration at `/register?type=employer`),
  email verification, password reset/update, two-factor authentication, and
  passkeys.
- Alumni account registration verifies identity using the **3-field verification
  tuple** (`student_number`, normalized `last_name`, and `date_of_birth`)
  against the alumni roster while allowing graduates to register with any
  current personal email address. Unmatched claims automatically generate an
  `AlumniRegistrationAssistanceRequest` routed to the appropriate Department
  Coordinator (`academic_program_id`) with self-service status tracking at
  `/alumni/registration-assistance`.
- Sanctum issues personal API tokens at `POST /api/auth/token` using
  `email`, `password`, and `device_name`. Email verification is required.
  Tokens expire after 30 days and are returned only once.
- Revoke the current personal token with `DELETE /api/auth/token`. Password
  changes and resets revoke all of the user's personal access tokens.
- Protected API routes require a verified account and a Sanctum token with the
  `api` ability, or an authenticated first-party web session.

## Authorization

- Role assignments, program scopes, and permissions are stored in `roles`,
  `permissions`, `user_roles`, `role_permissions`, and
  `user_program_assignments`.
- Seeding grants system administrators every defined permission,
  alumni coordinators the alumni, reports, surveys, announcements, events, and
  jobs permissions, and department coordinators alumni viewing and reports
  access (customizable via the **Role Permissions Matrix** at
  `PATCH /api/admin/roles/{role}/permissions`).
- Alumni self-service policies limit users to their linked profile. Staff
  permissions govern broader operations; department coordinators are strictly
  scoped to alumni in their assigned academic programs (`Option A` isolation)
  and need the explicit `alumni.update` permission to edit.
- Employer registration creates a `pending` employer profile and links the
  registering user as its owner. Employer members can access only their
  associated companies and immutable applicant snapshots (`profile_snapshot`)
  submitted directly to their own job postings; only administrators and alumni
  coordinators can list all employers or review verification.
- Employer verification and alumni roster verification remain separate from
  email verification. API access requires email verification; employer actions
  remain subject to membership and verification policies.

Seed authorization roles, permissions, and demo role accounts with
`php artisan db:seed` (including `SystemAdminSeeder`). This creates the default
accounts (`admin@atms.local`, `coordinator@atms.local`, `dept.ccs@atms.local`,
`employer@atms.local`, and `maria.reyes@example.com` with password
`Password123!`). Use
`php artisan app:create-system-admin --name="..." --email="..." --password="..."`
to create or refresh a system administrator account manually. Use
`php artisan migrate` to install all schema tables.

System administrators can invite users or directly provision verified accounts
with an initial password from **Users & roles** (`POST /api/admin/users`),
assign multiple simultaneous roles, and scope Department Coordinators to
specific academic programs (`PATCH /api/admin/users/{user}/programs`).

The `system-administrator` role is protected: its permissions cannot be stripped
in the Role Permissions Matrix, it cannot be assigned or removed through
standard user role updates, and system-administrator accounts cannot be
suspended or deleted there. Administrators can suspend, reactivate, and
soft-delete other user accounts. Suspension blocks sign-in, API token issuance,
and authenticated application access; deletion is soft so historical records
remain intact.

Users can open **Account settings** from the account menu to update their name
and email, upload a JPG, PNG, or WebP profile photo (up to 5 MB), and change
their password after confirming the current password. Email changes require
email verification again.

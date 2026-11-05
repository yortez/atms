# Phase 4 — Authentication and authorization

## Authentication

- Fortify provides session login/logout, verified alumni registration,
  email verification, password reset/update, two-factor authentication, and
  passkeys.
- Alumni account registration verifies identity by matching the supplied
  student number, name, email, and date of birth against the alumni roster.
  Unmatched applications must use the registration-assistance workflow.
- Sanctum issues personal API tokens at `POST /api/auth/token` using
  `email`, `password`, and `device_name`. Email verification is required.
  Tokens expire after 30 days and are returned only once.
- Revoke the current personal token with `DELETE /api/auth/token`. Password
  changes and resets revoke all of the user's personal access tokens.
- Protected API routes require a verified account and a Sanctum token with the
  `api` ability, or an authenticated first-party web session.

## Authorization

- Role assignments and permissions are stored in `roles`, `permissions`,
  `user_roles`, and `role_permissions`.
- Alumni self-service policies limit users to their linked profile. Staff
  permissions govern broader operations; department coordinators are limited
  to alumni in their assigned academic programs and need the explicit
  `alumni.update` permission to edit.
- Employer registration creates a pending employer and links the registering
  user as its owner. Employer members can access only their associated
  companies; only administrators and alumni coordinators can list all
  employers or review verification.
- Employer verification and alumni roster verification remain separate from
  email verification. API access requires email verification; employer actions
  remain subject to membership and verification policies.

Seed authorization roles and permissions with `php artisan db:seed`. This
creates the default `system-administrator` account (`admin@atms.local` /
`Password123!`) and assigns the system admin role. Use
`php artisan app:create-system-admin --name="..." --email="..." --password="..."`
to create or refresh the account manually. Use `php artisan migrate` to install
the `personal_access_tokens` table.

# Alumni registration and verification

## Alumni roster

Automatic registration only uses records in `alumni_profiles` and
`alumni_student_numbers`. Load each alumni's name, email address, and date of
birth into the profile table, then add every student number belonging to that
person to the student-number table. Student numbers are normalized to uppercase
and are unique across profiles. A profile can have multiple numbers, but can
only be linked to one user account.

## Registration

Registration requires a student number, name, email address, date of birth, and
password. The student number must resolve to a roster profile, and all supplied
identity fields must match that profile. A successful registration links the
user to that profile and marks the account's email as verified. No user account
is created when the record is missing, does not match, or has already been
claimed.

Applicants who cannot verify their details can submit the registration
assistance form. Requests are stored with a `pending` status in
`alumni_registration_assistance_requests` for administrative review. Staff
should verify the applicant against authoritative records and update the
alumni roster before asking them to register again.

## Audit trail

`alumni_registration_logs` records registration attempts, completed
registrations, automatic verification, denied claims, and assistance requests.
It stores an HMAC-SHA-256 of the normalized student number rather than the
number itself, along with the event time, request IP, and user agent.

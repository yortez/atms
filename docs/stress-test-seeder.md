# Stress Test Seeder & Load Verification Guide

## Overview

`Database\Seeders\StressTestSeeder` (`database/seeders/StressTestSeeder.php`) populates the SEAIT Alumni Tracer Management System (ATMS) with a high-volume, relationally complete dataset designed to stress test:

- **Public Portal (`welcome.tsx`)**: Real-time institutional employability metrics, degree alignment calculations, cohort claim rates, filterable job board, announcements, events, and active CHED Graduate Tracer Study (GTS) callouts.
- **Role-Based Workspaces (`AlumniPortal`)**: Pagination, search (`⌘ K`), department/program scoping, and live analytics across all 5 roles (`System Administrator`, `Alumni Coordinator`, `Department Coordinator`, `Alumni`, and `Employer`).
- **CHED GTS Analytics & CSV Exports**: Multi-join aggregation queries over thousands of education and employment records.
- **RA 10173 Compliance & Audit Logging**: Frozen applicant profile snapshots (`job_applications.profile_snapshot`) and high-volume `activity_logs`.

Using chunked bulk inserts (`DB::table(...)->insert(...)` and `insertOrIgnore(...)`), the seeder populates **~8,500+ total relational rows in ~2.4 seconds** on SQLite/MySQL and is safe to re-run idempotently.

---

## Default Seeded Dataset Breakdown

| Domain / Table                                                              | Default Volume                                   | Statistical Distribution & Characteristics                                                                                                                                                                                                        |
| :-------------------------------------------------------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Departments (`departments`)**                                             | `7`                                              | Authentic SEAIT academic units: `CICT`, `CBGG`, `COED`, `CET`, `COA`, `CCJE` (+ any existing units).                                                                                                                                              |
| **Academic Programs (`academic_programs`)**                                 | `19`                                             | `BSIT`, `BSCS`, `ACT`, `BSBA-FM`, `BSBA-MM`, `BSAIS`, `BSHM`, `BSTM`, `BEED`, `BSED-ENG`, `BSED-MATH`, `BECED`, `BSCE`, `BSEE`, `BSA`, `BSAB`, `BSCRIM`.                                                                                          |
| **Alumni Profiles (`alumni_profiles`)**                                     | `1,500`                                          | Full names (`last_name`, `first_name`, `middle_name`, optional `Jr.` suffix), birthdates (`1994–2004`), and `active` status.                                                                                                                      |
| **Education Records (`alumni_education_records`)**                          | `1,500`                                          | Globally unique normalized student numbers (`YYYY-NNNNN`), graduation years (`2018–2026`), GWA (`1.25–2.75`), and Latin honors (`Cum Laude`, `Magna Cum Laude`, `Academic Distinction`, `Dean’s Lister`).                                         |
| **Contact Methods (`alumni_contact_methods`)**                              | `3,000`                                          | 2 records per graduate (primary email + primary Philippine mobile number `+63 9XX XXX XXXX`).                                                                                                                                                     |
| **Addresses (`alumni_addresses`)**                                          | `1,500`                                          | Distributed across South Cotabato & Region XII municipalities (`Tupi`, `Koronadal City`, `Polomolok`, `General Santos City`, `Surallah`, `Banga`, `Norala`, `Tampakan`, `Tantangan`, `Alabel`).                                                   |
| **Claimed Alumni Users (`users` + `user_roles`)**                           | `600`                                            | `40%` claim rate by default; remaining `900` profiles remain unclaimed in the Registrar roster to test the 3-field `/register` claiming workflow.                                                                                                 |
| **Employment Tracer Records (`alumni_employment_records`)**                 | `~1,350`                                         | `90%` tracer participation rate; `~87.5%` employment rate (`employed`, `government-employee`, `self-employed`, `freelance`), `~80%` curriculum/degree alignment (`is_related_to_degree = true`), plus `unemployed` and `further-studies` cohorts. |
| **Employers (`employers`)**                                                 | `45`                                             | Partner companies across SOCCSKSARGEN, Davao, Metro Manila, and Cebu (`~83%` verified, `~11%` pending review, `~6%` rejected).                                                                                                                    |
| **Job Postings (`job_postings`)**                                           | `120`                                            | Evenly distributed across `On-site`, `Hybrid`, and `Remote` workplace modes and `Full-time`, `Contract`, `Part-time`, and `Internship` employment types (`90%` published, `10%` draft).                                                           |
| **Job Applications (`job_applications`)**                                   | `500`                                            | Distributed across `submitted`, `under_review`, `shortlisted`, `interview`, `offered`, and `rejected`, each storing an immutable JSON `profile_snapshot` for RA 10173 compliance.                                                                 |
| **Surveys & Responses (`surveys`, `survey_questions`, `survey_responses`)** | `5` surveys / `20` questions / `1,100` responses | Includes institution-wide CHED GTS baseline survey, Batch `2022–2026` cohort survey, `CICT`-scoped skills survey, anonymous licensure tracker, and 1 draft survey.                                                                                |
| **Announcements (`announcements`)**                                         | `24`                                             | Pinned, `urgent`, `career`, `academic`, `achievement`, and `general` advisories (both public and portal-only).                                                                                                                                    |
| **Alumni Events & RSVPs (`alumni_events`, `alumni_event_registrations`)**   | `18` events / `585` RSVPs                        | `homecoming`, `career_fair`, `webinar`, `networking`, and `workshop` events across `in_person`, `hybrid`, and `online` formats with `going` and `interested` RSVPs.                                                                               |
| **Claim Assistance Queue (`alumni_registration_assistance_requests`)**      | `75`                                             | Scoped across academic programs and graduation years (`pending`, `resolved`, and `rejected`) to test Registrar match diagnostics.                                                                                                                 |
| **Activity Audit Trail (`activity_logs`)**                                  | `250+`                                           | Timestamped administrative and security events across the past 500 hours.                                                                                                                                                                         |

---

## How to Run the Stress Test Seeder

### 1. Standard Stress Test Run (Default: 1,500 Alumni)

```powershell
php artisan db:seed --class=StressTestSeeder
```

### 2. Custom High-Volume Scaling via Environment Variables

You can override the target counts using environment variables before running the seeder:

| Environment Variable    | Default | Description                                                                                                      |
| :---------------------- | :------ | :--------------------------------------------------------------------------------------------------------------- |
| `STRESS_ALUMNI_COUNT`   | `1500`  | Total `alumni_profiles` (and corresponding education, contact, address, and employment records) to ensure exist. |
| `STRESS_CLAIMED_COUNT`  | `600`   | Total claimed `users` linked to `alumni_profiles` (`<= STRESS_ALUMNI_COUNT`).                                    |
| `STRESS_EMPLOYER_COUNT` | `45`    | Total `employers` to ensure exist.                                                                               |
| `STRESS_JOB_COUNT`      | `120`   | Total `job_postings` to ensure exist.                                                                            |

**Example (5,000 Alumni / 2,000 Claimed Accounts / 100 Employers / 300 Jobs):**

```powershell
$env:STRESS_ALUMNI_COUNT=5000
$env:STRESS_CLAIMED_COUNT=2000
$env:STRESS_EMPLOYER_COUNT=100
$env:STRESS_JOB_COUNT=300
php artisan db:seed --class=StressTestSeeder
```

### 3. Clean Reset + Stress Seed

To wipe the database completely and re-seed from scratch:

```powershell
php artisan migrate:fresh
php artisan db:seed --class=StressTestSeeder
```

---

## Demo Accounts for Role-Based Testing

All seeded accounts share the default password `Password123!` (or the value of `ADMIN_PASSWORD` in `.env`):

| Role Workspace             | Email                    | Scope & Capabilities                                                                                                                                                                   |
| :------------------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **System Administrator**   | `admin@atms.local`       | Full institution-wide access: Overview, Alumni Directory, Claim Assistance, Academic Programs, Surveys, Announcements, Events, Employers & Jobs, Users & Roles, Activity Log, Reports. |
| **Alumni Coordinator**     | `coordinator@atms.local` | Institution-wide alumni management, CHED GTS reports, surveys, announcements, events, and claim assistance.                                                                            |
| **Department Coordinator** | `dept.ccs@atms.local`    | Scoped to **CICT** (`BSIT`, `BSCS`, `ACT`) program alumni, department reports, and CICT claim assistance requests.                                                                     |
| **Employer Partner**       | `employer@atms.local`    | Linked to verified partner **TechNova Solutions Inc.** (`owner`): Company Profile, Job Postings, Applicants, Recruitment Analytics.                                                    |
| **Claimed Alumni**         | `alumni@atms.local`      | Linked to a verified graduate profile: My Dashboard, My Profile, Academic Records, Employment Tracer, Surveys, Career Opportunities, My Applications.                                  |

---

## Stress-Testing Checklist

1. **Public Portal (`/`):**
    - Verify that the hero CHED GTS card and `#tracer-metrics` section accurately reflect the `1,500` graduates, `40%` claim rate, `~87.5%` employability rate, and `80%` degree alignment rate.
    - Test instant client-side filtering and keyword search on the **Verified SEAIT Alumni Job Board** (`#opportunities`) across `All`, `On-site`, `Hybrid`, and `Remote`.
2. **Alumni Directory & Global Search (`/dashboard?page=Alumni+directory`):**
    - Test search responsiveness (`⌘ K`), program/batch filtering, and pagination across `1,500+` graduate profiles.
3. **Department Coordinator Scoping (`dept.ccs@atms.local`):**
    - Confirm that `Program alumni`, `Employment outcomes`, and `Claim assistance` strictly return records belonging to assigned **CICT** programs (`BSIT`, `BSCS`, `ACT`).
4. **CHED GTS Reports & CSV Export (`/dashboard?page=Reports`):**
    - Verify aggregation speed and CSV export generation (`Export report`) across `1,300+` employment records.
5. **Unclaimed Graduate Registration (`/register`):**
    - Profiles `#601` through `#1500` are intentionally left unclaimed so you can test the 3-field verification flow (`student_number`, `last_name`, `date_of_birth`) or submit mismatch requests to the Claim Assistance queue.

How to run it on Laravel Cloud (Staging)

1. Run on-demand from the Laravel Cloud Dashboard (Recommended)

In your staging environment's Commands tab, run:

bash
php artisan db:seed --class=StressTestSeeder --force

(Note: --force is required whenever APP_ENV is staging or production.)

2. Or run automatically on staging deployments

In your Laravel Cloud Deploy Commands for the staging environment (after php artisan migrate --force), add:

bash
php artisan db:seed --class=StressTestSeeder --force 3. Optional Environment Variables on Laravel Cloud

You can customize the dataset size and demo password in your Laravel Cloud staging Environment Variables:

dotenv
ADMIN_PASSWORD="YourStrongStagingPassword!"
STRESS_ALUMNI_COUNT=1500
STRESS_CLAIMED_COUNT=600
STRESS_EMPLOYER_COUNT=45
STRESS_JOB_COUNT=120

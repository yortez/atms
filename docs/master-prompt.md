# PROJECT: ALUMNI TRACER MANAGEMENT SYSTEM

## 1. PROJECT VISION

Develop a comprehensive, modern, and responsive Alumni Tracer Management System for a college.

The platform will centralize alumni records, monitor graduate employment outcomes, facilitate alumni engagement, conduct graduate tracer surveys, publish announcements, provide career opportunities, manage recruitment, and generate institutional reports.

The system must cover ALL graduates of the college, including historical graduates from previous academic years.

The objective is to establish a centralized digital platform connecting the college, academic departments, alumni, and employers.

The application must be scalable, secure, maintainable, user-friendly, and suitable for actual institutional implementation.

---

# 2. APPROVED TECHNOLOGY STACK

Use the following technologies.

### Backend

- Laravel – Backend framework and business logic.
- MySQL – Relational database.
- Laravel Sanctum – Authentication for the React frontend.
- Laravel Policies and Gates – Authorization and access control.
- Laravel API – Communication between backend and frontend.

### Frontend

- React – Frontend library.
- TypeScript – Type safety.
- Tailwind CSS – Styling framework.
- Vite – Development and build tooling.
- React Router – Client-side routing.
- Axios – API communication.
- Lucide React – Icons.
- Recharts – Charts and analytics.

### UI Component Library

- shadcn/ui – Reusable interface components.
- Radix UI – Accessible UI primitives.

### Additional Technologies

- PDF generation.
- Excel import and export.
- Private file storage.
- Laravel Notifications.
- Git and GitHub.

### Application Architecture

Build a SINGLE Laravel application with a React frontend.

Laravel will handle:

- Database operations.
- Business logic.
- API endpoints.
- Authentication.
- Authorization.
- Validation.
- File management.
- Notifications.
- Reporting.

React will handle:

- User interfaces.
- Dashboards.
- Navigation.
- Forms.
- Tables.
- Charts.
- Interactive components.
- Responsive layouts.

Do not use Filament as the primary administration interface. The administration dashboard will also be developed using React.

All five user roles must use the same application with role-specific dashboards and permissions.

---

# 3. USER ROLES

Implement five primary user roles.

### 3.1 System Administrator

Has complete system access.

Responsibilities:

- Manage users, roles, and permissions.
- Manage alumni records.
- Manage departments and academic programs.
- Manage surveys and announcements.
- Verify employers.
- Manage job postings.
- Monitor recruitment activities.
- Access institutional reports.
- View system activity logs.
- Configure system settings.

### 3.2 Alumni Coordinator

Responsibilities:

- Manage alumni records.
- Import alumni records using Excel.
- Handle alumni registration concerns.
- Manage surveys.
- Publish announcements.
- Monitor graduate employment.
- Generate institutional reports.

### 3.3 Department Coordinator

Responsibilities:

- Manage alumni from assigned academic programs.
- Monitor employment outcomes.
- Manage department-specific surveys.
- Publish authorized announcements.
- Generate department-specific reports.

IMPORTANT: Department coordinators must only access records belonging to their assigned programs unless explicitly granted additional permissions.

### 3.4 Alumni

Responsibilities:

- Register and claim existing alumni records.
- Manage personal information.
- View academic qualifications.
- Update employment information.
- Maintain employment history.
- Participate in surveys.
- View announcements.
- Browse job postings.
- Submit job applications.
- Upload resumes and supporting documents.
- Monitor application status.

### 3.5 Employer

Responsibilities:

- Register company accounts.
- Submit company information for verification.
- Manage company profiles.
- Publish job vacancies after verification.
- Manage their own job postings.
- View applicants who applied to their vacancies.
- Review applicants' academic qualifications.
- Review applicants' employment history.
- Download submitted resumes.
- Manage recruitment and application statuses.

---

# 4. PUBLIC WEBSITE AND PRIVATE PORTALS

Use a hybrid architecture.

### Public Website

Accessible without authentication:

- Home
- About
- Alumni Information
- Announcements
- Upcoming Alumni Events
- Public Job Board
- Job Details
- Alumni Registration
- Employer Registration
- Login

### Private Portals

Require authentication:

- Administrator Dashboard
- Alumni Coordinator Dashboard
- Department Coordinator Dashboard
- Alumni Dashboard
- Employer Dashboard

Sensitive alumni information must never be exposed through public pages or unauthenticated API endpoints.

---

# 5. CORE SYSTEM MODULES

Develop the following modules:

1. Dashboard and Analytics
2. Alumni Management
3. Academic Management
4. Alumni Registration and Verification
5. Employment Tracer
6. Survey Management
7. Announcement Management
8. Alumni Engagement
9. Employer Management
10. Job Portal
11. Recruitment Management
12. Reports and Analytics
13. Notifications
14. User and Role Management
15. Activity Logs
16. System Settings

---

# 6. ALUMNI MANAGEMENT AND DATABASE RULES

The system must maintain ONE centralized alumni profile per individual.

One alumnus can have:

- Multiple student numbers.
- Multiple academic programs.
- Multiple graduation records.
- Multiple degrees.

Each student number must be associated with its respective academic program and graduation record.

Example:

Alumni Profile: John Doe

| Student Number | Program                   | Graduation Year |
| -------------- | ------------------------- | --------------- |
| 2020-00125     | BS Information Technology | 2024            |
| 2024-00821     | BS Marketing Management   | 2026            |

Both records must belong to the same alumni profile.

Requirements:

- Import historical alumni records through Excel.
- Prevent duplicate student numbers.
- Detect potential duplicate alumni profiles.
- Support administrative record correction and merging.
- Maintain data integrity.
- Use normalized relational database structures.

---

# 7. ALUMNI REGISTRATION AND VERIFICATION

Implement the following workflow:

1. Alumni visit the registration page.
2. Enter their student number and required personal information.
3. The system searches existing alumni records.
4. If the information matches, automatically verify the account.
5. Link the account to the existing alumni profile.
6. If no matching record exists, prevent automatic registration and provide an administrative assistance process.

Additional requirements:

- Unique student numbers.
- Multiple student numbers per alumni profile.
- Prevent duplicate account claims.
- Protect against unauthorized account claiming.
- Maintain registration and verification logs.

---

# 8. EMPLOYMENT TRACER MODULE

Allow alumni to independently update their employment information.

Employment statuses should include:

- Employed
- Self-Employed
- Unemployed
- Pursuing Further Studies
- Government Employee
- Freelance
- Other

Maintain complete employment history.

Example:

| Date           | Status                   | Employer         |
| -------------- | ------------------------ | ---------------- |
| January 2025   | Unemployed               | —                |
| March 2025     | Employed                 | ABC Corporation  |
| January 2026   | Employed                 | XYZ Technologies |
| September 2026 | Pursuing Further Studies | —                |

Record:

- Employment status.
- Employer name.
- Job position.
- Industry.
- Employment type.
- Work location.
- Employment start date.
- Employment end date.
- Update date and time.

Never overwrite previous employment history.

Alumni-submitted information will be considered sufficient without mandatory employment verification.

---

# 9. SURVEY MANAGEMENT MODULE

Develop a customizable survey builder.

Administrators and authorized coordinators must be able to:

- Create surveys.
- Edit surveys.
- Publish and close surveys.
- Add custom questions.
- Configure question types.
- Set required and optional questions.
- Set survey schedules.
- Target graduation years.
- Target departments.
- Target academic programs.
- Target multiple graduating batches.

Supported question types:

- Short Text
- Long Text
- Multiple Choice
- Checkbox
- Dropdown
- Rating Scale
- Date
- Number
- Yes/No

Survey responses must support:

- Anonymous responses.
- Identifiable responses.

Allow configuration depending on survey requirements.

Prevent duplicate submissions when a survey requires one response per alumnus.

Provide survey analytics and exportable reports.

---

# 10. ANNOUNCEMENT MANAGEMENT MODULE

Allow authorized users to publish announcements.

Features:

- Title.
- Content.
- Featured image.
- Attachments.
- Publication date.
- Expiration date.
- Draft and published status.
- Target audience.

Targeting options:

- All alumni.
- Specific departments.
- Specific academic programs.
- Specific graduation years.
- Multiple selected groups.

Public announcements must be visible on the public website when designated as public.

Private announcements should only be visible to their intended audience.

---

# 11. INTEGRATED JOB PORTAL AND RECRUITMENT

Employers must register and undergo administrative verification before publishing job vacancies.

### Employer Features

- Company registration.
- Company profile.
- Verification status.
- Job posting creation.
- Job posting management.
- Applicant management.
- Resume downloads.
- Recruitment analytics.

### Alumni Features

- Browse job vacancies.
- View job descriptions.
- Apply using existing alumni profiles.
- Upload resumes.
- Upload supporting documents.
- Track applications.
- View application history.

### Application Statuses

Implement:

1. Submitted
2. Under Review
3. Shortlisted
4. Interview Scheduled
5. Interviewed
6. Hired
7. Rejected
8. Withdrawn

Maintain application status history.

### Employer Privacy Restrictions

Employers can only view applicants who applied to their own job postings.

They can review:

- Applicant profile.
- Academic qualifications.
- Employment history.
- Submitted resumes.
- Supporting documents.

Employers cannot:

- Browse the general alumni directory.
- Access alumni who have not applied to their jobs.
- Access the complete institutional employment database.
- View unrelated alumni records.

Only authorized college personnel can access the complete alumni employment database.

---

# 12. REPORTS AND ANALYTICS

Develop the following institutional reports:

1. Alumni Masterlist.
2. Alumni Population by Department.
3. Alumni Population by Academic Program.
4. Alumni Population by Graduation Year.
5. Employment Rate.
6. Employment Rate by Academic Program.
7. Employment Rate by Graduation Year.
8. Employment Related to Degree.
9. First Employment Statistics.
10. Average Time to First Employment.
11. Further Studies Statistics.
12. Employment History.
13. Survey Participation Rate.
14. Survey Response Summary.
15. Job Portal Analytics.
16. Job Application Statistics.
17. Successful Job Placements.
18. Graduate Tracer Summary.

Reports must support filtering by:

- Department.
- Academic Program.
- Graduation Year.
- Employment Status.
- Date Range.

Include:

- Statistical cards.
- Interactive charts.
- Tables.
- PDF exports.
- Excel exports.

---

# 13. NOTIFICATIONS AND ACTIVITY LOGS

Implement notifications for:

- New announcements.
- New surveys.
- Survey deadlines.
- New job opportunities.
- Application status updates.
- Employer verification updates.
- Important account activities.

Maintain activity logs for:

- User registration.
- Alumni profile updates.
- Employment information changes.
- Survey creation.
- Announcement publication.
- Job posting creation.
- Application status changes.
- User permission changes.
- Excel imports.
- Administrative modifications.

---

# 14. SECURITY AND DATA PRIVACY

Implement:

- Role-based access control.
- Authentication and authorization.
- Secure password handling.
- Backend validation.
- CSRF protection.
- Private file storage.
- Restricted document downloads.
- Secure API endpoints.
- Database constraints.
- Activity logging.
- Protection against unauthorized record access.

Follow applicable Philippine data privacy requirements, especially the Data Privacy Act of 2012 (RA 10173).

Provide appropriate privacy notices, consent mechanisms, access controls, and data retention policies.

---

# 15. APPROVED DEVELOPMENT WORKFLOW

IMPORTANT: Development MUST begin with UI/UX DESIGN.

Do not immediately implement the database, backend, authentication, or API integrations.

The first phase must use mock data and focus strictly on visual design and frontend behavior.

## PHASE 1 – UI/UX DESIGN WITH MOCK DATA

This is the FIRST development phase.

Focus exclusively on:

- Visual components.
- Layout structure.
- Navigation.
- Typography.
- Color system.
- Spacing.
- Cards.
- Tables.
- Forms.
- Charts.
- Dialogs and modals.
- Dropdowns.
- Tabs.
- Filters.
- Empty states.
- Loading states.
- Error states.
- Responsive layouts.

Design all interfaces:

### Public Website

- Home
- About
- Announcements
- Announcement Details
- Events
- Job Board
- Job Details
- Alumni Registration
- Employer Registration
- Login

### Administrator Dashboard

- Dashboard
- Alumni Management
- Alumni Profile
- Academic Records
- Departments
- Academic Programs
- Survey Management
- Survey Builder
- Announcements
- Employer Management
- Employer Verification
- Job Postings
- Recruitment Overview
- Reports and Analytics
- User Management
- Roles and Permissions
- Activity Logs
- Settings

### Department Coordinator Dashboard

- Department Overview
- Alumni Directory
- Alumni Details
- Employment Statistics
- Surveys
- Announcements
- Department Reports

### Alumni Dashboard

- Personal Dashboard
- Profile Management
- Academic Qualifications
- Employment Tracer
- Employment History
- Surveys
- Survey Participation
- Announcements
- Job Opportunities
- Job Details
- Application Submission
- Application History
- Notifications
- Account Settings

### Employer Dashboard

- Employer Overview
- Company Profile
- Verification Status
- Job Postings
- Create/Edit Job
- Applicant Management
- Applicant Profile
- Academic Qualifications
- Employment History
- Resume and Document Viewing
- Application Status Management
- Recruitment Analytics

### Responsive Requirements

Every page must support:

- Desktop
- Laptop
- Tablet
- Mobile

Test:

- Sidebar behavior.
- Mobile navigation.
- Responsive tables.
- Dashboard card layouts.
- Responsive charts.
- Form layouts.
- Dialogs and modals.
- Touch-friendly controls.

### Mock Data

Use realistic mock data representing:

- Multiple departments.
- Multiple academic programs.
- Different graduation years.
- Alumni with multiple degrees.
- Different employment statuses.
- Survey questions and responses.
- Announcements.
- Employers.
- Job postings.
- Job applications.

Use centralized and reusable mock data structures.

### Phase 1 Completion Criteria

Before moving forward:

1. All major pages have completed visual layouts.
2. All five roles have their respective interfaces.
3. Navigation works.
4. Mock data populates all relevant components.
5. Forms and dialogs have frontend interactions.
6. Responsive states are tested.
7. Design consistency is maintained.
8. The UI/UX design is reviewed and approved.

Do not implement production authentication, database operations, or backend integrations during this phase.

## PHASE 2 – DATABASE ARCHITECTURE

After UI/UX approval:

- Design the complete ERD.
- Define database tables.
- Define columns and data types.
- Establish primary keys.
- Establish foreign keys.
- Define relationships.
- Add indexes and unique constraints.
- Validate normalization.
- Review alumni-to-student-number-to-graduation relationships.

## PHASE 3 – LARAVEL BACKEND DEVELOPMENT

Implement:

- Database migrations.
- Eloquent models.
- Model relationships.
- API endpoints.
- Business logic.
- Request validation.
- Authorization policies.
- File management.
- Notifications.
- Activity logging.
- Reporting services.

## PHASE 4 – AUTHENTICATION AND AUTHORIZATION

Implement:

- Laravel Sanctum.
- User authentication.
- Role-based access control.
- Alumni verification.
- Employer verification.
- Password management.
- Department-level access restrictions.
- Employer access restrictions.
- Secure API authorization.

## PHASE 5 – FRONTEND AND BACKEND INTEGRATION

Replace mock data with actual Laravel API responses.

Connect all frontend modules:

- Dashboard statistics.
- Alumni management.
- Academic records.
- Employment tracking.
- Surveys.
- Announcements.
- Job postings.
- Applications.
- Reports.
- Notifications.

Preserve the approved UI/UX design.

## PHASE 6 – BUSINESS LOGIC AND WORKFLOWS

Implement and test:

- Alumni registration.
- Alumni verification.
- Excel imports.
- Employment updates.
- Survey creation and participation.
- Announcement publishing.
- Employer registration.
- Employer verification.
- Job posting.
- Job applications.
- Recruitment processing.
- Institutional reporting.

## PHASE 7 – TESTING AND QUALITY ASSURANCE

Conduct:

- Functional testing.
- API testing.
- Database integrity testing.
- Authentication testing.
- Authorization testing.
- Responsive design testing.
- File upload testing.
- Survey testing.
- Recruitment workflow testing.
- Report validation.
- Security testing.

## PHASE 8 – DEPLOYMENT

Prepare:

- Production environment.
- Database configuration.
- Environment variables.
- Private file storage.
- Frontend production build.
- Database backups.
- Security configuration.
- Deployment documentation.

---

# 16. DEVELOPMENT RULES

Follow these instructions throughout the project:

1. Follow the approved technology stack.
2. Begin with UI/UX design using mock data.
3. Do not skip the design approval stage.
4. Build reusable React components.
5. Use TypeScript.
6. Maintain consistent design patterns.
7. Use centralized mock data during Phase 1.
8. Do not duplicate alumni profiles.
9. Maintain normalized database relationships.
10. Enforce authorization on the backend.
11. Keep sensitive information private.
12. Use reusable Laravel services and components.
13. Avoid unnecessary dependencies.
14. Develop one module at a time.
15. Test each module before proceeding.
16. Explain important architectural decisions.
17. Maintain technical documentation.
18. Ask for approval before moving to the next major development phase.

# 17. INITIAL IMPLEMENTATION INSTRUCTION

START WITH PHASE 1: UI/UX DESIGN WITH MOCK DATA.

Your immediate responsibility is to establish the frontend architecture and design system, then develop the public website and role-based dashboard interfaces.

Do not generate database migrations, Laravel API endpoints, authentication functionality, or backend business logic yet.

Focus strictly on:

- Visual components.
- Layout structure.
- Navigation.
- Page composition.
- Mock data presentation.
- Interactive frontend states.
- Responsive behavior.

Build the application systematically and maintain the approved project requirements throughout development.

The ultimate goal is a production-ready, secure, scalable, and comprehensive college Alumni Tracer Management System.

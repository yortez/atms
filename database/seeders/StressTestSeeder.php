<?php

namespace Database\Seeders;

use App\Models\AcademicProgram;
use App\Models\Degree;
use App\Models\Department;
use App\Models\Employer;
use App\Models\EmploymentStatus;
use App\Models\ProgramDegree;
use App\Models\Role;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StressTestSeeder extends Seeder
{
    /**
     * Seed a high-volume dataset to stress test all SEAIT ATMS modules,
     * reports, filters, pagination, and public portal metrics.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            EmploymentStatusSeeder::class,
            SystemAdminSeeder::class,
        ]);

        $alumniTargetCount = max(100, (int) env('STRESS_ALUMNI_COUNT', 1500));
        $claimedTargetCount = min($alumniTargetCount, max(50, (int) env('STRESS_CLAIMED_COUNT', 600)));
        $employerTargetCount = max(10, (int) env('STRESS_EMPLOYER_COUNT', 45));
        $jobTargetCount = max(20, (int) env('STRESS_JOB_COUNT', 120));

        $this->command?->info("Starting SEAIT ATMS Stress Test Seeder ({$alumniTargetCount} alumni records)...");

        $now = now();
        $passwordHash = Hash::make((string) env('ADMIN_PASSWORD', 'Password123!'));

        // 1. Ensure Roles & Reference Data
        $roles = Role::query()->pluck('id', 'name');
        $statuses = EmploymentStatus::query()->pluck('id', 'code');
        $adminUser = User::query()->where('email', 'admin@atms.local')->first()
            ?? User::query()->first();

        // 2. Seed Authentic SEAIT Departments, Programs & ProgramDegrees
        $programDegreeIds = $this->seedAcademicCatalog();
        $programIds = AcademicProgram::query()->pluck('id')->all();
        $departmentIds = Department::query()->pluck('id')->all();

        // Assign CICT programs to dept.ccs@atms.local
        $deptCoordinator = User::query()->where('email', 'dept.ccs@atms.local')->first();
        if ($deptCoordinator && $adminUser) {
            $cictPrograms = AcademicProgram::query()
                ->whereIn('code', ['BSIT', 'BSCS', 'ACT'])
                ->pluck('id');
            if ($cictPrograms->isNotEmpty()) {
                $deptCoordinator->assignedPrograms()->syncWithoutDetaching(
                    $cictPrograms->mapWithKeys(fn ($id) => [
                        $id => ['assigned_by_user_id' => $adminUser->id, 'created_at' => $now],
                    ])->all()
                );
            }
        }

        // 3. Seed Employers & Job Postings
        $employerIds = $this->seedEmployers($employerTargetCount, $adminUser?->id, $now);
        $jobIds = $this->seedJobPostings($employerIds, $jobTargetCount, $now);

        // 4. Seed High-Volume Alumni Profiles, Education, Contacts, Addresses & Employment Records
        [$profileIds, $claimedPairs] = $this->seedAlumniCohort(
            $alumniTargetCount,
            $claimedTargetCount,
            $programDegreeIds,
            $statuses->all(),
            $employerIds,
            $roles['alumni'] ?? null,
            $adminUser?->id,
            $passwordHash,
            $now,
        );

        // 5. Seed Job Applications (with RA 10173 Frozen Profile Snapshots)
        $this->seedJobApplications($jobIds, $claimedPairs, $adminUser?->id, $now);

        // 6. Seed CHED GTS Surveys, Questions & High-Volume Responses
        $this->seedSurveysAndResponses($profileIds, $departmentIds, $programIds, $adminUser?->id ?? 1, $now);

        // 7. Seed Announcements & Targeted Advisories
        $this->seedAnnouncements($departmentIds, $programIds, $adminUser?->id ?? 1, $now);

        // 8. Seed Alumni Events & Event Registrations (RSVPs)
        $this->seedEventsAndRegistrations($claimedPairs, $departmentIds, $programIds, $adminUser?->id ?? 1, $now);

        // 9. Seed Registration Claim Assistance Queue & Audit Logs
        $this->seedRegistrationAssistanceQueue($programIds, $profileIds, $adminUser?->id, $now);
        $this->seedActivityLogs($adminUser?->id, $profileIds, $now);

        $this->command?->info('SEAIT ATMS Stress Test Seeding completed successfully!');
    }

    /**
     * @return list<int>
     */
    private function seedAcademicCatalog(): array
    {
        $catalog = [
            [
                'code' => 'CICT',
                'name' => 'College of Information and Communication Technology',
                'description' => 'Software engineering, enterprise systems, networking, and computing research.',
                'programs' => [
                    ['code' => 'BSIT', 'name' => 'BS in Information Technology', 'level' => 'Bachelor'],
                    ['code' => 'BSCS', 'name' => 'BS in Computer Science', 'level' => 'Bachelor'],
                    ['code' => 'ACT', 'name' => 'Associate in Computer Technology', 'level' => 'Associate'],
                ],
            ],
            [
                'code' => 'CBGG',
                'name' => 'College of Business and Good Governance',
                'description' => 'Corporate management, accounting systems, hospitality, and public administration.',
                'programs' => [
                    ['code' => 'BSBA-FM', 'name' => 'BS in Business Administration - Financial Management', 'level' => 'Bachelor'],
                    ['code' => 'BSBA-MM', 'name' => 'BS in Business Administration - Marketing Management', 'level' => 'Bachelor'],
                    ['code' => 'BSAIS', 'name' => 'BS in Accounting Information System', 'level' => 'Bachelor'],
                    ['code' => 'BSHM', 'name' => 'BS in Hospitality Management', 'level' => 'Bachelor'],
                    ['code' => 'BSTM', 'name' => 'BS in Tourism Management', 'level' => 'Bachelor'],
                ],
            ],
            [
                'code' => 'COED',
                'name' => 'College of Education',
                'description' => 'Teacher education, curriculum leadership, and foundational pedagogy.',
                'programs' => [
                    ['code' => 'BEED', 'name' => 'Bachelor of Elementary Education', 'level' => 'Bachelor'],
                    ['code' => 'BSED-ENG', 'name' => 'Bachelor of Secondary Education - English', 'level' => 'Bachelor'],
                    ['code' => 'BSED-MATH', 'name' => 'Bachelor of Secondary Education - Mathematics', 'level' => 'Bachelor'],
                    ['code' => 'BECED', 'name' => 'Bachelor of Early Childhood Education', 'level' => 'Bachelor'],
                ],
            ],
            [
                'code' => 'CET',
                'name' => 'College of Engineering and Technology',
                'description' => 'Infrastructure design, civil works, and industrial technology.',
                'programs' => [
                    ['code' => 'BSCE', 'name' => 'BS in Civil Engineering', 'level' => 'Bachelor'],
                    ['code' => 'BSEE', 'name' => 'BS in Electrical Engineering', 'level' => 'Bachelor'],
                ],
            ],
            [
                'code' => 'COA',
                'name' => 'College of Agriculture',
                'description' => 'Sustainable crop production, agribusiness, and Mindanao food security.',
                'programs' => [
                    ['code' => 'BSA', 'name' => 'BS in Agriculture', 'level' => 'Bachelor'],
                    ['code' => 'BSAB', 'name' => 'BS in Agribusiness', 'level' => 'Bachelor'],
                ],
            ],
            [
                'code' => 'CCJE',
                'name' => 'College of Criminal Justice Education',
                'description' => 'Public safety, forensic science, and law enforcement administration.',
                'programs' => [
                    ['code' => 'BSCRIM', 'name' => 'BS in Criminology', 'level' => 'Bachelor'],
                ],
            ],
        ];

        $programDegreeIds = [];

        foreach ($catalog as $deptData) {
            $department = Department::query()->updateOrCreate(
                ['code' => $deptData['code']],
                [
                    'name' => $deptData['name'],
                    'description' => $deptData['description'],
                    'is_active' => true,
                ]
            );

            foreach ($deptData['programs'] as $progData) {
                $program = AcademicProgram::query()->updateOrCreate(
                    [
                        'department_id' => $department->id,
                        'code' => $progData['code'],
                    ],
                    [
                        'name' => $progData['name'],
                        'description' => "{$progData['name']} under {$department->name}.",
                        'is_active' => true,
                    ]
                );

                $degree = Degree::query()->updateOrCreate(
                    ['code' => $progData['code']],
                    [
                        'title' => $progData['name'],
                        'degree_level' => $progData['level'],
                    ]
                );

                $programDegree = ProgramDegree::query()->updateOrCreate(
                    [
                        'program_id' => $program->id,
                        'degree_id' => $degree->id,
                    ],
                    ['is_active' => true]
                );

                $programDegreeIds[] = $programDegree->id;
            }
        }

        return $programDegreeIds;
    }

    /**
     * @return list<int>
     */
    private function seedEmployers(int $targetCount, ?int $reviewerId, $now): array
    {
        $industries = [
            'Information Technology & Cloud Services',
            'Banking & Financial Services',
            'Agribusiness & Food Processing',
            'Healthcare & Hospital Administration',
            'Civil Engineering & Construction',
            'Public Education & Academe',
            'Hospitality & Eco-Tourism',
            'Retail & Supply Chain Logistics',
            'Telecommunications & BPO',
            'Government & Public Administration',
        ];

        $cities = [
            'General Santos City, South Cotabato',
            'Koronadal City, South Cotabato',
            'Tupi, South Cotabato',
            'Polomolok, South Cotabato',
            'Davao City, Davao del Sur',
            'BGC, Taguig City, Metro Manila',
            'Makati City, Metro Manila',
            'Cebu IT Park, Cebu City',
            'Cagayan de Oro City',
        ];

        $companyPrefixes = [
            'Mindanao', 'South Cotabato', 'Sarangani', 'Pacific', 'Apex', 'Vertex',
            'Prime', 'Global', 'Pioneer', 'Summit', 'Horizon', 'Nexus', 'Vanguard',
            'Archipelago', 'Emerald', 'Highland', 'Metro', 'First', 'United', 'Allied',
        ];

        $companySuffixes = [
            'Tech Solutions Inc.', 'Agri-Ventures Corp.', 'Systems & Consulting',
            'Builders & Development Corp.', 'Financial Group', 'Global BPO Services',
            'Hospitality & Resorts', 'Logistics Hub Inc.', 'Medical Center',
            'Foods & Manufacturing Corp.', 'Digital Innovations', 'Enterprise Partners',
        ];

        $existingCount = Employer::query()->count();
        $toCreate = max(0, $targetCount - $existingCount);

        $rows = [];
        for ($i = 1; $i <= $toCreate; $i++) {
            $idx = $existingCount + $i;
            $status = $i % 9 === 0 ? 'pending' : ($i % 17 === 0 ? 'rejected' : 'verified');
            $companyName = $companyPrefixes[$idx % count($companyPrefixes)].' '.$companySuffixes[($idx * 3) % count($companySuffixes)]." #{$idx}";

            $rows[] = [
                'company_name' => $companyName,
                'website' => "https://partner-{$idx}.seait-careers.example.com",
                'description' => "Institutional employer partner providing career pathways and industry immersion for SEAIT graduates in {$cities[$idx % count($cities)]}.",
                'industry' => $industries[$idx % count($industries)],
                'registration_number' => sprintf('SEC-%d-%05d', 2018 + ($idx % 8), 10000 + $idx),
                'contact_email' => "hr.partner{$idx}@careers.example.com",
                'contact_phone' => sprintf('+63 917 %03d %04d', 100 + ($idx % 899), 1000 + ($idx % 8999)),
                'address' => $cities[$idx % count($cities)],
                'verification_status' => $status,
                'verified_at' => $status === 'verified' ? $now->copy()->subDays($idx % 90) : null,
                'reviewed_by_user_id' => $status !== 'pending' ? $reviewerId : null,
                'created_at' => $now->copy()->subDays($idx % 120),
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('employers')->insert($chunk);
        }

        return Employer::query()
            ->where('verification_status', 'verified')
            ->pluck('id')
            ->all();
    }

    /**
     * @param  list<int>  $verifiedEmployerIds
     * @return list<int>
     */
    private function seedJobPostings(array $verifiedEmployerIds, int $targetCount, $now): array
    {
        if (empty($verifiedEmployerIds)) {
            return [];
        }

        $jobTitles = [
            'Full-Stack Web Developer (Laravel / React)',
            'Junior Software Quality Assurance Engineer',
            'IT Network & Systems Administrator',
            'Accounting & Tax Compliance Associate',
            'Financial Analyst & Audit Specialist',
            'Senior High School STEM Instructor',
            'Civil Site & Structural Project Engineer',
            'Agricultural Extension & Field Agronomist',
            'Hotel Operations & Front Office Supervisor',
            'Customer Success & Technical Support Specialist',
            'Data Analyst & BI Reporting Officer',
            'Human Resources & Talent Acquisition Partner',
            'Cybersecurity & Compliance Analyst',
            'Supply Chain & Warehouse Operations Coordinator',
            'Agribusiness Marketing & Export Officer',
            'Compliance & Legal Documentation Specialist',
        ];

        $locations = [
            'General Santos City, South Cotabato',
            'Koronadal City, South Cotabato',
            'Tupi, South Cotabato',
            'Polomolok, South Cotabato',
            'Davao City, Davao del Sur',
            'Taguig City, Metro Manila (Remote-friendly)',
            'Cebu City, Cebu',
        ];

        $employmentTypes = ['Full-time', 'Full-time', 'Full-time', 'Contract', 'Part-time', 'Internship'];
        $workplaceTypes = ['On-site', 'Hybrid', 'Remote'];

        $existingCount = DB::table('job_postings')->count();
        $toCreate = max(0, $targetCount - $existingCount);

        $rows = [];
        for ($i = 1; $i <= $toCreate; $i++) {
            $idx = $existingCount + $i;
            $employerId = $verifiedEmployerIds[$idx % count($verifiedEmployerIds)];
            $title = $jobTitles[$idx % count($jobTitles)];
            $workplace = $workplaceTypes[$idx % count($workplaceTypes)];
            $empType = $employmentTypes[$idx % count($employmentTypes)];
            $location = $locations[$idx % count($locations)];
            $salaryMin = 18000 + (($idx % 12) * 3500);
            $salaryMax = $salaryMin + 8000 + (($idx % 5) * 3000);
            $isPublished = $idx % 10 !== 0;

            $rows[] = [
                'employer_id' => $employerId,
                'title' => $title,
                'description' => "We are hiring a dedicated {$title} to join our growing operations in {$location}.\n\nKey Responsibilities:\n• Collaborate with cross-functional teams to deliver high-impact project outcomes.\n• Maintain operational standards, documentation, and quality benchmarks.\n• Participate in continuous professional development and mentoring.\n\nQualifications:\n• Graduate of a relevant SEAIT degree program.\n• Strong analytical, communication, and problem-solving skills.\n• Fresh graduates with strong academic standing or internship experience are welcome to apply.",
                'location' => $location,
                'employment_type' => $empType,
                'workplace_type' => $workplace,
                'salary_min' => $salaryMin,
                'salary_max' => $salaryMax,
                'closes_at' => $now->copy()->addDays(15 + ($idx % 75))->toDateString(),
                'status' => $isPublished ? 'published' : 'draft',
                'published_at' => $isPublished ? $now->copy()->subDays($idx % 30) : null,
                'created_at' => $now->copy()->subDays(($idx % 45) + 5),
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('job_postings')->insert($chunk);
        }

        return DB::table('job_postings')
            ->where('status', 'published')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * @param  list<int>  $programDegreeIds
     * @param  array<string, int>  $statuses
     * @param  list<int>  $employerIds
     * @return array{0: list<int>, 1: list<array{user_id: int, profile_id: int, name: string, email: string}>}
     */
    private function seedAlumniCohort(
        int $targetAlumniCount,
        int $targetClaimedCount,
        array $programDegreeIds,
        array $statuses,
        array $employerIds,
        ?int $alumniRoleId,
        ?int $creatorId,
        string $passwordHash,
        $now,
    ): array {
        $firstNames = [
            'Juan', 'Maria', 'Jose', 'Angela', 'Mark', 'Kristine', 'Christian', 'camille',
            'Joshua', 'Jasmine', 'kenneth', 'Rhea', 'John Paul', 'Princess', 'Jerome', 'Alyssa',
            'Ralph', 'Bea', 'Vincent', 'Katrina', 'Kevin', 'Nicole', 'Daniel', 'Hannah',
            'Miguel', 'Clarisse', 'Bryan', 'michelle', 'Paolo', 'Patricia', 'Francis', 'Erica',
            'Gabriel', 'Samantha', 'Adrian', 'Denise', 'Carlo', 'Mae', 'Rafael', 'Joanna',
        ];

        $middleNames = [
            'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres',
            'Flores', 'Castillo', 'Rivera', 'Aquino', 'Navarro', 'Ramos', 'Castro', 'Dela Cruz',
            'Villanueva', 'Fernandez', 'Morales', 'Perez',
        ];

        $lastNames = [
            'Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Ramos', 'Mendoza', 'Torres', 'Flores',
            'Gonzales', 'Bautista', 'Villanueva', 'Fernandez', 'Cruz', 'De Guzman', 'Lopez',
            'Perez', 'Castillo', 'Francisco', 'Rivera', 'Aquino', 'Soriano', 'Mercado',
            'Salazar', 'Tolentino', 'Valdez', 'Aguilar', 'Navarro', 'Sanchez', 'Diaz', 'Gomez',
        ];

        $municipalities = [
            ['city' => 'Tupi', 'province' => 'South Cotabato', 'postal' => '9505'],
            ['city' => 'Koronadal City', 'province' => 'South Cotabato', 'postal' => '9506'],
            ['city' => 'Polomolok', 'province' => 'South Cotabato', 'postal' => '9504'],
            ['city' => 'General Santos City', 'province' => 'South Cotabato', 'postal' => '9500'],
            ['city' => 'Surallah', 'province' => 'South Cotabato', 'postal' => '9512'],
            ['city' => 'Banga', 'province' => 'South Cotabato', 'postal' => '9511'],
            ['city' => 'Norala', 'province' => 'South Cotabato', 'postal' => '9508'],
            ['city' => 'Tampakan', 'province' => 'South Cotabato', 'postal' => '9507'],
            ['city' => 'Tantangan', 'province' => 'South Cotabato', 'postal' => '9510'],
            ['city' => 'Alabel', 'province' => 'Sarangani', 'postal' => '9501'],
        ];

        $honorsList = [null, null, null, null, null, 'Cum Laude', 'Magna Cum Laude', 'Academic Distinction', 'Dean’s Lister'];

        $jobRoles = [
            ['title' => 'Software Engineer', 'industry' => 'Information Technology', 'company' => 'Mindanao Tech Solutions Inc.'],
            ['title' => 'Systems Analyst', 'industry' => 'Information Technology', 'company' => 'South Cotabato Digital Hub'],
            ['title' => 'Junior Accountant', 'industry' => 'Banking & Finance', 'company' => 'KCC Property Holdings Inc.'],
            ['title' => 'Public School Teacher I', 'industry' => 'Education', 'company' => 'DepEd South Cotabato Division'],
            ['title' => 'Field Agronomist', 'industry' => 'Agribusiness', 'company' => 'Dole Philippines Inc. (Upper Valley)'],
            ['title' => 'Site Civil Engineer', 'industry' => 'Construction & Engineering', 'company' => 'SOCCSKSARGEN Builders Corp.'],
            ['title' => 'Front Office Executive', 'industry' => 'Hospitality & Tourism', 'company' => 'Greenleaf Hotel Gensan'],
            ['title' => 'Police Officer I', 'industry' => 'Public Safety', 'company' => 'Philippine National Police - PRO 12'],
            ['title' => 'Operations Supervisor', 'industry' => 'Retail & Logistics', 'company' => 'RD Corporation General Santos'],
            ['title' => 'Administrative Officer II', 'industry' => 'Government', 'company' => 'Provincial Government of South Cotabato'],
        ];

        // Ensure dedicated demo alumni account exists
        $existingProfilesCount = DB::table('alumni_profiles')->count();
        $toCreate = max(0, $targetAlumniCount - $existingProfilesCount);

        if ($toCreate > 0) {
            $profileRows = [];
            for ($i = 1; $i <= $toCreate; $i++) {
                $idx = $existingProfilesCount + $i;
                $firstName = ucfirst($firstNames[$idx % count($firstNames)]);
                $middleName = $middleNames[($idx * 3) % count($middleNames)];
                $lastName = $lastNames[($idx * 7) % count($lastNames)];
                $fullName = "{$lastName}, {$firstName} {$middleName}";
                $birthYear = 1994 + ($idx % 11);
                $birthMonth = ($idx % 12) + 1;
                $birthDay = ($idx % 28) + 1;

                $profileRows[] = [
                    'name' => $fullName,
                    'first_name' => $firstName,
                    'middle_name' => $middleName,
                    'last_name' => $lastName,
                    'suffix' => $idx % 25 === 0 ? 'Jr.' : null,
                    'preferred_name' => $firstName,
                    'email' => "alumni.grad{$idx}@seait.example.edu.ph",
                    'date_of_birth' => sprintf('%04d-%02d-%02d', $birthYear, $birthMonth, $birthDay),
                    'profile_status' => 'active',
                    'created_by_user_id' => $creatorId,
                    'created_at' => $now->copy()->subDays($idx % 365),
                    'updated_at' => $now,
                ];
            }

            foreach (array_chunk($profileRows, 250) as $chunk) {
                DB::table('alumni_profiles')->insert($chunk);
            }
        }

        // Fetch profiles that don't have education records yet
        $existingEduProfileIds = DB::table('alumni_education_records')->pluck('alumni_profile_id')->all();
        $existingEduSet = array_flip($existingEduProfileIds);

        $allProfiles = DB::table('alumni_profiles')
            ->select(['id', 'name', 'email'])
            ->orderBy('id')
            ->get();

        $eduRows = [];
        $contactRows = [];
        $addressRows = [];
        $employmentRows = [];

        $employedStatusIds = array_values(array_filter([
            $statuses['employed'] ?? null,
            $statuses['government-employee'] ?? null,
            $statuses['self-employed'] ?? null,
            $statuses['freelance'] ?? null,
        ]));
        $unemployedStatusId = $statuses['unemployed'] ?? ($employedStatusIds[0] ?? 1);
        $furtherStudiesStatusId = $statuses['further-studies'] ?? $unemployedStatusId;

        foreach ($allProfiles as $profile) {
            $pid = (int) $profile->id;
            if (isset($existingEduSet[$pid])) {
                continue;
            }

            $gradYear = 2018 + ($pid % 9); // 2018 to 2026
            $entryYear = $gradYear - 4;
            $studentNumber = sprintf('%04d-%05d', $entryYear, $pid);
            $progDegreeId = $programDegreeIds[$pid % count($programDegreeIds)];
            $gwa = round(1.25 + (($pid % 150) / 100), 2);

            $eduRows[] = [
                'alumni_profile_id' => $pid,
                'student_number' => $studentNumber,
                'program_degree_id' => $progDegreeId,
                'graduation_year' => $gradYear,
                'honors' => $gwa <= 1.75 ? ($honorsList[$pid % count($honorsList)] ?? 'Cum Laude') : null,
                'gwa' => $gwa,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            $contactRows[] = [
                'alumni_id' => $pid,
                'type' => 'email',
                'value' => $profile->email,
                'is_primary' => true,
                'is_verified' => $pid % 3 !== 0,
                'verified_at' => $pid % 3 !== 0 ? $now : null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            $contactRows[] = [
                'alumni_id' => $pid,
                'type' => 'phone',
                'value' => sprintf('+63 9%02d %03d %04d', 15 + ($pid % 80), 100 + ($pid % 899), 1000 + ($pid % 8999)),
                'is_primary' => true,
                'is_verified' => true,
                'verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            $loc = $municipalities[$pid % count($municipalities)];
            $addressRows[] = [
                'alumni_id' => $pid,
                'address_type' => 'current',
                'line_1' => sprintf('Purok %d, Barangay Poblacion', ($pid % 12) + 1),
                'line_2' => 'National Highway',
                'city' => $loc['city'],
                'province' => $loc['province'],
                'postal_code' => $loc['postal'],
                'country_code' => 'PH',
                'is_primary' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            // ~90% of graduates have reported tracer records
            if ($pid % 10 !== 0) {
                $isEmployedOutcome = $pid % 8 !== 0; // ~87.5% employment rate
                if ($isEmployedOutcome && ! empty($employedStatusIds)) {
                    $statusId = $employedStatusIds[$pid % count($employedStatusIds)];
                    $jobInfo = $jobRoles[$pid % count($jobRoles)];
                    $isAligned = $pid % 5 !== 0; // 80% degree alignment
                    $linkedEmployerId = ! empty($employerIds) && $pid % 2 === 0
                        ? $employerIds[$pid % count($employerIds)]
                        : null;

                    $employmentRows[] = [
                        'alumni_id' => $pid,
                        'employment_status_id' => $statusId,
                        'employer_id' => $linkedEmployerId,
                        'employer_name' => $jobInfo['company'],
                        'job_title' => $jobInfo['title'],
                        'industry' => $jobInfo['industry'],
                        'employment_type' => $pid % 6 === 0 ? 'Contract' : 'Full-time',
                        'work_location' => "{$loc['city']}, {$loc['province']}",
                        'is_related_to_degree' => $isAligned,
                        'started_on' => sprintf('%04d-%02d-15', min(2026, $gradYear + 1), ($pid % 12) + 1),
                        'ended_on' => null,
                        'reported_at' => $now->copy()->subDays($pid % 180),
                        'reported_by_user_id' => $creatorId,
                        'created_at' => $now->copy()->subDays($pid % 180),
                        'updated_at' => $now,
                    ];
                } else {
                    $statusId = $pid % 16 === 0 ? $furtherStudiesStatusId : $unemployedStatusId;
                    $employmentRows[] = [
                        'alumni_id' => $pid,
                        'employment_status_id' => $statusId,
                        'employer_id' => null,
                        'employer_name' => null,
                        'job_title' => null,
                        'industry' => null,
                        'employment_type' => null,
                        'work_location' => "{$loc['city']}, {$loc['province']}",
                        'is_related_to_degree' => false,
                        'started_on' => null,
                        'ended_on' => null,
                        'reported_at' => $now->copy()->subDays($pid % 120),
                        'reported_by_user_id' => $creatorId,
                        'created_at' => $now->copy()->subDays($pid % 120),
                        'updated_at' => $now,
                    ];
                }
            }
        }

        foreach (array_chunk($eduRows, 250) as $chunk) {
            DB::table('alumni_education_records')->insertOrIgnore($chunk);
        }
        foreach (array_chunk($contactRows, 250) as $chunk) {
            DB::table('alumni_contact_methods')->insert($chunk);
        }
        foreach (array_chunk($addressRows, 250) as $chunk) {
            DB::table('alumni_addresses')->insert($chunk);
        }
        foreach (array_chunk($employmentRows, 250) as $chunk) {
            DB::table('alumni_employment_records')->insert($chunk);
        }

        // Create claimed user accounts for up to $targetClaimedCount profiles
        $claimedProfileIds = DB::table('users')
            ->whereNotNull('alumni_profile_id')
            ->pluck('alumni_profile_id')
            ->all();
        $claimedSet = array_flip($claimedProfileIds);

        $neededClaims = max(0, $targetClaimedCount - count($claimedProfileIds));
        if ($neededClaims > 0) {
            $unclaimedProfiles = $allProfiles
                ->reject(fn ($p) => isset($claimedSet[(int) $p->id]))
                ->take($neededClaims);

            $userRows = [];
            foreach ($unclaimedProfiles as $index => $profile) {
                $email = $index === 0 && ! User::query()->where('email', 'alumni@atms.local')->exists()
                    ? 'alumni@atms.local'
                    : $profile->email;

                $userRows[] = [
                    'name' => $profile->name,
                    'email' => $email,
                    'email_verified_at' => $now,
                    'password' => $passwordHash,
                    'alumni_profile_id' => $profile->id,
                    'created_at' => $now->copy()->subDays($profile->id % 180),
                    'updated_at' => $now,
                ];
            }

            foreach (array_chunk($userRows, 250) as $chunk) {
                DB::table('users')->insertOrIgnore($chunk);
            }

            if ($alumniRoleId) {
                $newlyClaimedUserIds = DB::table('users')
                    ->whereNotNull('alumni_profile_id')
                    ->pluck('id');

                $rolePivotRows = $newlyClaimedUserIds->map(fn ($uid) => [
                    'user_id' => $uid,
                    'role_id' => $alumniRoleId,
                    'assigned_by_user_id' => $creatorId,
                    'created_at' => $now,
                ])->all();

                foreach (array_chunk($rolePivotRows, 250) as $chunk) {
                    DB::table('user_roles')->insertOrIgnore($chunk);
                }
            }
        }

        $claimedPairs = DB::table('users')
            ->whereNotNull('alumni_profile_id')
            ->select(['id as user_id', 'alumni_profile_id as profile_id', 'name', 'email'])
            ->get()
            ->map(fn ($row) => [
                'user_id' => (int) $row->user_id,
                'profile_id' => (int) $row->profile_id,
                'name' => (string) $row->name,
                'email' => (string) $row->email,
            ])
            ->all();

        return [
            $allProfiles->pluck('id')->map(fn ($id) => (int) $id)->all(),
            $claimedPairs,
        ];
    }

    /**
     * @param  list<int>  $jobIds
     * @param  list<array{user_id: int, profile_id: int, name: string, email: string}>  $claimedPairs
     */
    private function seedJobApplications(array $jobIds, array $claimedPairs, ?int $reviewerId, $now): void
    {
        if (empty($jobIds) || empty($claimedPairs)) {
            return;
        }

        $existingCount = DB::table('job_applications')->count();
        $targetApps = 500;
        if ($existingCount >= $targetApps) {
            return;
        }

        $statuses = ['submitted', 'submitted', 'under_review', 'shortlisted', 'interview', 'offered', 'rejected'];
        $rows = [];
        $usedKeys = [];

        for ($i = 0; $i < $targetApps; $i++) {
            $jobId = $jobIds[$i % count($jobIds)];
            $applicant = $claimedPairs[($i * 7) % count($claimedPairs)];
            $key = "{$jobId}-{$applicant['profile_id']}";
            if (isset($usedKeys[$key])) {
                continue;
            }
            $usedKeys[$key] = true;

            $status = $statuses[$i % count($statuses)];
            $rows[] = [
                'job_posting_id' => $jobId,
                'alumni_profile_id' => $applicant['profile_id'],
                'applicant_user_id' => $applicant['user_id'],
                'cover_letter' => "Dear Hiring Team,\n\nAs a verified SEAIT graduate, I am excited to submit my application for this role. My academic training and practical experience align strongly with your team's objectives.",
                'profile_snapshot' => json_encode([
                    'name' => $applicant['name'],
                    'email' => $applicant['email'],
                    'institution' => 'South East Asian Institute of Technology, Inc. (SEAIT)',
                    'ra_10173_consent' => true,
                    'captured_at' => $now->toIso8601String(),
                ]),
                'status' => $status,
                'reviewed_at' => $status !== 'submitted' ? $now->copy()->subDays($i % 14) : null,
                'reviewed_by_user_id' => $status !== 'submitted' ? $reviewerId : null,
                'created_at' => $now->copy()->subDays(($i % 30) + 1),
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 200) as $chunk) {
            DB::table('job_applications')->insertOrIgnore($chunk);
        }
    }

    /**
     * @param  list<int>  $profileIds
     * @param  list<int>  $departmentIds
     * @param  list<int>  $programIds
     */
    private function seedSurveysAndResponses(
        array $profileIds,
        array $departmentIds,
        array $programIds,
        int $creatorId,
        $now,
    ): void {
        $surveyDefinitions = [
            [
                'title' => 'CHED Graduate Tracer Study (GTS) — Institutional Baseline Survey',
                'description' => 'Official Commission on Higher Education (CHED) graduate tracer instrument measuring time-to-first-job, curriculum alignment, and core competencies across all SEAIT batches.',
                'status' => 'published',
                'is_anonymous' => false,
                'target_department_ids' => null,
                'target_graduation_years' => null,
            ],
            [
                'title' => 'SEAIT Industry Relevance & Curriculum Feedback Survey (Batch 2022–2026)',
                'description' => 'Assess how effectively SEAIT laboratory coursework, OJT immersion, and capstone projects prepared you for current industry tools and workflows.',
                'status' => 'published',
                'is_anonymous' => false,
                'target_department_ids' => null,
                'target_graduation_years' => [2022, 2023, 2024, 2025, 2026],
            ],
            [
                'title' => 'CICT Computing & IT Skills Alignment Tracer',
                'description' => 'Targeted competency assessment for BSIT, BSCS, and ACT graduates working in software engineering, networking, BPO, and digital transformation.',
                'status' => 'published',
                'is_anonymous' => false,
                'target_department_ids' => ! empty($departmentIds) ? [$departmentIds[0]] : null,
                'target_graduation_years' => null,
            ],
            [
                'title' => 'Annual Alumni Career Progression & Licensure Examination Tracker',
                'description' => 'Tracks PRC board examination performance, promotions, post-graduate studies, and public service placements of SEAIT alumni.',
                'status' => 'published',
                'is_anonymous' => true,
                'target_department_ids' => null,
                'target_graduation_years' => null,
            ],
            [
                'title' => '2027 Grand Alumni Homecoming & Industry Summit Planning Survey',
                'description' => 'Share your preferred schedule, keynote topics, and batch networking activities for the upcoming SEAIT Grand Homecoming in Tupi.',
                'status' => 'draft',
                'is_anonymous' => true,
                'target_department_ids' => null,
                'target_graduation_years' => null,
            ],
        ];

        $responseOptions1 = ['Less than 3 months', '3 to 6 months', '7 to 12 months', 'More than 1 year'];
        $responseOptions2 = ['Very High Alignment', 'High Alignment', 'Moderate Alignment', 'Low Alignment'];
        $responseOptions3 = ['Problem Solving & Critical Thinking', 'Technical & Major-Specific Skills', 'Communication & Teamwork', 'OJT / Industry Immersion'];

        foreach ($surveyDefinitions as $sIdx => $def) {
            $survey = Survey::query()->firstOrCreate(
                ['title' => $def['title']],
                [
                    'description' => $def['description'],
                    'status' => $def['status'],
                    'published_at' => $def['status'] === 'published' ? $now->copy()->subDays(30 - ($sIdx * 4)) : null,
                    'starts_at' => $now->copy()->subDays(30),
                    'closes_at' => $now->copy()->addDays(60 + ($sIdx * 15)),
                    'is_anonymous' => $def['is_anonymous'],
                    'target_department_ids' => $def['target_department_ids'],
                    'target_program_ids' => null,
                    'target_graduation_years' => $def['target_graduation_years'],
                    'created_by_user_id' => $creatorId,
                ]
            );

            if ($survey->questions()->count() === 0) {
                $q1 = SurveyQuestion::query()->create([
                    'survey_id' => $survey->id,
                    'prompt' => 'How long did it take you to land your first job after graduating from SEAIT?',
                    'type' => 'radio',
                    'options' => $responseOptions1,
                    'is_required' => true,
                    'position' => 1,
                ]);
                $q2 = SurveyQuestion::query()->create([
                    'survey_id' => $survey->id,
                    'prompt' => 'How closely aligned is your current occupation with your SEAIT degree program?',
                    'type' => 'radio',
                    'options' => $responseOptions2,
                    'is_required' => true,
                    'position' => 2,
                ]);
                $q3 = SurveyQuestion::query()->create([
                    'survey_id' => $survey->id,
                    'prompt' => 'Which competency learned at SEAIT has been most valuable in your career?',
                    'type' => 'select',
                    'options' => $responseOptions3,
                    'is_required' => true,
                    'position' => 3,
                ]);
                $q4 = SurveyQuestion::query()->create([
                    'survey_id' => $survey->id,
                    'prompt' => 'Rate your overall satisfaction with your academic preparation at SEAIT (1 to 5).',
                    'type' => 'rating',
                    'options' => null,
                    'is_required' => true,
                    'position' => 4,
                ]);

                // Seed responses for published surveys
                if ($def['status'] === 'published' && ! empty($profileIds)) {
                    $respondentSlice = array_slice($profileIds, 0, min(count($profileIds), 350 - ($sIdx * 50)));
                    $responseRows = [];
                    foreach ($respondentSlice as $rIdx => $pid) {
                        $responseRows[] = [
                            'survey_id' => $survey->id,
                            'alumni_profile_id' => $pid,
                            'answers' => json_encode([
                                (string) $q1->id => $responseOptions1[$rIdx % count($responseOptions1)],
                                (string) $q2->id => $responseOptions2[$rIdx % count($responseOptions2)],
                                (string) $q3->id => $responseOptions3[$rIdx % count($responseOptions3)],
                                (string) $q4->id => (string) (4 + ($rIdx % 2)),
                            ]),
                            'submitted_at' => $now->copy()->subDays($rIdx % 28),
                            'created_at' => $now->copy()->subDays($rIdx % 28),
                            'updated_at' => $now,
                        ];
                    }

                    foreach (array_chunk($responseRows, 200) as $chunk) {
                        DB::table('survey_responses')->insertOrIgnore($chunk);
                    }
                }
            }
        }
    }

    /**
     * @param  list<int>  $departmentIds
     * @param  list<int>  $programIds
     */
    private function seedAnnouncements(array $departmentIds, array $programIds, int $creatorId, $now): void
    {
        if (DB::table('announcements')->count() >= 20) {
            return;
        }

        $bulletins = [
            [
                'title' => 'CHED Graduate Tracer Study (GTS) Mandatory Cohort Verification Now Open',
                'category' => 'urgent',
                'is_pinned' => true,
                'body' => 'All SEAIT graduates from Batch 2018 to Batch 2026 are requested to claim their official Registrar record and update their employment status in support of institutional accreditation and CHED reporting.',
                'action_label' => 'Complete Tracer Study',
                'action_url' => '/register',
            ],
            [
                'title' => 'SEAIT Annual Career Fair & South Cotabato Industry Placement Expo',
                'category' => 'career',
                'is_pinned' => true,
                'body' => 'Over 45 verified partner employers across SOCCSKSARGEN and Davao Region are recruiting SEAIT alumni in IT, Engineering, Accounting, Agribusiness, Education, and Hospitality.',
                'action_label' => 'Browse Verified Job Board',
                'action_url' => '/#opportunities',
            ],
            [
                'title' => 'Digital Alumni ID & Registrar TOR/Diploma Verification Assistance',
                'category' => 'academic',
                'is_pinned' => false,
                'body' => 'Graduates whose student numbers or birthdates require manual reconciliation with the Registrar archive may now submit a Claim Assistance request online for priority verification.',
                'action_label' => 'Request Claim Assistance',
                'action_url' => '/alumni/registration-assistance',
            ],
            [
                'title' => 'Congratulations to New SEAIT Licensure Examination Passers!',
                'category' => 'achievement',
                'is_pinned' => false,
                'body' => 'The SEAIT administration and Alumni Affairs Office commend our recent Licensure Examination for Teachers (LET), Criminology, Civil Engineering, and Agriculturist board passers. Please log your license milestones in your Employment Tracer.',
                'action_label' => null,
                'action_url' => null,
            ],
            [
                'title' => 'CICT Industry Capstone & Cloud Certification Scholarship Call',
                'category' => 'academic',
                'is_pinned' => false,
                'body' => 'BSIT, BSCS, and ACT alumni are invited to apply for sponsored cloud architecture and cybersecurity certification vouchers through our industry partner network.',
                'action_label' => null,
                'action_url' => null,
            ],
            [
                'title' => 'RA 10173 Data Privacy Compliance Notice for Alumni Records',
                'category' => 'general',
                'is_pinned' => false,
                'body' => 'All alumni data collected in ATMS is processed strictly for CHED Graduate Tracer Study analytics and verified career placement in compliance with the Data Privacy Act of 2012.',
                'action_label' => null,
                'action_url' => null,
            ],
        ];

        $rows = [];
        for ($i = 0; $i < 24; $i++) {
            $template = $bulletins[$i % count($bulletins)];
            $title = $i < count($bulletins)
                ? $template['title']
                : "{$template['title']} — Advisory #".($i + 1);

            $rows[] = [
                'title' => $title,
                'body' => $template['body'],
                'category' => $template['category'],
                'is_pinned' => $i < 2 ? $template['is_pinned'] : false,
                'is_public' => $i % 5 !== 4,
                'action_label' => $template['action_label'],
                'action_url' => $template['action_url'],
                'audience_roles' => null,
                'target_department_ids' => null,
                'target_program_ids' => null,
                'target_graduation_years' => null,
                'status' => $i % 8 === 7 ? 'draft' : 'published',
                'published_at' => $i % 8 === 7 ? null : $now->copy()->subDays($i * 2),
                'expires_at' => $now->copy()->addDays(90),
                'created_by_user_id' => $creatorId,
                'created_at' => $now->copy()->subDays($i * 2),
                'updated_at' => $now,
            ];
        }

        DB::table('announcements')->insert($rows);
    }

    /**
     * @param  list<array{user_id: int, profile_id: int, name: string, email: string}>  $claimedPairs
     * @param  list<int>  $departmentIds
     * @param  list<int>  $programIds
     */
    private function seedEventsAndRegistrations(
        array $claimedPairs,
        array $departmentIds,
        array $programIds,
        int $creatorId,
        $now,
    ): void {
        if (DB::table('alumni_events')->count() >= 15) {
            return;
        }

        $eventTemplates = [
            [
                'title' => 'SEAIT Grand Alumni Homecoming & Recognition Night',
                'event_type' => 'homecoming',
                'format' => 'in_person',
                'venue' => 'SEAIT Gymnasium, Crossing Rubber, Tupi, South Cotabato',
                'is_featured' => true,
                'description' => 'Annual gathering of all SEAIT graduating batches featuring outstanding alumni awards, batch reunions, and institutional milestone presentations.',
            ],
            [
                'title' => 'SOCCSKSARGEN Career & Industry Placement Fair at SEAIT',
                'event_type' => 'career_fair',
                'format' => 'hybrid',
                'venue' => 'SEAIT Main AVR & Online Career Portal',
                'is_featured' => true,
                'description' => 'On-the-spot interviews, resume clinics, and direct hiring with verified corporate and government partners across Region XII.',
            ],
            [
                'title' => 'CICT Tech Talk: Full-Stack Cloud & AI Engineering in 2026',
                'event_type' => 'webinar',
                'format' => 'online',
                'venue' => 'Zoom & Facebook Live (@SEAITOfficial)',
                'is_featured' => false,
                'description' => 'Interactive technical webinar led by senior SEAIT BSIT and BSCS alumni working in international software engineering teams.',
            ],
            [
                'title' => 'CBGG Young Entrepreneurs & CPA/AIS Career Forum',
                'event_type' => 'networking',
                'format' => 'in_person',
                'venue' => 'SEAIT Business Innovation Center, Tupi',
                'is_featured' => false,
                'description' => 'Networking session connecting Business Administration, Accounting Information System, and Hospitality alumni with regional industry leaders.',
            ],
            [
                'title' => 'COED LET Topnotchers & DepEd Teacher Induction Workshop',
                'event_type' => 'workshop',
                'format' => 'hybrid',
                'venue' => 'SEAIT College of Education Hall',
                'is_featured' => false,
                'description' => 'Mentoring workshop on PRC board exam preparation, DepEd ranking guidelines, and classroom leadership.',
            ],
        ];

        $eventIds = [];
        for ($i = 0; $i < 18; $i++) {
            $tpl = $eventTemplates[$i % count($eventTemplates)];
            $startsAt = $now->copy()->addDays(($i + 3) * 5)->setTime(9 + ($i % 6), 0);
            $title = $i < count($eventTemplates)
                ? $tpl['title']
                : "{$tpl['title']} (Session ".($i + 1).')';

            $id = DB::table('alumni_events')->insertGetId([
                'title' => $title,
                'description' => $tpl['description'],
                'event_type' => $tpl['event_type'],
                'format' => $tpl['format'],
                'venue' => $tpl['venue'],
                'meeting_url' => $tpl['format'] !== 'in_person' ? 'https://meet.seait.example.edu.ph/alumni-session-'.($i + 1) : null,
                'starts_at' => $startsAt,
                'ends_at' => $startsAt->copy()->addHours(4),
                'registration_deadline' => $startsAt->copy()->subDays(1),
                'capacity' => 250 + (($i % 5) * 100),
                'is_featured' => $i < 2 ? $tpl['is_featured'] : false,
                'is_public' => true,
                'audience_roles' => null,
                'target_department_ids' => null,
                'target_program_ids' => null,
                'target_graduation_years' => null,
                'status' => 'published',
                'published_at' => $now->copy()->subDays(10),
                'created_by_user_id' => $creatorId,
                'created_at' => $now->copy()->subDays(10),
                'updated_at' => $now,
            ]);

            $eventIds[] = (int) $id;
        }

        if (! empty($claimedPairs) && ! empty($eventIds)) {
            $rsvpRows = [];
            foreach ($eventIds as $eIdx => $eventId) {
                $attendeeSlice = array_slice($claimedPairs, 0, min(count($claimedPairs), 65));
                foreach ($attendeeSlice as $uIdx => $pair) {
                    if (($eIdx + $uIdx) % 2 !== 0) {
                        continue;
                    }
                    $rsvpRows[] = [
                        'alumni_event_id' => $eventId,
                        'user_id' => $pair['user_id'],
                        'status' => ($uIdx % 4 === 0) ? 'interested' : 'going',
                        'notes' => 'Looking forward to reconnecting with batchmates!',
                        'registered_at' => $now->copy()->subDays($uIdx % 10),
                        'created_at' => $now->copy()->subDays($uIdx % 10),
                        'updated_at' => $now,
                    ];
                }
            }

            foreach (array_chunk($rsvpRows, 200) as $chunk) {
                DB::table('alumni_event_registrations')->insertOrIgnore($chunk);
            }
        }
    }

    /**
     * @param  list<int>  $programIds
     * @param  list<int>  $profileIds
     */
    private function seedRegistrationAssistanceQueue(
        array $programIds,
        array $profileIds,
        ?int $reviewerId,
        $now,
    ): void {
        if (DB::table('alumni_registration_assistance_requests')->count() >= 50) {
            return;
        }

        $rows = [];
        for ($i = 1; $i <= 75; $i++) {
            $status = $i % 3 === 0 ? 'resolved' : ($i % 7 === 0 ? 'rejected' : 'pending');
            $gradYear = 2016 + ($i % 10);
            $progId = ! empty($programIds) ? $programIds[$i % count($programIds)] : null;
            $resolvedProfileId = ($status === 'resolved' && ! empty($profileIds))
                ? $profileIds[$i % count($profileIds)]
                : null;

            $rows[] = [
                'name' => "Graduate Applicant #{$i}",
                'email' => "claim.assist{$i}@seait-alumni.example.com",
                'date_of_birth' => sprintf('%04d-%02d-%02d', 1995 + ($i % 9), ($i % 12) + 1, ($i % 27) + 1),
                'student_number' => sprintf('%04d-%05d', $gradYear - 4, 80000 + $i),
                'academic_program_id' => $progId,
                'graduation_year' => $gradYear,
                'message' => $i % 2 === 0
                    ? 'My middle name spelling in the Registrar masterlist was updated prior to graduation.'
                    : 'Requesting verification of my student number from the old Registrar records.',
                'status' => $status,
                'reviewed_by_user_id' => $status !== 'pending' ? $reviewerId : null,
                'reviewed_at' => $status !== 'pending' ? $now->copy()->subDays($i % 20) : null,
                'review_note' => $status === 'resolved'
                    ? 'Verified against official Registrar graduation masterlist.'
                    : ($status === 'rejected' ? 'Unable to match student number; requested valid TOR copy.' : null),
                'resolution_action' => $status === 'resolved' ? 'provision_and_link' : null,
                'resolved_alumni_profile_id' => $resolvedProfileId,
                'created_at' => $now->copy()->subDays($i % 45),
                'updated_at' => $now,
            ];
        }

        DB::table('alumni_registration_assistance_requests')->insert($rows);
    }

    /**
     * @param  list<int>  $profileIds
     */
    private function seedActivityLogs(?int $actorId, array $profileIds, $now): void
    {
        if (DB::table('activity_logs')->count() >= 200) {
            return;
        }

        $actions = [
            'alumni.imported',
            'alumni.profile.updated',
            'alumni.employment.recorded',
            'survey.published',
            'announcement.published',
            'event.published',
            'employer.verified',
            'registration_assistance.resolved',
            'report.exported',
        ];

        $rows = [];
        for ($i = 1; $i <= 250; $i++) {
            $action = $actions[$i % count($actions)];
            $subjectId = ! empty($profileIds) ? $profileIds[$i % count($profileIds)] : $i;

            $rows[] = [
                'actor_user_id' => $actorId,
                'action' => $action,
                'subject_type' => 'App\\Models\\AlumniProfile',
                'subject_id' => $subjectId,
                'metadata' => json_encode([
                    'batch_stress_test' => true,
                    'sequence' => $i,
                    'campus' => 'SEAIT Tupi Main Campus',
                ]),
                'ip_address' => sprintf('192.168.1.%d', ($i % 250) + 1),
                'created_at' => $now->copy()->subHours($i * 2),
            ];
        }

        foreach (array_chunk($rows, 150) as $chunk) {
            DB::table('activity_logs')->insert($chunk);
        }
    }
}

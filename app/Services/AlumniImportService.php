<?php

namespace App\Services;

use App\Models\AcademicProgram;
use App\Models\AlumniEducationRecord;
use App\Models\AlumniProfile;
use App\Models\ProgramDegree;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AlumniImportService
{
    /**
     * Import a batch of alumni records from parsed rows.
     *
     * Expected keys per row:
     * - student_number (required)
     * - last_name (required)
     * - first_name (required)
     * - middle_name (optional)
     * - date_of_birth (required, Y-m-d)
     * - email (optional)
     * - graduation_year (optional, integer)
     * - program_code or program_id (optional)
     * - honors (optional)
     * - gwa (optional)
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @param  User|null  $importer
     * @return array{
     *     total: int,
     *     successful: int,
     *     failed: int,
     *     profiles_created: int,
     *     education_records_created: int,
     *     errors: array<int, string>
     * }
     */
    public function import(array $rows, ?User $importer = null): array
    {
        $stats = [
            'total' => count($rows),
            'successful' => 0,
            'failed' => 0,
            'profiles_created' => 0,
            'education_records_created' => 0,
            'errors' => [],
        ];

        foreach ($rows as $index => $row) {
            $rowNum = $index + 1;

            $studentNumber = isset($row['student_number']) ? Str::upper(trim((string) $row['student_number'])) : '';
            $lastName = isset($row['last_name']) ? trim((string) $row['last_name']) : '';
            $firstName = isset($row['first_name']) ? trim((string) $row['first_name']) : '';
            $middleName = isset($row['middle_name']) ? trim((string) $row['middle_name']) : null;
            $dobString = isset($row['date_of_birth']) ? trim((string) $row['date_of_birth']) : '';

            if ($studentNumber === '' || $lastName === '' || $firstName === '' || $dobString === '') {
                $stats['failed']++;
                $stats['errors'][] = "Row {$rowNum}: Missing mandatory fields (student_number, first_name, last_name, or date_of_birth).";
                continue;
            }

            try {
                $dob = Carbon::parse($dobString)->toDateString();
            } catch (\Throwable $e) {
                $stats['failed']++;
                $stats['errors'][] = "Row {$rowNum}: Invalid date_of_birth format.";
                continue;
            }

            try {
                DB::transaction(function () use ($row, $studentNumber, $firstName, $middleName, $lastName, $dob, $importer, &$stats) {
                    // Check if student number already exists in education records
                    $existingEducation = AlumniEducationRecord::query()
                        ->where('student_number', $studentNumber)
                        ->first();

                    if ($existingEducation !== null) {
                        throw new \RuntimeException("Student number '{$studentNumber}' already exists in records.");
                    }

                    $fullName = trim("{$firstName} " . ($middleName ? "{$middleName} " : '') . $lastName);

                    // Find or create matching central alumni profile
                    $profile = AlumniProfile::query()
                        ->where(function ($query) use ($lastName, $firstName, $fullName) {
                            $query->where(function ($sub) use ($lastName, $firstName) {
                                $sub->whereRaw('LOWER(last_name) = ?', [Str::lower($lastName)])
                                    ->whereRaw('LOWER(first_name) = ?', [Str::lower($firstName)]);
                            })->orWhereRaw('LOWER(name) = ?', [Str::lower($fullName)]);
                        })
                        ->whereDate('date_of_birth', $dob)
                        ->first();

                    if ($profile === null) {
                        $profile = AlumniProfile::create([
                            'name' => $fullName,
                            'first_name' => $firstName,
                            'middle_name' => $middleName,
                            'last_name' => $lastName,
                            'date_of_birth' => $dob,
                            'email' => isset($row['email']) ? Str::lower(trim((string) $row['email'])) : Str::lower("{$studentNumber}@alumni.local"),
                            'profile_status' => 'active',
                            'created_by_user_id' => $importer?->id,
                        ]);
                        $stats['profiles_created']++;
                    }

                    // Resolve program degree if provided
                    $programDegreeId = null;
                    if (! empty($row['program_degree_id'])) {
                        $programDegreeId = (int) $row['program_degree_id'];
                    } elseif (! empty($row['program_code'])) {
                        $programCode = Str::upper(trim((string) $row['program_code']));
                        $program = AcademicProgram::query()->where('code', $programCode)->first();

                        if ($program === null) {
                            $department = \App\Models\Department::firstOrCreate(
                                ['code' => 'ACAD'],
                                ['name' => 'Academic Department']
                            );
                            $program = AcademicProgram::create([
                                'department_id' => $department->id,
                                'code' => $programCode,
                                'name' => $programCode,
                            ]);
                            $degree = \App\Models\Degree::firstOrCreate(
                                ['code' => $programCode],
                                ['title' => "Bachelor in {$programCode}", 'degree_level' => 'bachelor']
                            );
                            $offering = ProgramDegree::create([
                                'program_id' => $program->id,
                                'degree_id' => $degree->id,
                            ]);
                            $programDegreeId = $offering->id;
                        } else {
                            $offering = ProgramDegree::query()->where('program_id', $program->id)->first();
                            if ($offering === null) {
                                $degree = \App\Models\Degree::firstOrCreate(
                                    ['code' => $program->code],
                                    ['title' => "Bachelor in {$program->name}", 'degree_level' => 'bachelor']
                                );
                                $offering = ProgramDegree::create([
                                    'program_id' => $program->id,
                                    'degree_id' => $degree->id,
                                ]);
                            }
                            $programDegreeId = $offering->id;
                        }
                    }

                    $gradYear = ! empty($row['graduation_year']) ? (int) $row['graduation_year'] : null;
                    $honors = ! empty($row['honors']) ? trim((string) $row['honors']) : null;
                    $gwa = isset($row['gwa']) && is_numeric($row['gwa']) ? (float) $row['gwa'] : null;

                    AlumniEducationRecord::create([
                        'alumni_profile_id' => $profile->id,
                        'student_number' => $studentNumber,
                        'program_degree_id' => $programDegreeId,
                        'graduation_year' => $gradYear,
                        'honors' => $honors,
                        'gwa' => $gwa,
                    ]);

                    $stats['education_records_created']++;
                    $stats['successful']++;
                });
            } catch (\Throwable $e) {
                $stats['failed']++;
                $stats['errors'][] = "Row {$rowNum} ({$studentNumber}): " . $e->getMessage();
            }
        }

        return $stats;
    }

    /**
     * Parse and import records from an uploaded CSV file.
     *
     * @param  \Illuminate\Http\UploadedFile  $file
     * @param  User|null  $importer
     * @return array{
     *     total: int,
     *     successful: int,
     *     failed: int,
     *     profiles_created: int,
     *     education_records_created: int,
     *     errors: array<int, string>
     * }
     */
    public function importFile(\Illuminate\Http\UploadedFile $file, ?User $importer = null): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            throw new \RuntimeException('Unable to read uploaded file.');
        }

        $headerLine = fgets($handle);
        if ($headerLine === false) {
            fclose($handle);
            throw new \RuntimeException('Uploaded file is empty.');
        }

        // Remove UTF-8 BOM if present
        if (str_starts_with($headerLine, "\xEF\xBB\xBF")) {
            $headerLine = substr($headerLine, 3);
        }

        // Detect delimiter (comma vs semicolon vs tab)
        $delimiter = ',';
        if (substr_count($headerLine, ';') > substr_count($headerLine, ',')) {
            $delimiter = ';';
        } elseif (substr_count($headerLine, "\t") > substr_count($headerLine, ',')) {
            $delimiter = "\t";
        }

        $rawHeaders = str_getcsv(trim($headerLine), $delimiter);
        $headers = array_map(function ($h) {
            return Str::snake(trim(strtolower((string) $h)));
        }, $rawHeaders);

        $rows = [];
        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            // Skip empty rows
            if (empty(array_filter($data, fn ($val) => trim((string) $val) !== ''))) {
                continue;
            }

            if (count($data) === count($headers)) {
                $rows[] = array_combine($headers, $data);
            } else {
                $padded = array_pad($data, count($headers), null);
                $rows[] = array_combine($headers, array_slice($padded, 0, count($headers)));
            }
        }

        fclose($handle);

        return $this->import($rows, $importer);
    }

    /**
     * Generate sample CSV template content.
     */
    public function generateCsvTemplate(): string
    {
        $headers = [
            'student_number',
            'first_name',
            'middle_name',
            'last_name',
            'date_of_birth',
            'email',
            'program_code',
            'graduation_year',
            'honors',
            'gwa',
        ];

        $sampleRows = [
            [
                '2020-00123',
                'Juan',
                'Santos',
                'Dela Cruz',
                '1998-05-14',
                'juan.delacruz@example.com',
                'BSIT',
                '2024',
                'Cum Laude',
                '1.45',
            ],
            [
                '2020-00124',
                'Maria',
                'Clara',
                'Reyes',
                '1999-10-22',
                'maria.reyes@example.com',
                'BSCS',
                '2024',
                'Magna Cum Laude',
                '1.25',
            ],
        ];

        $output = fopen('php://temp', 'r+');
        fputcsv($output, $headers);
        foreach ($sampleRows as $row) {
            fputcsv($output, $row);
        }
        rewind($output);
        $csv = stream_get_contents($output) ?: '';
        fclose($output);

        return $csv;
    }
}


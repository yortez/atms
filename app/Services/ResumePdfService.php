<?php

namespace App\Services;

use App\Models\JobApplication;

class ResumePdfService
{
    /**
     * Generate an institutional, standard PDF 1.4 document for a candidate application.
     */
    public static function generate(JobApplication $application): string
    {
        $snapshot = $application->profile_snapshot ?? [];
        $name = $snapshot['name'] ?? $application->alumniProfile?->name ?? 'SEAIT Candidate';
        $email = $snapshot['email'] ?? $application->alumniProfile?->email ?? '';
        $education = $snapshot['education'] ?? [];
        $employment = $snapshot['employment'] ?? [];
        $coverLetter = $application->cover_letter;
        $jobTitle = $application->jobPosting?->title ?? 'Position Application';

        $s = "";

        // Header Background Banner: SEAIT dark emerald [0.04 0.22 0.18]
        $s .= "0.04 0.22 0.18 rg 0 720 612 72 re f\n";

        // Top Header Text (White)
        $s .= "1 1 1 rg\n";
        $s .= "BT /F2 13 Tf 40 762 Td (SOUTH EAST ASIAN INSTITUTE OF TECHNOLOGY, INC.) Tj ET\n";
        $s .= "BT /F1 9 Tf 40 745 Td (ALUMNI TRACER MANAGEMENT SYSTEM · OFFICIAL VERIFIED CANDIDATE DOSSIER) Tj ET\n";
        $s .= "BT /F1 8 Tf 40 732 Td (Transmitted under Republic Act No. 10173 - Data Privacy Act of 2012) Tj ET\n";

        // Candidate Name (Dark Charcoal)
        $s .= "0.1 0.1 0.1 rg\n";
        $s .= "BT /F2 20 Tf 40 682 Td (" . self::escape($name) . ") Tj ET\n";
        $s .= "0.4 0.4 0.4 rg\n";
        $s .= "BT /F1 10 Tf 40 664 Td (Verified Alumnus · " . self::escape($email) . " · Target: " . self::escape($jobTitle) . ") Tj ET\n";

        // Divider
        $s .= "0.85 0.85 0.85 RG 1 w 40 650 m 572 650 l S\n";

        $y = 628;

        // Section 1: Academic Background
        $s .= "0.04 0.22 0.18 rg\n";
        $s .= "BT /F2 11 Tf 40 {$y} Td (I. VERIFIED ACADEMIC QUALIFICATIONS & DEGREE) Tj ET\n";
        $y -= 18;

        if (!empty($education)) {
            foreach ($education as $edu) {
                $degree = ($edu['degree'] ?? '') . ' in ' . ($edu['program'] ?? 'Degree Program');
                $batch = 'Class Batch: ' . ($edu['graduation_year'] ?? 'N/A');
                $honors = !empty($edu['honors']) ? ' · Honors: ' . $edu['honors'] : '';
                $gwa = !empty($edu['gwa']) ? ' · GWA: ' . number_format((float) $edu['gwa'], 2) : '';

                $s .= "0.15 0.15 0.15 rg\n";
                $s .= "BT /F2 10 Tf 50 {$y} Td (" . self::escape($degree) . ") Tj ET\n";
                $y -= 14;
                $s .= "0.4 0.4 0.4 rg\n";
                $s .= "BT /F1 9 Tf 50 {$y} Td (" . self::escape($batch . $honors . $gwa) . ") Tj ET\n";
                $y -= 18;
            }
        } else {
            $s .= "0.4 0.4 0.4 rg\n";
            $s .= "BT /F1 9 Tf 50 {$y} Td (Official SEAIT undergraduate records verified via institutional registrar.) Tj ET\n";
            $y -= 18;
        }

        $y -= 6;
        // Section 2: Professional Experience & Employment Tracer
        $s .= "0.04 0.22 0.18 rg\n";
        $s .= "BT /F2 11 Tf 40 {$y} Td (II. PROFESSIONAL EXPERIENCE & EMPLOYMENT TRACER) Tj ET\n";
        $y -= 18;

        if (!empty($employment)) {
            foreach (array_slice($employment, 0, 4) as $emp) {
                $role = ($emp['job_title'] ?? 'Role') . ' at ' . ($emp['employer_name'] ?? 'Organization');
                $meta = ($emp['status'] ?? 'Employed') . ($emp['industry'] ? ' · ' . $emp['industry'] : '');
                if (!empty($emp['started_on'])) {
                    $meta .= ' (' . $emp['started_on'] . ' to ' . ($emp['ended_on'] ?? 'Present') . ')';
                }

                $s .= "0.15 0.15 0.15 rg\n";
                $s .= "BT /F2 10 Tf 50 {$y} Td (" . self::escape($role) . ") Tj ET\n";
                $y -= 14;
                $s .= "0.4 0.4 0.4 rg\n";
                $s .= "BT /F1 9 Tf 50 {$y} Td (" . self::escape($meta) . ") Tj ET\n";
                $y -= 18;
            }
        } else {
            $s .= "0.4 0.4 0.4 rg\n";
            $s .= "BT /F1 9 Tf 50 {$y} Td (Fresh Graduate / Seeking entry-level opportunity.) Tj ET\n";
            $y -= 18;
        }

        // Section 3: Applicant Cover Letter & Career Statement
        if ($coverLetter) {
            $y -= 6;
            $s .= "0.04 0.22 0.18 rg\n";
            $s .= "BT /F2 11 Tf 40 {$y} Td (III. APPLICANT COVER LETTER & CAREER STATEMENT) Tj ET\n";
            $y -= 18;

            $lines = explode("\n", wordwrap($coverLetter, 92, "\n"));
            $s .= "0.2 0.2 0.2 rg\n";
            foreach (array_slice($lines, 0, 12) as $line) {
                if ($y < 70) {
                    break;
                }
                $s .= "BT /F1 9 Tf 50 {$y} Td (" . self::escape($line) . ") Tj ET\n";
                $y -= 13;
            }
        }

        // Footer Banner
        $s .= "0.96 0.96 0.96 rg 0 0 612 42 re f\n";
        $s .= "0.5 0.5 0.5 rg\n";
        $s .= "BT /F1 8 Tf 40 24 Td (Official South East Asian Institute of Technology, Inc. Institutional Record) Tj ET\n";
        $s .= "BT /F1 8 Tf 40 12 Td (Transmitted securely via SEAIT ATMS Platform · Certified Immutable Snapshot) Tj ET\n";

        $len = strlen($s);

        $objects = [];
        $objects[] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
        $objects[] = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
        $objects[] = "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /MediaBox [0 0 612 792] /Contents 6 0 R >>\nendobj\n";
        $objects[] = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
        $objects[] = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
        $objects[] = "6 0 obj\n<< /Length {$len} >>\nstream\n{$s}\nendstream\nendobj\n";

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        $offset = strlen($pdf);

        foreach ($objects as $obj) {
            $offsets[] = $offset;
            $pdf .= $obj;
            $offset = strlen($pdf);
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 7\n0000000000 65535 f \n";
        foreach ($offsets as $off) {
            $pdf .= sprintf("%010d 00000 n \n", $off);
        }
        $pdf .= "trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF\n";

        return $pdf;
    }

    private static function escape(string $text): string
    {
        $clean = iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text);
        if ($clean === false) {
            $clean = preg_replace('/[^\x20-\x7E]/', '', $text);
        }

        return addcslashes($clean, "()\\");
    }
}


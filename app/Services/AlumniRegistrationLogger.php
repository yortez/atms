<?php

namespace App\Services;

use App\Models\AlumniProfile;
use App\Models\AlumniRegistrationLog;
use App\Models\User;
use Illuminate\Support\Str;

class AlumniRegistrationLogger
{
    public function record(
        string $event,
        string $studentNumber,
        ?User $user = null,
        ?AlumniProfile $profile = null,
    ): void {
        AlumniRegistrationLog::create([
            'event' => $event,
            'user_id' => $user?->id,
            'alumni_profile_id' => $profile?->id,
            'student_number_hash' => hash_hmac(
                'sha256',
                Str::upper(trim($studentNumber)),
                (string) config('app.key'),
            ),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}

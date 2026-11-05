<?php

namespace App\Services;

use App\Models\AlumniEmploymentRecord;
use App\Models\AlumniProfile;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AlumniEmploymentService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function report(AlumniProfile $profile, User $reporter, array $data): AlumniEmploymentRecord
    {
        return DB::transaction(function () use ($profile, $reporter, $data): AlumniEmploymentRecord {
            $profile = AlumniProfile::query()->lockForUpdate()->findOrFail($profile->id);
            $start = isset($data['started_on'])
                ? Carbon::parse($data['started_on'])->startOfDay()
                : Carbon::today();
            $end = isset($data['ended_on']) ? Carbon::parse($data['ended_on'])->startOfDay() : null;

            if ($end !== null && $end->lt($start)) {
                throw ValidationException::withMessages([
                    'ended_on' => 'The end date must be on or after the start date.',
                ]);
            }

            $openRecord = $profile->employmentRecords()
                ->whereNull('ended_on')
                ->lockForUpdate()
                ->first();

            if ($openRecord !== null) {
                if ($start->lte($openRecord->started_on?->startOfDay() ?? Carbon::today())) {
                    throw ValidationException::withMessages([
                        'started_on' => 'A new employment period must start after the current period.',
                    ]);
                }

                $openRecord->update(['ended_on' => $start->copy()->subDay()]);
            }

            $overlappingRecord = $profile->employmentRecords()
                ->whereDate('started_on', '<=', $end?->toDateString() ?? '9999-12-31')
                ->where(function ($query) use ($start): void {
                    $query->whereNull('ended_on')->orWhereDate('ended_on', '>=', $start->toDateString());
                })
                ->exists();

            if ($overlappingRecord) {
                throw ValidationException::withMessages([
                    'started_on' => 'The employment dates overlap an existing history period.',
                ]);
            }

            $record = $profile->employmentRecords()->create([
                ...$data,
                'started_on' => $start->toDateString(),
                'ended_on' => $end?->toDateString(),
                'reported_at' => now(),
                'reported_by_user_id' => $reporter->id,
            ]);

            return $record->load('status');
        });
    }
}

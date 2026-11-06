<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class ActivityLogger
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function record(string $action, ?Model $subject = null, array $metadata = []): ActivityLog
    {
        return ActivityLog::create([
            'actor_user_id' => auth()->id(),
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'metadata' => Arr::only($metadata, [
                'changed_fields',
                'status',
                'document_type',
                'count',
                'roles',
                'assigned_program_ids',
                'permissions',
                'mode',
            ]),
            'ip_address' => request()->ip(),
        ]);
    }
}

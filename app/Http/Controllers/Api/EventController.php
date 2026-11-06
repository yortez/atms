<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlumniEvent;
use App\Models\AlumniEventRegistration;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $userRoles = $user->roles()->pluck('name')->all();

        $query = AlumniEvent::query()
            ->with('author:id,name')
            ->withCount([
                'registrations as going_count' => fn ($q) => $q->where('status', 'going'),
                'registrations as interested_count' => fn ($q) => $q->where('status', 'interested'),
            ])
            ->where('status', 'published')
            ->where(function ($query) use ($userRoles): void {
                $query->whereNull('audience_roles');
                foreach ($userRoles as $role) {
                    $query->orWhereJsonContains('audience_roles', $role);
                }
            })
            ->orderByDesc('is_featured')
            ->orderBy('starts_at');

        $isStaff = $user->hasRole('system-administrator', 'alumni-coordinator', 'department-coordinator');
        $profileId = $user->alumni_profile_id ? (int) $user->alumni_profile_id : null;

        $events = $query->get()
            ->filter(function (AlumniEvent $event) use ($isStaff, $user, $profileId): bool {
                if (! $isStaff && $user->hasRole('alumni')) {
                    return ! $event->hasCohortTargeting() || $event->matchesAlumniProfile($profileId);
                }

                return true;
            })
            ->values();

        $myRegistrations = AlumniEventRegistration::query()
            ->where('user_id', $user->id)
            ->whereIn('alumni_event_id', $events->pluck('id'))
            ->pluck('status', 'alumni_event_id');

        $events->each(function (AlumniEvent $event) use ($myRegistrations): void {
            $event->setAttribute('my_registration_status', $myRegistrations->get($event->id));
        });

        $paginator = new LengthAwarePaginator(
            $events,
            $events->count(),
            25,
            1,
            ['path' => $request->url()],
        );

        return response()->json(['data' => $paginator]);
    }

    public function manageIndex(Request $request): JsonResponse
    {
        $this->authorizeManagement($request);
        $user = $request->user();

        $paginator = AlumniEvent::query()
            ->with('author:id,name')
            ->withCount([
                'registrations as going_count' => fn ($q) => $q->where('status', 'going'),
                'registrations as interested_count' => fn ($q) => $q->where('status', 'interested'),
            ])
            ->orderByDesc('is_featured')
            ->orderByDesc('starts_at')
            ->paginate(25);

        $eventIds = collect($paginator->items())->pluck('id');
        $myRegistrations = AlumniEventRegistration::query()
            ->where('user_id', $user->id)
            ->whereIn('alumni_event_id', $eventIds)
            ->pluck('status', 'alumni_event_id');

        foreach ($paginator->items() as $event) {
            $event->setAttribute('my_registration_status', $myRegistrations->get($event->id));
        }

        return response()->json(['data' => $paginator]);
    }

    public function store(Request $request, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorizeManagement($request);
        $data = $this->validated($request, true);
        $publishNow = (bool) ($data['publish_now'] ?? false);
        $notifyAudience = (bool) ($data['notify_audience'] ?? false);
        unset($data['publish_now'], $data['notify_audience']);

        $event = AlumniEvent::create([
            ...$data,
            'event_type' => $data['event_type'] ?? 'homecoming',
            'format' => $data['format'] ?? 'in_person',
            'is_featured' => (bool) ($data['is_featured'] ?? false),
            'is_public' => array_key_exists('is_public', $data) ? (bool) $data['is_public'] : true,
            'target_department_ids' => ! empty($data['target_department_ids']) ? array_values(array_map('intval', $data['target_department_ids'])) : null,
            'target_program_ids' => ! empty($data['target_program_ids']) ? array_values(array_map('intval', $data['target_program_ids'])) : null,
            'target_graduation_years' => ! empty($data['target_graduation_years']) ? array_values(array_map('intval', $data['target_graduation_years'])) : null,
            'status' => $publishNow ? 'published' : 'draft',
            'published_at' => $publishNow ? now() : null,
            'created_by_user_id' => $request->user()->id,
        ]);

        $activityLogger->record('event.created', $event, [
            'title' => $event->title,
            'event_type' => $event->event_type,
            'status' => $event->status,
        ]);

        if ($publishNow) {
            $activityLogger->record('event.published', $event, [
                'title' => $event->title,
            ]);

            if ($notifyAudience || $event->is_featured) {
                $this->broadcastNotification($event);
            }
        }

        return response()->json(['data' => $this->loadEventWithCounts($event, $request->user()->id)], 201);
    }

    public function update(Request $request, AlumniEvent $event, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorizeManagement($request);
        $data = $this->validated($request, false);
        unset($data['publish_now'], $data['notify_audience']);

        if (array_key_exists('target_department_ids', $data)) {
            $data['target_department_ids'] = ! empty($data['target_department_ids'])
                ? array_values(array_map('intval', $data['target_department_ids']))
                : null;
        }
        if (array_key_exists('target_program_ids', $data)) {
            $data['target_program_ids'] = ! empty($data['target_program_ids'])
                ? array_values(array_map('intval', $data['target_program_ids']))
                : null;
        }
        if (array_key_exists('target_graduation_years', $data)) {
            $data['target_graduation_years'] = ! empty($data['target_graduation_years'])
                ? array_values(array_map('intval', $data['target_graduation_years']))
                : null;
        }

        $event->fill($data)->save();

        $activityLogger->record('event.updated', $event, [
            'title' => $event->title,
            'event_type' => $event->event_type,
        ]);

        return response()->json(['data' => $this->loadEventWithCounts($event, $request->user()->id)]);
    }

    public function publish(Request $request, AlumniEvent $event, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorizeManagement($request);
        $wasDraft = $event->status !== 'published';

        $event->forceFill([
            'status' => 'published',
            'published_at' => now(),
        ])->save();

        $activityLogger->record('event.published', $event, [
            'title' => $event->title,
        ]);

        if ($wasDraft) {
            $this->broadcastNotification($event);
        }

        return response()->json(['data' => $this->loadEventWithCounts($event, $request->user()->id)]);
    }

    public function updateStatus(Request $request, AlumniEvent $event, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorizeManagement($request);
        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(['draft', 'published', 'cancelled', 'completed'])],
        ]);

        $event->forceFill([
            'status' => $data['status'],
            'published_at' => $data['status'] === 'published' && ! $event->published_at ? now() : $event->published_at,
        ])->save();

        $activityLogger->record('event.status_updated', $event, [
            'title' => $event->title,
            'status' => $event->status,
        ]);

        return response()->json(['data' => $this->loadEventWithCounts($event, $request->user()->id)]);
    }

    public function destroy(Request $request, AlumniEvent $event, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorizeManagement($request);
        $activityLogger->record('event.deleted', $event, [
            'id' => $event->id,
            'title' => $event->title,
        ]);

        $event->delete();

        return response()->json(['message' => 'Event deleted.']);
    }

    public function rsvp(Request $request, AlumniEvent $event, ActivityLogger $activityLogger): JsonResponse
    {
        abort_unless($event->status === 'published', 422, 'RSVP is only open for published events.');

        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(['going', 'interested', 'cancelled'])],
            'notes' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();

        if ($data['status'] === 'going') {
            if ($event->registration_deadline && $event->registration_deadline->isPast()) {
                abort(422, 'The registration deadline for this event has passed.');
            }

            if ($event->capacity !== null) {
                $currentGoing = $event->registrations()
                    ->where('status', 'going')
                    ->where('user_id', '!=', $user->id)
                    ->count();

                abort_if($currentGoing >= $event->capacity, 422, 'This event has reached its maximum attendee capacity.');
            }
        }

        if ($data['status'] === 'cancelled') {
            AlumniEventRegistration::query()
                ->where('alumni_event_id', $event->id)
                ->where('user_id', $user->id)
                ->delete();
        } else {
            AlumniEventRegistration::query()->updateOrCreate(
                [
                    'alumni_event_id' => $event->id,
                    'user_id' => $user->id,
                ],
                [
                    'status' => $data['status'],
                    'notes' => $data['notes'] ?? null,
                    'registered_at' => now(),
                ],
            );
        }

        $activityLogger->record('event.rsvp_updated', $event, [
            'status' => $data['status'],
        ]);

        return response()->json(['data' => $this->loadEventWithCounts($event, $user->id)]);
    }

    public function attendees(Request $request, AlumniEvent $event): JsonResponse
    {
        $this->authorizeManagement($request);

        $attendees = $event->registrations()
            ->with('user:id,name,email')
            ->whereIn('status', ['going', 'interested'])
            ->orderByRaw("CASE WHEN status = 'going' THEN 0 ELSE 1 END")
            ->orderByDesc('registered_at')
            ->get()
            ->map(fn (AlumniEventRegistration $reg) => [
                'id' => $reg->id,
                'user_id' => $reg->user_id,
                'name' => $reg->user?->name ?? 'Alumni Member',
                'email' => $reg->user?->email ?? '',
                'status' => $reg->status,
                'notes' => $reg->notes,
                'registered_at' => $reg->registered_at?->toISOString(),
            ])
            ->values();

        return response()->json(['data' => $attendees]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $creating): array
    {
        return $request->validate([
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'max:180'],
            'description' => [$creating ? 'required' : 'sometimes', 'string', 'max:50000'],
            'event_type' => ['sometimes', 'string', Rule::in(AlumniEvent::EVENT_TYPES)],
            'format' => ['sometimes', 'string', Rule::in(AlumniEvent::FORMATS)],
            'venue' => ['sometimes', 'nullable', 'string', 'max:200'],
            'meeting_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'starts_at' => [$creating ? 'required' : 'sometimes', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:starts_at'],
            'registration_deadline' => ['sometimes', 'nullable', 'date'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100000'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_public' => ['sometimes', 'boolean'],
            'audience_roles' => ['sometimes', 'nullable', 'array'],
            'audience_roles.*' => ['string', Rule::exists('roles', 'name')],
            'target_department_ids' => ['sometimes', 'nullable', 'array'],
            'target_department_ids.*' => ['integer', 'exists:departments,id'],
            'target_program_ids' => ['sometimes', 'nullable', 'array'],
            'target_program_ids.*' => ['integer', 'exists:academic_programs,id'],
            'target_graduation_years' => ['sometimes', 'nullable', 'array'],
            'target_graduation_years.*' => ['integer', 'min:1950', 'max:2100'],
            'publish_now' => ['sometimes', 'boolean'],
            'notify_audience' => ['sometimes', 'boolean'],
        ]);
    }

    private function loadEventWithCounts(AlumniEvent $event, int $userId): AlumniEvent
    {
        $fresh = $event->fresh(['author:id,name'])->loadCount([
            'registrations as going_count' => fn ($q) => $q->where('status', 'going'),
            'registrations as interested_count' => fn ($q) => $q->where('status', 'interested'),
        ]);

        $myStatus = AlumniEventRegistration::query()
            ->where('alumni_event_id', $fresh->id)
            ->where('user_id', $userId)
            ->value('status');

        $fresh->setAttribute('my_registration_status', $myStatus);

        return $fresh;
    }

    private function broadcastNotification(AlumniEvent $event): void
    {
        $usersQuery = User::query()->whereNull('suspended_at');

        if (! empty($event->audience_roles)) {
            $usersQuery->whereHas('roles', fn ($q) => $q->whereIn('name', $event->audience_roles));
        }

        $recipients = $usersQuery->limit(250)->get(['id', 'alumni_profile_id']);

        foreach ($recipients as $recipient) {
            if ($event->hasCohortTargeting()) {
                $profileId = $recipient->alumni_profile_id ? (int) $recipient->alumni_profile_id : null;
                if (! $event->matchesAlumniProfile($profileId)) {
                    continue;
                }
            }

            $recipient->notifications()->create([
                'id' => (string) Str::uuid(),
                'type' => 'App\\Notifications\\EventPublished',
                'data' => [
                    'title' => '📅 New Event: '.$event->title,
                    'message' => sprintf(
                        '%s · %s',
                        $event->starts_at->format('M j, Y g:i A'),
                        $event->venue ?? ($event->format === 'online' ? 'Online Event' : 'Northfield Campus'),
                    ),
                    'event_id' => $event->id,
                    'event_type' => $event->event_type,
                ],
            ]);
        }
    }

    private function authorizeManagement(Request $request): void
    {
        Gate::forUser($request->user())->authorize('manageEvents');
    }
}


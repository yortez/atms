<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $userRoles = $user->roles()->pluck('name')->all();

        $query = Announcement::query()
            ->with('author:id,name')
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where(function ($q): void {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', now());
            })
            ->where(function ($query) use ($userRoles): void {
                $query->whereNull('audience_roles');
                foreach ($userRoles as $role) {
                    $query->orWhereJsonContains('audience_roles', $role);
                }
            })
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at');

        $isStaff = $user->hasRole('system-administrator', 'alumni-coordinator', 'department-coordinator');

        if (! $isStaff && $user->hasRole('alumni')) {
            $profileId = $user->alumni_profile_id ? (int) $user->alumni_profile_id : null;
            $filtered = $query->get()
                ->filter(fn (Announcement $item) => ! $item->hasCohortTargeting() || $item->matchesAlumniProfile($profileId))
                ->values();

            $paginator = new LengthAwarePaginator(
                $filtered,
                $filtered->count(),
                25,
                1,
                ['path' => $request->url()],
            );

            return response()->json(['data' => $paginator]);
        }

        return response()->json(['data' => $query->paginate(25)]);
    }

    public function manageIndex(Request $request): JsonResponse
    {
        $this->authorizeManagement($request);

        return response()->json([
            'data' => Announcement::query()
                ->with('author:id,name')
                ->orderByDesc('is_pinned')
                ->latest()
                ->paginate(25),
        ]);
    }

    public function store(Request $request, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorizeManagement($request);
        $data = $this->validated($request, true);
        $publishNow = (bool) ($data['publish_now'] ?? false);
        $notifyAudience = (bool) ($data['notify_audience'] ?? false);
        unset($data['publish_now'], $data['notify_audience']);

        $announcement = Announcement::create([
            ...$data,
            'category' => $data['category'] ?? 'general',
            'is_pinned' => (bool) ($data['is_pinned'] ?? false),
            'is_public' => array_key_exists('is_public', $data) ? (bool) $data['is_public'] : true,
            'target_department_ids' => ! empty($data['target_department_ids']) ? array_values(array_map('intval', $data['target_department_ids'])) : null,
            'target_program_ids' => ! empty($data['target_program_ids']) ? array_values(array_map('intval', $data['target_program_ids'])) : null,
            'target_graduation_years' => ! empty($data['target_graduation_years']) ? array_values(array_map('intval', $data['target_graduation_years'])) : null,
            'status' => $publishNow ? 'published' : 'draft',
            'published_at' => $publishNow ? now() : null,
            'created_by_user_id' => $request->user()->id,
        ]);

        $activityLogger->record('announcement.created', $announcement, [
            'title' => $announcement->title,
            'category' => $announcement->category,
            'status' => $announcement->status,
            'is_pinned' => $announcement->is_pinned,
        ]);

        if ($publishNow) {
            $activityLogger->record('announcement.published', $announcement, [
                'title' => $announcement->title,
            ]);

            if ($notifyAudience || $announcement->is_pinned || $announcement->category === 'urgent') {
                $this->broadcastNotification($announcement);
            }
        }

        return response()->json(['data' => $announcement->load('author:id,name')], 201);
    }

    public function update(Request $request, Announcement $announcement, ActivityLogger $activityLogger): JsonResponse
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

        $announcement->fill($data)->save();

        $activityLogger->record('announcement.updated', $announcement, [
            'title' => $announcement->title,
            'category' => $announcement->category,
            'is_pinned' => $announcement->is_pinned,
        ]);

        return response()->json(['data' => $announcement->fresh(['author:id,name'])]);
    }

    public function publish(Request $request, Announcement $announcement, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorizeManagement($request);
        $wasDraft = $announcement->status !== 'published';

        $announcement->forceFill([
            'status' => 'published',
            'published_at' => now(),
        ])->save();

        $activityLogger->record('announcement.published', $announcement, [
            'title' => $announcement->title,
        ]);

        if ($wasDraft) {
            $this->broadcastNotification($announcement);
        }

        return response()->json(['data' => $announcement->fresh(['author:id,name'])]);
    }

    public function unpublish(Request $request, Announcement $announcement, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorizeManagement($request);
        $data = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(['draft', 'archived'])],
        ]);
        $nextStatus = $data['status'] ?? 'draft';

        $announcement->forceFill([
            'status' => $nextStatus,
        ])->save();

        $activityLogger->record('announcement.unpublished', $announcement, [
            'title' => $announcement->title,
            'status' => $nextStatus,
        ]);

        return response()->json(['data' => $announcement->fresh(['author:id,name'])]);
    }

    public function destroy(Request $request, Announcement $announcement, ActivityLogger $activityLogger): JsonResponse
    {
        $this->authorizeManagement($request);
        $title = $announcement->title;
        $id = $announcement->id;

        $activityLogger->record('announcement.deleted', $announcement, [
            'id' => $id,
            'title' => $title,
        ]);

        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $creating): array
    {
        return $request->validate([
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'max:180'],
            'body' => [$creating ? 'required' : 'sometimes', 'string', 'max:50000'],
            'category' => ['sometimes', 'string', Rule::in(Announcement::CATEGORIES)],
            'is_pinned' => ['sometimes', 'boolean'],
            'is_public' => ['sometimes', 'boolean'],
            'action_label' => ['sometimes', 'nullable', 'string', 'max:80'],
            'action_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'audience_roles' => ['sometimes', 'nullable', 'array'],
            'audience_roles.*' => ['string', Rule::exists('roles', 'name')],
            'target_department_ids' => ['sometimes', 'nullable', 'array'],
            'target_department_ids.*' => ['integer', 'exists:departments,id'],
            'target_program_ids' => ['sometimes', 'nullable', 'array'],
            'target_program_ids.*' => ['integer', 'exists:academic_programs,id'],
            'target_graduation_years' => ['sometimes', 'nullable', 'array'],
            'target_graduation_years.*' => ['integer', 'min:1950', 'max:2100'],
            'expires_at' => ['sometimes', 'nullable', 'date'],
            'publish_now' => ['sometimes', 'boolean'],
            'notify_audience' => ['sometimes', 'boolean'],
        ]);
    }

    private function broadcastNotification(Announcement $announcement): void
    {
        $usersQuery = User::query()->whereNull('suspended_at');

        if (! empty($announcement->audience_roles)) {
            $usersQuery->whereHas('roles', fn ($q) => $q->whereIn('name', $announcement->audience_roles));
        }

        $recipients = $usersQuery->limit(250)->get(['id', 'alumni_profile_id']);

        foreach ($recipients as $recipient) {
            if ($announcement->hasCohortTargeting()) {
                $profileId = $recipient->alumni_profile_id ? (int) $recipient->alumni_profile_id : null;
                if (! $announcement->matchesAlumniProfile($profileId)) {
                    continue;
                }
            }

            $recipient->notifications()->create([
                'id' => (string) Str::uuid(),
                'type' => 'App\\Notifications\\AnnouncementPublished',
                'data' => [
                    'title' => $announcement->is_pinned
                        ? '📌 Pinned Announcement: '.$announcement->title
                        : 'New Announcement: '.$announcement->title,
                    'message' => Str::limit($announcement->body, 140),
                    'announcement_id' => $announcement->id,
                    'category' => $announcement->category,
                ],
            ]);
        }
    }

    private function authorizeManagement(Request $request): void
    {
        Gate::forUser($request->user())->authorize('manageAnnouncements');
    }
}

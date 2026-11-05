<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userRoles = $request->user()->roles()->pluck('name')->all();
        $query = Announcement::query()->where('status', 'published')
            ->whereNotNull('published_at')->where('published_at', '<=', now())
            ->where(function ($query) use ($userRoles): void {
                $query->whereNull('audience_roles');
                foreach ($userRoles as $role) {
                    $query->orWhereJsonContains('audience_roles', $role);
                }
            });

        return response()->json(['data' => $query->latest('published_at')->paginate(25)]);
    }

    public function manageIndex(Request $request): JsonResponse
    {
        $this->authorizeManagement($request);

        return response()->json(['data' => Announcement::query()->latest()->paginate(25)]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeManagement($request);
        $data = $this->validated($request, true);
        $announcement = Announcement::create([
            ...$data,
            'created_by_user_id' => $request->user()->id,
        ]);

        return response()->json(['data' => $announcement], 201);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $this->authorizeManagement($request);
        $announcement->fill($this->validated($request, false))->save();

        return response()->json(['data' => $announcement->refresh()]);
    }

    public function publish(Request $request, Announcement $announcement): JsonResponse
    {
        $this->authorizeManagement($request);
        $announcement->forceFill(['status' => 'published', 'published_at' => now()])->save();

        return response()->json(['data' => $announcement]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $creating): array
    {
        return $request->validate([
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'max:180'],
            'body' => [$creating ? 'required' : 'sometimes', 'string', 'max:50000'],
            'audience_roles' => ['sometimes', 'nullable', 'array'],
            'audience_roles.*' => ['string', Rule::exists('roles', 'name')],
        ]);
    }

    private function authorizeManagement(Request $request): void
    {
        Gate::forUser($request->user())->authorize('manageAnnouncements');
    }
}

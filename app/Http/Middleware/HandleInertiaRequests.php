<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user()
                    ? [
                        ...$request->user()->toArray(),
                        'is_profile_complete' => $request->user()->hasCompletedAlumniProfile(),
                        'missing_profile_fields' => $request->user()->hasRole('alumni')
                            ? ($request->user()->alumniProfile?->missingProfileFields() ?? ['gender', 'civil_status', 'contact_number', 'current_address', 'permanent_address'])
                            : [],
                        'roles' => $request->user()->roles()->orderBy('name')->pluck('name')->all(),
                        'assigned_programs' => $request->user()
                            ->assignedPrograms()
                            ->orderBy('code')
                            ->get(['academic_programs.id', 'academic_programs.code', 'academic_programs.name'])
                            ->map(fn ($program) => [
                                'id' => $program->id,
                                'code' => $program->code,
                                'name' => $program->name,
                            ])
                            ->all(),
                    ]
                    : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}

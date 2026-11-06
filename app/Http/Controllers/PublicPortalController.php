<?php

namespace App\Http\Controllers;

use App\Models\AcademicProgram;
use App\Models\AlumniProfile;
use App\Models\Announcement;
use App\Models\Department;
use App\Models\JobPosting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicPortalController extends Controller
{
    public function index(Request $request): Response
    {
        $announcements = Announcement::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where(function ($query): void {
                $query->whereNull('audience_roles')
                    ->orWhereJsonContains('audience_roles', 'alumni')
                    ->orWhereJsonContains('audience_roles', 'public');
            })
            ->orderByDesc('published_at')
            ->limit(6)
            ->get(['id', 'title', 'body', 'published_at'])
            ->map(fn (Announcement $item) => [
                'id' => $item->id,
                'title' => $item->title,
                'body' => $item->body,
                'published_at' => $item->published_at?->toDateString(),
            ])
            ->values();

        $jobs = JobPosting::query()
            ->with('employer:id,company_name,industry,website')
            ->where('status', 'published')
            ->whereHas('employer', fn ($query) => $query->where('verification_status', 'verified'))
            ->where(fn ($query) => $query->whereNull('closes_at')->orWhereDate('closes_at', '>=', today()))
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit(12)
            ->get([
                'id',
                'employer_id',
                'title',
                'description',
                'location',
                'employment_type',
                'workplace_type',
                'salary_min',
                'salary_max',
                'closes_at',
                'published_at',
            ])
            ->map(fn (JobPosting $job) => [
                'id' => $job->id,
                'title' => $job->title,
                'description' => $job->description,
                'location' => $job->location ?? 'Philippines',
                'employment_type' => $job->employment_type ?? 'Full-time',
                'workplace_type' => $job->workplace_type ?? 'On-site',
                'salary_min' => $job->salary_min !== null ? (float) $job->salary_min : null,
                'salary_max' => $job->salary_max !== null ? (float) $job->salary_max : null,
                'closes_at' => $job->closes_at?->toDateString(),
                'published_at' => $job->published_at?->toDateString(),
                'company_name' => $job->employer?->company_name ?? 'Verified Partner',
                'industry' => $job->employer?->industry ?? 'General Industry',
                'website' => $job->employer?->website,
            ])
            ->values();

        $departments = Department::query()
            ->where('is_active', true)
            ->with(['programs' => fn ($query) => $query->where('is_active', true)->select('id', 'department_id', 'code', 'name')->orderBy('name')])
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'description'])
            ->map(fn (Department $dept) => [
                'id' => $dept->id,
                'code' => $dept->code,
                'name' => $dept->name,
                'description' => $dept->description,
                'programs' => $dept->programs->map(fn (AcademicProgram $prog) => [
                    'id' => $prog->id,
                    'code' => $prog->code,
                    'name' => $prog->name,
                ])->values(),
            ])
            ->values();

        return Inertia::render('welcome', [
            'publicStats' => [
                'graduates_count' => AlumniProfile::query()->count(),
                'programs_count' => AcademicProgram::query()->where('is_active', true)->count(),
                'departments_count' => Department::query()->where('is_active', true)->count(),
                'open_jobs_count' => $jobs->count(),
            ],
            'publicAnnouncements' => $announcements,
            'publicJobs' => $jobs,
            'publicDepartments' => $departments,
        ]);
    }
}


<?php

namespace App\Providers;

use App\Models\AlumniProfile;
use App\Models\Employer;
use App\Policies\AlumniProfilePolicy;
use App\Policies\EmployerPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        Gate::policy(AlumniProfile::class, AlumniProfilePolicy::class);
        Gate::policy(Employer::class, EmployerPolicy::class);
        Gate::before(fn ($user, $ability) => $user->hasRole('system-administrator') ? true : null);
        Gate::define('manageAcademicCatalog', fn ($user) => $user->hasRole(
            'system-administrator',
            'alumni-coordinator',
        ));
        Gate::define('manageRegistrationAssistance', fn ($user) => $user->hasRole(
            'system-administrator',
            'alumni-coordinator',
            'department-coordinator',
        ));
        Gate::define('manageSurveys', fn ($user) => $user->hasRole(
            'system-administrator',
            'alumni-coordinator',
        ) || $user->hasPermission('surveys.manage'));
        Gate::define('manageAnnouncements', fn ($user) => $user->hasRole(
            'system-administrator',
            'alumni-coordinator',
        ) || $user->hasPermission('announcements.manage'));
        Gate::define('manageEvents', fn ($user) => $user->hasRole(
            'system-administrator',
            'alumni-coordinator',
        ) || $user->hasPermission('events.manage') || $user->hasPermission('announcements.manage'));
        Gate::define('manageJobs', fn ($user) => $user->hasRole(
            'system-administrator',
            'alumni-coordinator',
        ) || $user->hasPermission('jobs.manage'));
        Gate::define('viewDashboard', fn ($user) => $user->hasRole(
            'system-administrator',
            'alumni-coordinator',
            'department-coordinator',
            'alumni',
            'employer',
        ) || $user->hasPermission('reports.view'));
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}

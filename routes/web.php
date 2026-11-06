<?php

use App\Http\Controllers\AlumniRegistrationAssistanceController;
use App\Http\Controllers\Api\AcademicCatalogController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AlumniController;
use App\Http\Controllers\Api\AlumniDocumentController;
use App\Http\Controllers\Api\AlumniEmploymentController;
use App\Http\Controllers\Api\AlumniReportController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\ApiTokenController;
use App\Http\Controllers\Api\DashboardStatsController;
use App\Http\Controllers\Api\EmployerController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RegistrationAssistanceController;
use App\Http\Controllers\Api\SurveyController;
use App\Http\Middleware\EnsureUserIsNotSuspended;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/preview', 'preview')->name('preview');

Route::get('/alumni/registration-assistance', [AlumniRegistrationAssistanceController::class, 'create'])
    ->name('alumni.registration-assistance.create');
Route::post('/alumni/registration-assistance', [AlumniRegistrationAssistanceController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('alumni.registration-assistance.store');

Route::post('/api/auth/token', [ApiTokenController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('api.auth.token.store');

Route::prefix('api')->middleware(['auth:sanctum', 'verified', 'ability:api', EnsureUserIsNotSuspended::class])->group(function () {
    Route::delete('/auth/token', [ApiTokenController::class, 'destroy'])->name('api.auth.token.destroy');
    Route::get('/me/alumni', [AlumniController::class, 'me'])->name('api.me.alumni');
    Route::get('/alumni', [AlumniController::class, 'index'])->name('api.alumni.index');
    Route::post('/alumni', [AlumniController::class, 'store'])->name('api.alumni.store');
    Route::post('/alumni/import', [AlumniController::class, 'import'])->name('api.alumni.import');
    Route::get('/alumni/import-template', [AlumniController::class, 'importTemplate'])->name('api.alumni.import-template');
    Route::get('/alumni/{profile}', [AlumniController::class, 'show'])->name('api.alumni.show');
    Route::patch('/alumni/{profile}', [AlumniController::class, 'update'])->name('api.alumni.update');
    Route::post('/alumni/{profile}/education-records', [AlumniController::class, 'storeEducationRecord'])
        ->name('api.alumni.education-records.store');
    Route::get('/alumni/{profile}/employment', [AlumniEmploymentController::class, 'index'])
        ->name('api.alumni.employment.index');
    Route::post('/alumni/{profile}/employment', [AlumniEmploymentController::class, 'store'])
        ->name('api.alumni.employment.store');
    Route::get('/employment-statuses', [AlumniEmploymentController::class, 'statuses'])
        ->name('api.employment-statuses.index');
    Route::get('/alumni/{profile}/documents', [AlumniDocumentController::class, 'index'])
        ->name('api.alumni.documents.index');
    Route::post('/alumni/{profile}/documents', [AlumniDocumentController::class, 'store'])
        ->name('api.alumni.documents.store');
    Route::get('/alumni-documents/{document}', [AlumniDocumentController::class, 'download'])
        ->name('api.alumni-documents.download');
    Route::delete('/alumni-documents/{document}', [AlumniDocumentController::class, 'destroy'])
        ->name('api.alumni-documents.destroy');
    Route::get('/departments', [AcademicCatalogController::class, 'departments'])->name('api.departments.index');
    Route::post('/departments', [AcademicCatalogController::class, 'storeDepartment'])->name('api.departments.store');
    Route::get('/programs', [AcademicCatalogController::class, 'programs'])->name('api.programs.index');
    Route::post('/departments/{department}/programs', [AcademicCatalogController::class, 'storeProgram'])
        ->name('api.programs.store');
    Route::post('/programs/{program}/degrees', [AcademicCatalogController::class, 'storeProgramDegree'])
        ->name('api.program-degrees.store');
    Route::get('/reports/employment-outcomes', [AlumniReportController::class, 'employmentOutcomes'])
        ->name('api.reports.employment-outcomes');
    Route::get('/dashboard', DashboardStatsController::class)->name('api.dashboard');
    Route::get('/dashboard/stats', DashboardStatsController::class)->name('api.dashboard.stats');
    Route::get('/surveys', [SurveyController::class, 'index'])->name('api.surveys.index');
    Route::post('/surveys', [SurveyController::class, 'store'])->name('api.surveys.store');
    Route::patch('/surveys/{survey}', [SurveyController::class, 'update'])->name('api.surveys.update');
    Route::post('/surveys/{survey}/publish', [SurveyController::class, 'publish'])->name('api.surveys.publish');
    Route::post('/surveys/{survey}/responses', [SurveyController::class, 'respond'])->name('api.surveys.respond');
    Route::get('/announcements', [AnnouncementController::class, 'index'])->name('api.announcements.index');
    Route::get('/announcements/manage', [AnnouncementController::class, 'manageIndex'])
        ->name('api.announcements.manage');
    Route::post('/announcements', [AnnouncementController::class, 'store'])->name('api.announcements.store');
    Route::patch('/announcements/{announcement}', [AnnouncementController::class, 'update'])
        ->name('api.announcements.update');
    Route::post('/announcements/{announcement}/publish', [AnnouncementController::class, 'publish'])
        ->name('api.announcements.publish');
    Route::get('/jobs', [JobController::class, 'index'])->name('api.jobs.index');
    Route::get('/jobs/{jobPosting}', [JobController::class, 'show'])->name('api.jobs.show');
    Route::post('/jobs/{jobPosting}/applications', [JobController::class, 'apply'])->name('api.jobs.apply');
    Route::get('/employer/jobs', [JobController::class, 'employerIndex'])->name('api.employer.jobs.index');
    Route::post('/employer/jobs', [JobController::class, 'store'])->name('api.employer.jobs.store');
    Route::patch('/employer/jobs/{jobPosting}', [JobController::class, 'update'])->name('api.employer.jobs.update');
    Route::delete('/employer/jobs/{jobPosting}', [JobController::class, 'destroy'])->name('api.employer.jobs.destroy');
    Route::post('/employer/jobs/{jobPosting}/publish', [JobController::class, 'publish'])
        ->name('api.employer.jobs.publish');
    Route::get('/employer/jobs/{jobPosting}/applications', [JobController::class, 'applications'])
        ->name('api.employer.jobs.applications');
    Route::get('/applications/me', [JobController::class, 'myApplications'])->name('api.applications.mine');
    Route::get('/applications/{application}/resume', [JobController::class, 'downloadResume'])
        ->name('api.applications.resume.download');
    Route::patch('/applications/{application}/status', [JobController::class, 'reviewApplication'])
        ->name('api.applications.review');
    Route::get('/employers', [EmployerController::class, 'index'])->name('api.employers.index');
    Route::post('/employers', [EmployerController::class, 'store'])->name('api.employers.store');
    Route::get('/employers/mine', [EmployerController::class, 'mine'])->name('api.employers.mine');
    Route::get('/employers/{employer}', [EmployerController::class, 'show'])->name('api.employers.show');
    Route::patch('/employers/{employer}', [EmployerController::class, 'update'])->name('api.employers.update');
    Route::patch('/employers/{employer}/verification', [EmployerController::class, 'review'])
        ->name('api.employers.verification');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('api.notifications.index');
    Route::patch('/notifications/{notificationId}/read', [NotificationController::class, 'markRead'])
        ->name('api.notifications.read');
    Route::get('/registration-assistance', [RegistrationAssistanceController::class, 'index'])
        ->name('api.registration-assistance.index');
    Route::patch('/registration-assistance/{assistanceRequest}', [RegistrationAssistanceController::class, 'update'])
        ->name('api.registration-assistance.update');
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('api.activity-logs.index');
    Route::get('/admin/users', [\App\Http\Controllers\Api\SystemAdminUserController::class, 'index'])
        ->name('api.admin.users.index');
    Route::post('/admin/users', [\App\Http\Controllers\Api\SystemAdminUserController::class, 'invite'])
        ->name('api.admin.users.invite');
    Route::patch('/admin/users/{user}/roles', [\App\Http\Controllers\Api\SystemAdminUserController::class, 'updateRoles'])
        ->name('api.admin.users.roles.update');
    Route::patch('/admin/users/{user}/suspension', [\App\Http\Controllers\Api\SystemAdminUserController::class, 'updateSuspension'])
        ->name('api.admin.users.suspension.update');
    Route::delete('/admin/users/{user}', [\App\Http\Controllers\Api\SystemAdminUserController::class, 'destroy'])
        ->name('api.admin.users.destroy');
});

Route::middleware(['auth', 'verified', EnsureUserIsNotSuspended::class])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';

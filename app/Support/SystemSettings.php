<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Throwable;

class SystemSettings
{
    private const SETTINGS_PATH = 'system_settings.json';

    public static function demoQuickLoginEnabled(): bool
    {
        $settings = self::readSettings();

        return (bool) ($settings['demo_quick_login_enabled'] ?? true);
    }

    public static function setDemoQuickLoginEnabled(bool $enabled): void
    {
        $settings = self::readSettings();
        $settings['demo_quick_login_enabled'] = $enabled;

        Storage::disk('local')->put(
            self::SETTINGS_PATH,
            json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '{}',
        );
    }

    /**
     * @return list<array{
     *     title: string,
     *     subtitle: string,
     *     handle: string,
     *     email: string,
     *     password: string,
     *     icon: string
     * }>
     */
    public static function demoAccounts(): array
    {
        $defaultPassword = (string) env('ADMIN_PASSWORD', 'Password123!');
        $alumniEmail = 'alumni.grad25@seait.example.edu.ph';
        $alumniSubtitle = 'Graduate Tracer & Career Portal';

        try {
            if (Schema::hasTable('users')) {
                $preferredAlumni = User::query()
                    ->where('email', 'alumni.grad25@seait.example.edu.ph')
                    ->whereNull('suspended_at')
                    ->first()
                    ?? User::query()
                        ->whereNotNull('alumni_profile_id')
                        ->whereNull('suspended_at')
                        ->orderBy('id')
                        ->first();

                if ($preferredAlumni !== null) {
                    $alumniEmail = $preferredAlumni->email;
                    $alumniSubtitle = $preferredAlumni->name.' · Graduate Portal';
                }
            }
        } catch (Throwable) {
            // Fallback to default demo alumni email if database is unavailable.
        }

        return [
            [
                'title' => 'System Admin (Registrar)',
                'subtitle' => 'All Departments & Governance',
                'handle' => 'admin',
                'email' => (string) env('ADMIN_EMAIL', 'admin@atms.local'),
                'password' => $defaultPassword,
                'icon' => 'shield',
            ],
            [
                'title' => 'Alumni Coordinator',
                'subtitle' => 'Institution-wide Tracer & GTS',
                'handle' => 'alumni_coord',
                'email' => 'coordinator@atms.local',
                'password' => $defaultPassword,
                'icon' => 'users',
            ],
            [
                'title' => 'CICT Department Admin',
                'subtitle' => 'College of Info. & Comm. Tech.',
                'handle' => 'cict_admin',
                'email' => 'dept.ccs@atms.local',
                'password' => $defaultPassword,
                'icon' => 'building',
            ],
            [
                'title' => 'Employer Partner',
                'subtitle' => 'TechNova Solutions (Recruitment)',
                'handle' => 'employer_hr',
                'email' => 'employer@atms.local',
                'password' => $defaultPassword,
                'icon' => 'briefcase',
            ],
            [
                'title' => 'Verified Graduate (Alumni)',
                'subtitle' => $alumniSubtitle,
                'handle' => 'alumni_grad',
                'email' => $alumniEmail,
                'password' => $defaultPassword,
                'icon' => 'graduation',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function readSettings(): array
    {
        try {
            $disk = Storage::disk('local');
            if (! $disk->exists(self::SETTINGS_PATH)) {
                return [];
            }

            $decoded = json_decode((string) $disk->get(self::SETTINGS_PATH), true);

            return is_array($decoded) ? $decoded : [];
        } catch (Throwable) {
            return [];
        }
    }
}

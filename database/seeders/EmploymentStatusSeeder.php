<?php

namespace Database\Seeders;

use App\Models\EmploymentStatus;
use Illuminate\Database\Seeder;

class EmploymentStatusSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'employed' => 'Employed',
            'self-employed' => 'Self-Employed',
            'unemployed' => 'Unemployed',
            'further-studies' => 'Pursuing Further Studies',
            'government-employee' => 'Government Employee',
            'freelance' => 'Freelance',
            'other' => 'Other',
        ] as $code => $label) {
            EmploymentStatus::query()->firstOrCreate(['code' => $code], ['label' => $label]);
        }
    }
}

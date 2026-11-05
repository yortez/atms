<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['event', 'user_id', 'alumni_profile_id', 'student_number_hash', 'ip_address', 'user_agent'])]
class AlumniRegistrationLog extends Model {}

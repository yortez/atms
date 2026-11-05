<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['title', 'body', 'audience_roles', 'status', 'published_at', 'created_by_user_id'])]
class Announcement extends Model
{
    protected function casts(): array
    {
        return ['audience_roles' => 'array', 'published_at' => 'datetime'];
    }
}

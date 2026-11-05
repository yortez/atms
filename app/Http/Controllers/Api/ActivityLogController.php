<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;

class ActivityLogController extends Controller
{
    public function index(): JsonResponse
    {
        abort_unless(auth()->user()->hasRole('system-administrator'), 403);

        return response()->json([
            'data' => ActivityLog::query()->with('actor:id,name')->latest('created_at')->paginate(50),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->notifications()->latest()->paginate(25),
            'meta' => [
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ],
        ]);
    }

    public function markRead(Request $request, string $notificationId): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($notificationId);
        $notification->markAsRead();

        return response()->json(['data' => ['id' => $notificationId, 'read_at' => $notification->read_at]]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $now = now();
        $updated = $request->user()->unreadNotifications()->update(['read_at' => $now]);

        return response()->json([
            'data' => [
                'marked_count' => $updated,
                'read_at' => $now->toISOString(),
            ],
        ]);
    }
}

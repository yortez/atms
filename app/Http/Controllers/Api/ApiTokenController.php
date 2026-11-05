<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class ApiTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string'],
            'device_name' => ['required', 'string', 'max:80'],
        ]);
        $user = User::query()->where('email', Str::lower(trim($data['email'])))->first();

        if ($user === null || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'The provided credentials are invalid.'], 401);
        }

        if (! $user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email verification is required before API access.'], 403);
        }

        $token = $user->createToken(
            $data['device_name'],
            ['api'],
            now()->addMinutes((int) config('sanctum.expiration', 43200)),
        );

        return response()->json([
            'data' => [
                'token' => $token->plainTextToken,
                'expires_at' => $token->accessToken->expires_at,
            ],
        ], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $plainTextToken = $request->bearerToken();

        if ($plainTextToken === null) {
            return response()->json([
                'message' => 'This request is not authenticated with a personal access token.',
            ], 400);
        }

        $token = PersonalAccessToken::findToken($plainTextToken);

        if (
            $token === null
            || $token->tokenable_type !== $request->user()->getMorphClass()
            || (string) $token->tokenable_id !== (string) $request->user()->getAuthIdentifier()
        ) {
            return response()->json(['message' => 'The token does not belong to this user.'], 403);
        }

        $token->delete();

        return response()->json(status: 204);
    }
}

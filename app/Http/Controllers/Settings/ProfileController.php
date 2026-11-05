<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $avatar = $validated['avatar'] ?? null;
        unset($validated['avatar']);

        $newAvatarPath = $avatar?->storePublicly('avatars', 'public');
        if ($avatar !== null && ! is_string($newAvatarPath)) {
            throw new RuntimeException('The avatar could not be uploaded.');
        }

        $oldAvatarPath = $user->avatar_path;

        try {
            $user->fill($validated);

            if (is_string($newAvatarPath)) {
                $user->avatar_path = $newAvatarPath;
            }

            if ($user->isDirty('email')) {
                $user->email_verified_at = null;
            }

            $user->save();
        } catch (Throwable $exception) {
            if (is_string($newAvatarPath) && ! Storage::disk('public')->delete($newAvatarPath)) {
                report(new RuntimeException('The newly uploaded avatar could not be removed after a profile update failure.'));
            }

            throw $exception;
        }

        if (
            is_string($newAvatarPath)
            && is_string($oldAvatarPath)
            && ! Storage::disk('public')->delete($oldAvatarPath)
        ) {
            report(new RuntimeException('The previous avatar could not be removed after an avatar replacement.'));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}

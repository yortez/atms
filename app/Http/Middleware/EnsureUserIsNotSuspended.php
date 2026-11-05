<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsNotSuspended
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_if($request->user()?->isSuspended(), 403, 'Your account has been suspended.');

        return $next($request);
    }
}

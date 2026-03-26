<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if ($user === null || $role !== 'platform_admin' || ! $user->hasRole('platform_admin')) {
            abort(403, 'Accès non autorisé');
        }

        return $next($request);
    }
}

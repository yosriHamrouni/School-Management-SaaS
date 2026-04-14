<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $acceptedRoles = collect($roles)
            ->flatMap(fn (string $role) => explode('|', $role))
            ->filter()
            ->values();

        if ($user === null || $acceptedRoles->isEmpty() || ! $acceptedRoles->contains(
            fn (string $role) => $user->hasRole($role),
        )) {
            abort(403, 'Acces non autorise');
        }

        return $next($request);
    }
}

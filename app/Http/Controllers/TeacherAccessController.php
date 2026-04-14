<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\Request;
use Illuminate\Routing\Pipeline;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Actions\AttemptToAuthenticate;
use Laravel\Fortify\Actions\CanonicalizeUsername;
use Laravel\Fortify\Actions\EnsureLoginIsNotThrottled;
use Laravel\Fortify\Actions\PrepareAuthenticatedSession;
use Laravel\Fortify\Contracts\RedirectsIfTwoFactorAuthenticatable;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Requests\LoginRequest;

class TeacherAccessController extends Controller
{
    public function __construct(
        private readonly StatefulGuard $guard,
    ) {
    }

    public function create(Request $request): Response
    {
        return Inertia::render('TeacherAccess', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(LoginRequest $request)
    {
        $this->ensureTeacherAccount($request);

        return $this->loginPipeline($request)->then(function (LoginRequest $request) {
            $user = $request->user();

            if (! $user || ! $user->hasRole('teacher')) {
                $this->guard->logout();

                if ($request->hasSession()) {
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                }

                throw ValidationException::withMessages([
                    Fortify::username() => ['Cet espace est reserve aux enseignants.'],
                ]);
            }

            return redirect()->intended(route('dashboard', absolute: false));
        });
    }

    private function ensureTeacherAccount(LoginRequest $request): void
    {
        $provider = $this->guard->getProvider();
        $credentials = $request->only(Fortify::username(), 'password');
        $user = $provider->retrieveByCredentials($credentials);

        if (! $user || ! $provider->validateCredentials($user, ['password' => $request->password])) {
            return;
        }

        if (! method_exists($user, 'hasRole') || ! $user->hasRole('teacher')) {
            throw ValidationException::withMessages([
                Fortify::username() => ['Cet espace est reserve aux enseignants.'],
            ]);
        }
    }

    private function loginPipeline(LoginRequest $request): Pipeline
    {
        return (new Pipeline(app()))->send($request)->through(array_filter([
            config('fortify.limiters.login') ? null : EnsureLoginIsNotThrottled::class,
            config('fortify.lowercase_usernames') ? CanonicalizeUsername::class : null,
            Features::enabled(Features::twoFactorAuthentication()) ? RedirectsIfTwoFactorAuthenticatable::class : null,
            AttemptToAuthenticate::class,
            PrepareAuthenticatedSession::class,
        ]));
    }
}

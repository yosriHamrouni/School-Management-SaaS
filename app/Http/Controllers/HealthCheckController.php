<?php

namespace App\Http\Controllers;

use App\Support\Health\ReadinessProbe;
use Illuminate\Http\JsonResponse;

/**
 * Readiness endpoint (GET /health/ready).
 *
 * Liveness is served by Laravel's built-in /up route, which does not touch
 * the database. This endpoint additionally verifies the database, and is
 * registered outside the "web" middleware group so that probes do not start
 * sessions (SESSION_DRIVER=database would otherwise write a row per probe).
 */
class HealthCheckController extends Controller
{
    public function __invoke(ReadinessProbe $probe): JsonResponse
    {
        $result = $probe->run();

        return response()
            ->json([
                'status' => $result['healthy'] ? 'ok' : 'fail',
                'checks' => $result['checks'],
                'release' => config('app.release'),
                'timestamp' => now()->toIso8601String(),
            ], $result['healthy'] ? 200 : 503)
            ->header('Cache-Control', 'no-store, max-age=0');
    }
}

<?php

namespace App\Support\Health;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Verifies the dependencies the application cannot serve traffic without.
 *
 * Results are intentionally coarse ("ok" / "fail") so that health output can
 * be exposed publicly without leaking hostnames, credentials, driver errors,
 * or any tenant data. Failure details go to the application log only.
 */
class ReadinessProbe
{
    /**
     * @return array{healthy: bool, checks: array<string, array{status: string, latency_ms: int}>}
     */
    public function run(): array
    {
        $checks = [
            'database' => $this->checkDatabase(),
        ];

        $healthy = collect($checks)->every(fn (array $check): bool => $check['status'] === 'ok');

        return [
            'healthy' => $healthy,
            'checks' => $checks,
        ];
    }

    /**
     * @return array{status: string, latency_ms: int}
     */
    private function checkDatabase(): array
    {
        $startedAt = hrtime(true);

        try {
            DB::connection()->select('select 1');
            $status = 'ok';
        } catch (Throwable $exception) {
            $status = 'fail';

            Log::error('Readiness probe: database check failed.', [
                'connection' => DB::getDefaultConnection(),
                'exception' => $exception::class,
            ]);
        }

        return [
            'status' => $status,
            'latency_ms' => (int) round((hrtime(true) - $startedAt) / 1_000_000),
        ];
    }
}

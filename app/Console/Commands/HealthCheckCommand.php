<?php

namespace App\Console\Commands;

use App\Support\Health\ReadinessProbe;
use Illuminate\Console\Command;

class HealthCheckCommand extends Command
{
    protected $signature = 'app:health-check {--json : Print the result as JSON}';

    protected $description = 'Check that the application dependencies (database) are reachable. Exits non-zero on failure.';

    public function handle(ReadinessProbe $probe): int
    {
        $result = $probe->run();

        if ($this->option('json')) {
            $this->line((string) json_encode($result, JSON_PRETTY_PRINT));
        } else {
            foreach ($result['checks'] as $name => $check) {
                $this->line(sprintf('%-10s %-4s %d ms', $name, strtoupper($check['status']), $check['latency_ms']));
            }
        }

        return $result['healthy'] ? self::SUCCESS : self::FAILURE;
    }
}

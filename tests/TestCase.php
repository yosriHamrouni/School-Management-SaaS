<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();
        $config = $app->make('config');

        // RefreshDatabase wipes the database it runs against. Only allow an
        // in-memory SQLite DB, or - when explicitly opted in (CI) - a
        // PostgreSQL database whose name marks it as disposable.
        $isMemorySqlite = $config->get('database.default') === 'sqlite'
            && $config->get('database.connections.sqlite.database') === ':memory:';

        $isDisposablePgsql = filter_var(getenv('TESTING_ALLOW_PGSQL'), FILTER_VALIDATE_BOOL)
            && $config->get('database.default') === 'pgsql'
            && preg_match('/(_test|testing)$/', (string) $config->get('database.connections.pgsql.database')) === 1;

        if (! $isMemorySqlite && ! $isDisposablePgsql) {
            throw new RuntimeException(
                'Tests aborted: the database must be SQLite in memory, or a PostgreSQL database named *_test/*testing with TESTING_ALLOW_PGSQL=true.',
            );
        }

        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    protected function skipUnlessFortifyFeature(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}

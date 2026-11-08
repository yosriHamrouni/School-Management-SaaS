<?php

use Illuminate\Support\Facades\DB;

test('liveness endpoint responds without touching the database', function () {
    $this->get('/up')->assertOk();
});

test('readiness endpoint reports a healthy database', function () {
    config(['app.release' => 'abc123']);

    $this->getJson('/health/ready')
        ->assertOk()
        ->assertHeader('Cache-Control', 'max-age=0, no-store, private')
        ->assertJsonPath('status', 'ok')
        ->assertJsonPath('checks.database.status', 'ok')
        ->assertJsonPath('release', 'abc123');
});

test('readiness endpoint does not start a session or set cookies', function () {
    $response = $this->get('/health/ready');

    $response->assertOk();
    expect($response->headers->getCookies())->toBeEmpty();
});

test('readiness endpoint returns 503 without leaking details when the database is unreachable', function () {
    $originalConnection = config('database.default');

    config([
        'database.connections.unreachable' => [
            'driver' => 'sqlite',
            'database' => '/nonexistent-directory/health-check.sqlite',
            'prefix' => '',
        ],
        'database.default' => 'unreachable',
    ]);
    DB::purge('unreachable');

    try {
        $response = $this->getJson('/health/ready');
    } finally {
        // RefreshDatabase rolls back on the default connection during teardown.
        config(['database.default' => $originalConnection]);
    }

    $response->assertStatus(503)
        ->assertJsonPath('status', 'fail')
        ->assertJsonPath('checks.database.status', 'fail');

    expect($response->getContent())
        ->not->toContain('nonexistent-directory')
        ->not->toContain('SQLSTATE');
});

test('health check command succeeds when the database is reachable', function () {
    $this->artisan('app:health-check')->assertSuccessful();
});

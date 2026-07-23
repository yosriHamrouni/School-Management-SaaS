<?php

it('advertises the web app manifest', function () {
    $this->get('/')
        ->assertOk()
        ->assertSee('/build/manifest.webmanifest', false)
        ->assertSee('apple-mobile-web-app-capable', false);
});

it('has installable pwa assets after a production build', function () {
    expect(public_path('build/manifest.webmanifest'))->toBeFile()
        ->and(public_path('build/sw.js'))->toBeFile()
        ->and(public_path('pwa-192x192.png'))->toBeFile()
        ->and(public_path('pwa-512x512.png'))->toBeFile()
        ->and(public_path('pwa-maskable-512x512.png'))->toBeFile();

    $manifest = json_decode(
        file_get_contents(public_path('build/manifest.webmanifest')),
        true,
        flags: JSON_THROW_ON_ERROR,
    );

    expect($manifest)
        ->toMatchArray([
            'name' => 'School Management Platform',
            'short_name' => 'SchoolApp',
            'start_url' => '/',
            'display' => 'standalone',
        ]);
});

it('does not precache html or authenticated route responses', function () {
    $serviceWorker = file_get_contents(public_path('build/sw.js'));

    expect($serviceWorker)
        ->not->toContain('.html')
        ->not->toContain('/grades')
        ->not->toContain('/attendances')
        ->not->toContain('/messages')
        ->not->toContain('/notifications');
});

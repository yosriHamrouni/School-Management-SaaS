/// <reference types="vite-plugin-pwa/react" />

import type { Auth } from '@/types/auth';
import type { AxiosStatic } from 'axios';
import type Echo from 'laravel-echo';
import type Pusher from 'pusher-js';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}

declare global {
    interface Window {
        axios: AxiosStatic;
        Echo?: Echo<'reverb'>;
        Pusher?: typeof Pusher;
    }
}

export {};

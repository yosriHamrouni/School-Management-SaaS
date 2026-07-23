import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const reverbAppKey = import.meta.env.VITE_REVERB_APP_KEY;

if (typeof window !== 'undefined' && !window.Echo && reverbAppKey) {
    window.Pusher = Pusher;

    try {
        window.Echo = new Echo({
            broadcaster: 'reverb',
            key: reverbAppKey,
            wsHost:
                import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
            wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
            wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
            forceTLS:
                (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
            enabledTransports: ['ws', 'wss'],
        });
    } catch (error) {
        console.warn('Realtime initialization failed.', error);
    }
}

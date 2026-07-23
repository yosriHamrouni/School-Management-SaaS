import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PwaUpdatePrompt from '@/components/pwa-update-prompt';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { I18nProvider } from '@/i18n';
import '@/bootstrap';
import '@/lib/echo';
import AppThemeProvider from '@/theme/provider';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '../css/app.css';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        const initialLocale = props.initialPage.props.locale;

        root.render(
            <StrictMode>
                <I18nProvider initialLocale={initialLocale}>
                    <AppThemeProvider>
                        <TooltipProvider delayDuration={0}>
                            <App {...props} />
                            <PwaUpdatePrompt />
                        </TooltipProvider>
                    </AppThemeProvider>
                </I18nProvider>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

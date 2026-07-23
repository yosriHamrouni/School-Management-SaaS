import { router } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

export type Locale = 'ar' | 'en' | 'fr';

type TranslationValue = string | { [key: string]: TranslationValue };
type TranslationDictionary = Record<string, TranslationValue>;

type I18nContextValue = {
    dir: 'ltr' | 'rtl';
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
};

const defaultLocale: Locale = 'fr';
const storageKey = 'school-management.locale';

const dictionaries: Record<Locale, TranslationDictionary> = {
    ar,
    en,
    fr,
};

const encodedLocales: Array<{ code: Locale; label: string }> = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
];

export const locales: Array<{ code: Locale; label: string }> = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
];

const I18nContext = createContext<I18nContextValue | null>(null);

function isLocale(value: unknown): value is Locale {
    return value === 'fr' || value === 'en' || value === 'ar';
}

function getStoredLocale() {
    if (typeof window === 'undefined') {
        return null;
    }

    const storedLocale = window.localStorage.getItem(storageKey);

    return isLocale(storedLocale) ? storedLocale : null;
}

function resolvePath(dictionary: TranslationDictionary, key: string) {
    return key.split('.').reduce<TranslationValue | undefined>((value, part) => {
        if (!value || typeof value === 'string') {
            return undefined;
        }

        return value[part];
    }, dictionary);
}

function interpolate(value: string, replacements: Record<string, string | number>) {
    return Object.entries(replacements).reduce(
        (text, [key, replacement]) =>
            text.replace(new RegExp(`:${key}\\b`, 'g'), String(replacement)),
        value,
    );
}

export function I18nProvider({
    children,
    initialLocale,
}: PropsWithChildren<{ initialLocale?: unknown }>) {
    const serverLocale = isLocale(initialLocale) ? initialLocale : null;
    const [locale, setLocaleState] = useState<Locale>(
        () => getStoredLocale() ?? serverLocale ?? defaultLocale,
    );
    const dir: 'ltr' | 'rtl' = locale === 'ar' ? 'rtl' : 'ltr';

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = dir;
        document.body.dir = dir;
        window.localStorage.setItem(storageKey, locale);
    }, [dir, locale]);

    useEffect(() => {
        if (!serverLocale || getStoredLocale()) {
            return;
        }

        setLocaleState(serverLocale);
    }, [serverLocale]);

    const setLocale = useCallback((nextLocale: Locale) => {
        setLocaleState(nextLocale);

        if (typeof window !== 'undefined') {
            window.localStorage.setItem(storageKey, nextLocale);
        }

        router.post(
            '/locale',
            { locale: nextLocale },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['locale'],
            },
        );
    }, []);

    const t = useCallback(
        (key: string, replacements: Record<string, string | number> = {}) => {
            const translated =
                resolvePath(dictionaries[locale], key) ??
                resolvePath(dictionaries[defaultLocale], key);

            if (typeof translated !== 'string') {
                return key;
            }

            return interpolate(translated, replacements);
        },
        [locale],
    );

    const value = useMemo(
        () => ({
            dir,
            locale,
            setLocale,
            t,
        }),
        [dir, locale, setLocale, t],
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
    const context = useContext(I18nContext);

    if (!context) {
        throw new Error('useTranslation must be used within I18nProvider.');
    }

    return context;
}

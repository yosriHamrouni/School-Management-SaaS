import { Globe2 } from 'lucide-react';
import { locales, useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

type LanguageSwitcherProps = {
    className?: string;
    compact?: boolean;
    inverse?: boolean;
};

export default function LanguageSwitcher({
    className,
    compact = false,
    inverse = false,
}: LanguageSwitcherProps) {
    const { locale, setLocale, t } = useTranslation();

    return (
        <label
            className={cn(
                'inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-semibold shadow-sm transition',
                inverse
                    ? 'border-white/30 bg-white/15 text-white'
                    : 'border-border bg-background text-foreground',
                className,
            )}
        >
            <Globe2 className="size-4 shrink-0" aria-hidden="true" />
            <span className={compact ? 'sr-only' : 'hidden sm:inline'}>
                {t('common.language')}
            </span>
            <select
                aria-label={t('common.language')}
                className={cn(
                    'min-w-0 bg-transparent text-sm font-semibold outline-none',
                    inverse ? 'text-white' : 'text-foreground',
                )}
                value={locale}
                onChange={(event) => setLocale(event.target.value as typeof locale)}
            >
                {locales.map((item) => (
                    <option key={item.code} value={item.code} className="text-slate-950">
                        {item.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

import { CssBaseline, ThemeProvider } from '@mui/material';
import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { useTranslation } from '@/i18n';
import { createAppTheme } from '@/theme/theme';

export default function AppThemeProvider({ children }: PropsWithChildren) {
    const { resolvedAppearance } = useAppearance();
    const { dir } = useTranslation();

    const theme = useMemo(
        () => createAppTheme(resolvedAppearance, dir),
        [dir, resolvedAppearance],
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            {children}
        </ThemeProvider>
    );
}

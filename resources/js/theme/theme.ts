import { alpha, createTheme  } from '@mui/material/styles';
import type {PaletteMode} from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Palette {
        neutral: Palette['primary'];
    }

    interface PaletteOptions {
        neutral?: PaletteOptions['primary'];
    }
}

export const drawerWidth = 280;

export function createAppTheme(mode: PaletteMode) {
    const isDark = mode === 'dark';

    return createTheme({
        palette: {
            mode,
            primary: {
                main: '#2563eb',
                light: '#60a5fa',
                dark: '#1d4ed8',
                contrastText: '#ffffff',
            },
            secondary: {
                main: '#0f766e',
                light: '#2dd4bf',
                dark: '#115e59',
                contrastText: '#ffffff',
            },
            success: {
                main: '#15803d',
            },
            warning: {
                main: '#d97706',
            },
            error: {
                main: '#dc2626',
            },
            neutral: {
                main: '#64748b',
                light: '#cbd5e1',
                dark: '#334155',
                contrastText: '#ffffff',
            },
            background: {
                default: isDark ? '#0f172a' : '#f3f7fb',
                paper: isDark ? '#111c34' : '#ffffff',
            },
            text: {
                primary: isDark ? '#e2e8f0' : '#0f172a',
                secondary: isDark ? '#94a3b8' : '#475569',
            },
            divider: isDark
                ? alpha('#cbd5e1', 0.12)
                : alpha('#0f172a', 0.08),
        },
        shape: {
            borderRadius: 16,
        },
        spacing: 8,
        typography: {
            fontFamily: 'Roboto, sans-serif',
            h1: {
                fontSize: '2.4rem',
                fontWeight: 700,
                letterSpacing: '-0.03em',
            },
            h2: {
                fontSize: '2rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
            },
            h3: {
                fontSize: '1.5rem',
                fontWeight: 700,
            },
            h4: {
                fontSize: '1.25rem',
                fontWeight: 700,
            },
            h5: {
                fontSize: '1.1rem',
                fontWeight: 700,
            },
            button: {
                fontWeight: 600,
                letterSpacing: '0.01em',
                textTransform: 'none',
            },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        minHeight: '100vh',
                        backgroundImage: isDark
                            ? 'radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 30%), linear-gradient(180deg, #0f172a 0%, #111827 100%)'
                            : 'radial-gradient(circle at top, rgba(37,99,235,0.12), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)',
                    },
                    '#app': {
                        minHeight: '100vh',
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backdropFilter: 'blur(12px)',
                        backgroundImage: 'none',
                        boxShadow: 'none',
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        borderRight: `1px solid ${alpha(
                            isDark ? '#cbd5e1' : '#0f172a',
                            isDark ? 0.1 : 0.08,
                        )}`,
                        backgroundImage: isDark
                            ? 'linear-gradient(180deg, rgba(17,28,52,0.98) 0%, rgba(15,23,42,0.98) 100%)'
                            : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
                    },
                },
            },
            MuiCard: {
                defaultProps: {
                    elevation: 0,
                },
                styleOverrides: {
                    root: {
                        border: `1px solid ${alpha(
                            isDark ? '#cbd5e1' : '#0f172a',
                            isDark ? 0.1 : 0.06,
                        )}`,
                        boxShadow: isDark
                            ? '0 20px 45px rgba(2, 6, 23, 0.28)'
                            : '0 18px 48px rgba(15, 23, 42, 0.06)',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                    rounded: {
                        borderRadius: 20,
                    },
                },
            },
            MuiButton: {
                defaultProps: {
                    disableElevation: true,
                },
                styleOverrides: {
                    root: {
                        minHeight: 42,
                        borderRadius: 12,
                        paddingInline: 18,
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 14,
                        backgroundColor: alpha(
                            isDark ? '#0f172a' : '#ffffff',
                            isDark ? 0.3 : 0.84,
                        ),
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    head: {
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    },
                },
            },
            MuiAlert: {
                styleOverrides: {
                    root: {
                        borderRadius: 14,
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        fontWeight: 600,
                        borderRadius: 10,
                    },
                },
            },
        },
    });
}

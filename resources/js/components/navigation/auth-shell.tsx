import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import { Box, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/i18n';

type AuthShellProps = PropsWithChildren<{
    title: string;
    description: string;
}>;

export default function AuthShell({
    children,
    title,
    description,
}: AuthShellProps) {
    const { t } = useTranslation();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                py: { xs: 4, md: 8 },
            }}
        >
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <LanguageSwitcher />
                </Box>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
                        gap: 4,
                        alignItems: 'stretch',
                    }}
                >
                    <Card
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            minHeight: 640,
                            position: 'relative',
                            overflow: 'hidden',
                            background:
                                'linear-gradient(160deg, rgba(37,99,235,0.96) 0%, rgba(15,23,42,0.98) 100%)',
                            color: '#fff',
                        }}
                    >
                        <CardContent
                            sx={{
                                p: 5,
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Stack spacing={2}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 3,
                                            display: 'grid',
                                            placeItems: 'center',
                                            bgcolor: 'rgba(255,255,255,0.14)',
                                        }}
                                    >
                                        <SchoolRoundedIcon fontSize="large" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6">
                                            {t('auth.brand.name')}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ opacity: 0.8 }}
                                        >
                                            {t('auth.brand.subtitle')}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Box sx={{ pt: 6 }}>
                                    <Typography variant="h3" sx={{ maxWidth: 440 }}>
                                        {t('auth.brand.headline')}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ mt: 2, maxWidth: 460, opacity: 0.88 }}
                                    >
                                        {t('auth.brand.description')}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Box
                                sx={{
                                    alignSelf: 'flex-end',
                                    width: 240,
                                    height: 240,
                                    borderRadius: '50%',
                                    background:
                                        'radial-gradient(circle, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 68%)',
                                    transform: 'translate(25%, 15%)',
                                }}
                            />
                        </CardContent>
                    </Card>

                    <Card
                        sx={{
                            minHeight: { xs: 'auto', md: 640 },
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <CardContent
                            sx={{
                                width: '100%',
                                p: { xs: 3, sm: 4.5, md: 5 },
                                '&:last-child': { pb: { xs: 3, sm: 4.5, md: 5 } },
                            }}
                        >
                            <Stack spacing={1.5} sx={{ mb: 4 }}>
                                <Typography variant="h4">{title}</Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {description}
                                </Typography>
                            </Stack>

                            {children}
                        </CardContent>
                    </Card>
                </Box>
            </Container>
        </Box>
    );
}

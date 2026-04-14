import { Head, Link, useForm } from '@inertiajs/react';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    IconButton,
    InputAdornment,
    Link as MuiLink,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { request } from '@/routes/password';

type Props = {
    canResetPassword: boolean;
    status?: string;
};

const highlights = [
    {
        icon: <CalendarMonthRoundedIcon />,
        title: 'Acces a votre emploi du temps',
        description: 'Retrouvez rapidement votre planning et les informations deja disponibles dans votre portail.',
    },
    {
        icon: <AssignmentRoundedIcon />,
        title: 'Entree vers vos devoirs',
        description: "L'espace eleve vous redirige vers le portail existant sans dupliquer les modules metier.",
    },
    {
        icon: <SchoolRoundedIcon />,
        title: 'Verification stricte du role',
        description: "Seuls les comptes avec le role eleve peuvent acceder a cet espace dedie.",
    },
];

export default function StudentAccess({ canResetPassword, status }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    return (
        <>
            <Head title="Espace Eleve" />

            <Box
                sx={{
                    minHeight: '100vh',
                    py: { xs: 3, md: 6 },
                    background:
                        'radial-gradient(circle at top right, rgba(14,165,233,0.18) 0%, rgba(14,165,233,0) 34%), linear-gradient(180deg, #f8fafc 0%, #edf6ff 100%)',
                }}
            >
                <Container maxWidth="lg">
                    <Stack spacing={3}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: 2,
                            }}
                        >
                            <Chip
                                icon={<BadgeRoundedIcon />}
                                label="Portail dedie"
                                color="info"
                                variant="outlined"
                            />

                            <Stack direction="row" spacing={1.5}>
                                <Button component={Link} href="/" variant="text">
                                    Accueil
                                </Button>
                                <Button component={Link} href="/login" variant="outlined">
                                    Connexion generale
                                </Button>
                            </Stack>
                        </Box>

                        <Box
                            sx={{
                                display: 'grid',
                                gap: 3,
                                gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
                                alignItems: 'stretch',
                            }}
                        >
                            <Card
                                sx={{
                                    minHeight: { xs: 'auto', md: 640 },
                                    color: '#fff',
                                    background:
                                        'linear-gradient(145deg, #0369a1 0%, #0ea5e9 36%, #1e3a8a 100%)',
                                    overflow: 'hidden',
                                    position: 'relative',
                                }}
                            >
                                <CardContent
                                    sx={{
                                        height: '100%',
                                        p: { xs: 3, md: 5 },
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        '&:last-child': { pb: { xs: 3, md: 5 } },
                                    }}
                                >
                                    <Stack spacing={3}>
                                        <Box>
                                            <Typography
                                                variant="overline"
                                                sx={{ letterSpacing: 2.4, opacity: 0.82 }}
                                            >
                                                Espace Eleve
                                            </Typography>
                                            <Typography
                                                variant="h2"
                                                sx={{
                                                    mt: 1.5,
                                                    fontSize: { xs: '2.2rem', md: '3rem' },
                                                    lineHeight: 1.05,
                                                    maxWidth: 520,
                                                }}
                                            >
                                                Rejoignez votre portail scolaire avec un acces simple et securise.
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{ mt: 2.5, maxWidth: 520, opacity: 0.88 }}
                                            >
                                                Connectez-vous avec votre compte eleve pour ouvrir le dashboard
                                                existant et retrouver vos outils deja disponibles.
                                            </Typography>
                                        </Box>

                                        <Stack spacing={2}>
                                            {highlights.map((item) => (
                                                <Box
                                                    key={item.title}
                                                    sx={{
                                                        display: 'flex',
                                                        gap: 2,
                                                        alignItems: 'flex-start',
                                                        borderRadius: 3,
                                                        px: 2,
                                                        py: 1.75,
                                                        bgcolor: 'rgba(255,255,255,0.12)',
                                                        backdropFilter: 'blur(10px)',
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 44,
                                                            height: 44,
                                                            borderRadius: 2,
                                                            display: 'grid',
                                                            placeItems: 'center',
                                                            bgcolor: 'rgba(255,255,255,0.14)',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {item.icon}
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="h6">{item.title}</Typography>
                                                        <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.82 }}>
                                                            {item.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Stack>

                                    <Box
                                        sx={{
                                            mt: 4,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 2,
                                            color: 'rgba(255,255,255,0.78)',
                                        }}
                                    >
                                        <Typography variant="body2">
                                            Authentification Laravel existante
                                        </Typography>
                                        <Typography variant="body2">
                                            Controle backend du role eleve
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            <Card
                                sx={{
                                    minHeight: { xs: 'auto', md: 640 },
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: 4,
                                }}
                            >
                                <CardContent
                                    sx={{
                                        width: '100%',
                                        p: { xs: 3, sm: 4, md: 5 },
                                        '&:last-child': { pb: { xs: 3, sm: 4, md: 5 } },
                                    }}
                                >
                                    <Stack spacing={1.5} sx={{ mb: 4 }}>
                                        <Chip
                                            label="Connexion eleve"
                                            color="info"
                                            variant="outlined"
                                            sx={{ alignSelf: 'flex-start' }}
                                        />
                                        <Typography variant="h4">Se connecter</Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            Utilisez vos identifiants existants. Les comptes non eleves
                                            sont refuses dans cet espace.
                                        </Typography>
                                    </Stack>

                                    <Box
                                        component="form"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            form.post('/student-access', {
                                                onSuccess: () => form.reset('password'),
                                            });
                                        }}
                                    >
                                        <Stack spacing={3}>
                                            {status ? <Alert severity="success">{status}</Alert> : null}

                                            <TextField
                                                label="Adresse e-mail"
                                                type="email"
                                                name="email"
                                                autoComplete="email"
                                                autoFocus
                                                fullWidth
                                                value={form.data.email}
                                                onChange={(event) => form.setData('email', event.target.value)}
                                                error={Boolean(form.errors.email)}
                                                helperText={form.errors.email}
                                                placeholder="eleve@ecole.com"
                                            />

                                            <TextField
                                                label="Mot de passe"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                autoComplete="current-password"
                                                fullWidth
                                                value={form.data.password}
                                                onChange={(event) => form.setData('password', event.target.value)}
                                                error={Boolean(form.errors.password)}
                                                helperText={form.errors.password}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                edge="end"
                                                                onClick={() =>
                                                                    setShowPassword((value) => !value)
                                                                }
                                                            >
                                                                {showPassword ? (
                                                                    <VisibilityOffRoundedIcon />
                                                                ) : (
                                                                    <VisibilityRoundedIcon />
                                                                )}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />

                                            <Button
                                                type="submit"
                                                variant="contained"
                                                size="large"
                                                fullWidth
                                                disabled={form.processing}
                                                sx={{ py: 1.4 }}
                                            >
                                                {form.processing ? (
                                                    <CircularProgress
                                                        size={20}
                                                        sx={{ color: 'inherit', mr: 1 }}
                                                    />
                                                ) : null}
                                                Entrer dans l'espace eleve
                                            </Button>

                                            <Stack
                                                direction={{ xs: 'column', sm: 'row' }}
                                                spacing={1}
                                                justifyContent="space-between"
                                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                            >
                                                <Typography variant="body2" color="text.secondary">
                                                    Acces reserve aux eleves autorises.
                                                </Typography>

                                                {canResetPassword ? (
                                                    <MuiLink
                                                        component={Link}
                                                        href={request()}
                                                        underline="hover"
                                                    >
                                                        Mot de passe oublie ?
                                                    </MuiLink>
                                                ) : null}
                                            </Stack>
                                        </Stack>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    </Stack>
                </Container>
            </Box>
        </>
    );
}

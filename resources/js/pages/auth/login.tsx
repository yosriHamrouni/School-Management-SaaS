import { Head, Link, useForm } from '@inertiajs/react';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Link as MuiLink,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    return (
        <AuthLayout
            title="Sign in to your workspace"
            description="Access the academic administration platform with your existing account."
        >
            <Head title="Log in" />

            <Box
                component="form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(store().url, {
                        onSuccess: () => form.reset('password'),
                    });
                }}
            >
                <Stack spacing={3}>
                    {status ? <Alert severity="success">{status}</Alert> : null}

                    <TextField
                        label="Email address"
                        type="email"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        fullWidth
                        value={form.data.email}
                        onChange={(event) =>
                            form.setData('email', event.target.value)
                        }
                        error={Boolean(form.errors.email)}
                        helperText={form.errors.email}
                        placeholder="name@school.com"
                    />

                    <TextField
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete="current-password"
                        fullWidth
                        value={form.data.password}
                        onChange={(event) =>
                            form.setData('password', event.target.value)
                        }
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

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={1.5}
                    >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={form.data.remember}
                                    onChange={(event) =>
                                        form.setData(
                                            'remember',
                                            event.target.checked,
                                        )
                                    }
                                />
                            }
                            label="Remember me"
                        />

                        {canResetPassword ? (
                            <MuiLink
                                component={Link}
                                href={request()}
                                underline="hover"
                                color="primary.main"
                            >
                                Forgot password?
                            </MuiLink>
                        ) : null}
                    </Stack>

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={form.processing}
                        data-test="login-button"
                    >
                        {form.processing ? (
                            <CircularProgress
                                size={20}
                                sx={{ color: 'inherit', mr: 1 }}
                            />
                        ) : null}
                        Sign in
                    </Button>

                    {canRegister ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            textAlign="center"
                        >
                            Don&apos;t have an account?{' '}
                            <MuiLink
                                component={Link}
                                href={register()}
                                underline="hover"
                            >
                                Create one
                            </MuiLink>
                        </Typography>
                    ) : null}
                </Stack>
            </Box>
        </AuthLayout>
    );
}

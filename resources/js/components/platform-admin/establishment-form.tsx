import {
    Box,
    Button,
    FormControlLabel,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import type { FormEvent } from 'react';

type EstablishmentFormData = {
    name: string;
    code: string;
    type: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    director_name: string;
    is_active: boolean;
};

type EstablishmentFormProps = {
    data: EstablishmentFormData;
    errors: Record<string, string | undefined>;
    processing: boolean;
    submitLabel: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    setData: {
        (key: 'name', value: string): void;
        (key: 'code', value: string): void;
        (key: 'type', value: string): void;
        (key: 'address', value: string): void;
        (key: 'city', value: string): void;
        (key: 'phone', value: string): void;
        (key: 'email', value: string): void;
        (key: 'director_name', value: string): void;
        (key: 'is_active', value: boolean): void;
    };
};

export default function EstablishmentForm({
    data,
    errors,
    processing,
    submitLabel,
    onSubmit,
    setData,
}: EstablishmentFormProps) {
    return (
        <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={4}>
                <Box>
                    <Typography variant="h6">Establishment details</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Capture the core identity, contact details and operational
                        status for this tenant.
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                    }}
                >
                    <TextField
                        label="Name"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        error={Boolean(errors.name)}
                        helperText={errors.name}
                        placeholder="Establishment name"
                        fullWidth
                    />

                    <TextField
                        label="Code"
                        value={data.code}
                        onChange={(event) => setData('code', event.target.value)}
                        error={Boolean(errors.code)}
                        helperText={errors.code}
                        placeholder="EST-001"
                        fullWidth
                    />

                    <TextField
                        label="Type"
                        value={data.type}
                        onChange={(event) => setData('type', event.target.value)}
                        error={Boolean(errors.type)}
                        helperText={errors.type}
                        placeholder="School"
                        fullWidth
                    />

                    <TextField
                        label="City"
                        value={data.city}
                        onChange={(event) => setData('city', event.target.value)}
                        error={Boolean(errors.city)}
                        helperText={errors.city}
                        placeholder="Tunis"
                        fullWidth
                    />

                    <TextField
                        label="Phone"
                        value={data.phone}
                        onChange={(event) => setData('phone', event.target.value)}
                        error={Boolean(errors.phone)}
                        helperText={errors.phone}
                        placeholder="+216 00 000 000"
                        fullWidth
                    />

                    <TextField
                        label="Email"
                        type="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                        placeholder="contact@establishment.test"
                        fullWidth
                    />

                    <TextField
                        label="Director name"
                        value={data.director_name}
                        onChange={(event) =>
                            setData('director_name', event.target.value)
                        }
                        error={Boolean(errors.director_name)}
                        helperText={errors.director_name}
                        placeholder="Director full name"
                        fullWidth
                        sx={{ gridColumn: { md: 'span 2' } }}
                    />

                    <TextField
                        label="Address"
                        value={data.address}
                        onChange={(event) => setData('address', event.target.value)}
                        error={Boolean(errors.address)}
                        helperText={errors.address}
                        placeholder="Full address"
                        multiline
                        minRows={4}
                        fullWidth
                        sx={{ gridColumn: { md: 'span 2' } }}
                    />
                </Box>

                <Box
                    sx={{
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 3,
                        px: 2,
                        py: 1.5,
                    }}
                >
                    <FormControlLabel
                        control={
                            <Switch
                                checked={data.is_active}
                                onChange={(event) =>
                                    setData('is_active', event.target.checked)
                                }
                            />
                        }
                        label="Establishment is active"
                    />
                    {errors.is_active ? (
                        <Typography variant="caption" color="error.main">
                            {errors.is_active}
                        </Typography>
                    ) : null}
                </Box>

                <Stack direction="row" justifyContent="flex-end">
                    <Button type="submit" variant="contained" disabled={processing}>
                        {submitLabel}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}

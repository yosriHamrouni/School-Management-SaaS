import { Alert, Stack } from '@mui/material';

type FlashAlertsProps = {
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

export default function FlashAlerts({ flash }: FlashAlertsProps) {
    if (!flash?.success && !flash?.error) {
        return null;
    }

    return (
        <Stack spacing={2}>
            {flash?.success ? (
                <Alert severity="success">{flash.success}</Alert>
            ) : null}
            {flash?.error ? <Alert severity="error">{flash.error}</Alert> : null}
        </Stack>
    );
}

import { Button, Snackbar } from '@mui/material';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PwaUpdatePrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisterError(error) {
            console.error('Service worker registration failed', error);
        },
    });

    return (
        <Snackbar
            open={needRefresh}
            message="A new version is available."
            action={
                <>
                    <Button color="inherit" onClick={() => setNeedRefresh(false)}>
                        Later
                    </Button>
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={() => void updateServiceWorker(true)}
                    >
                        Update
                    </Button>
                </>
            }
        />
    );
}

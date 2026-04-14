import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { Box, Button, Stack, TextField } from '@mui/material';

type Props = {
    content: string;
    disabled: boolean;
    error?: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
};

export default function MessageComposer({
    content,
    disabled,
    error,
    onChange,
    onSubmit,
}: Props) {
    return (
        <Box sx={{ p: 2.5 }}>
            <Stack spacing={2}>
                <TextField
                    label="Votre message"
                    multiline
                    minRows={3}
                    value={content}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Redigez un message clair et professionnel."
                    error={Boolean(error)}
                    helperText={error}
                />
                <Stack direction="row" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        endIcon={<SendRoundedIcon />}
                        onClick={onSubmit}
                        disabled={disabled}
                    >
                        Envoyer
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}

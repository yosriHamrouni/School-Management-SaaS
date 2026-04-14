import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import type { ConversationMessage } from '@/components/messaging/types';

type Props = {
    authUserId: number;
    messages: ConversationMessage[];
};

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
});

export default function MessageThread({ authUserId, messages }: Props) {
    if (messages.length === 0) {
        return (
            <Box
                sx={{
                    minHeight: 280,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Stack spacing={1.5} alignItems="center">
                    <MailOutlineRoundedIcon color="disabled" sx={{ fontSize: 40 }} />
                    <Typography variant="body2" color="text.secondary">
                        Aucun message dans cette conversation pour le moment.
                    </Typography>
                </Stack>
            </Box>
        );
    }

    return (
        <Stack spacing={2}>
            {messages.map((message) => {
                const isOwnMessage = message.sender.id === authUserId;

                return (
                    <Stack
                        key={message.id}
                        direction={isOwnMessage ? 'row-reverse' : 'row'}
                        spacing={1.5}
                        alignItems="flex-end"
                    >
                        <Avatar
                            sx={{
                                bgcolor: isOwnMessage
                                    ? 'primary.main'
                                    : 'secondary.main',
                            }}
                        >
                            {message.sender.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box
                            sx={{
                                maxWidth: '80%',
                                borderRadius: 3,
                                px: 2,
                                py: 1.5,
                                bgcolor: isOwnMessage
                                    ? 'primary.main'
                                    : 'background.paper',
                                color: isOwnMessage
                                    ? 'primary.contrastText'
                                    : 'text.primary',
                                border: isOwnMessage ? 'none' : 1,
                                borderColor: 'divider',
                            }}
                        >
                            <Typography variant="body1">{message.content}</Typography>
                            <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="space-between"
                                sx={{ mt: 1.25 }}
                            >
                                <Typography
                                    variant="caption"
                                    color={isOwnMessage ? 'inherit' : 'text.secondary'}
                                >
                                    {message.created_at
                                        ? dateTimeFormatter.format(
                                              new Date(message.created_at),
                                          )
                                        : ''}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color={isOwnMessage ? 'inherit' : 'text.secondary'}
                                >
                                    {isOwnMessage
                                        ? message.read_at
                                            ? 'Lu'
                                            : 'Non lu'
                                        : message.read_at
                                          ? 'Lu'
                                          : 'A lire'}
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>
                );
            })}
        </Stack>
    );
}

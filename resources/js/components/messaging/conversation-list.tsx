import { Link } from '@inertiajs/react';
import {
    Box,
    Chip,
    Divider,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import type { ConversationSummary } from '@/components/messaging/types';

type Props = {
    conversations: ConversationSummary[];
    selectedParticipantId?: number | null;
};

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
});

export default function ConversationList({
    conversations,
    selectedParticipantId,
}: Props) {
    return (
        <Paper
            variant="outlined"
            sx={{
                width: { xs: '100%', lg: 360 },
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Conversations
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Les echanges les plus recents remontent en premier.
                </Typography>
            </Box>
            <Divider />
            <List sx={{ p: 0 }}>
                {conversations.length > 0 ? (
                    conversations.map((conversation) => (
                        <ListItemButton
                            key={conversation.participant.id}
                            component={Link}
                            href={`/messaging/${conversation.participant.id}`}
                            selected={
                                conversation.participant.id === selectedParticipantId
                            }
                            sx={{ alignItems: 'flex-start', py: 1.75 }}
                        >
                            <ListItemText
                                primary={conversation.participant.name}
                                primaryTypographyProps={{ fontWeight: 700 }}
                                secondary={
                                    <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {conversation.last_message.content}
                                        </Typography>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                        >
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {conversation.last_message.created_at
                                                    ? dateTimeFormatter.format(
                                                          new Date(
                                                              conversation.last_message.created_at,
                                                          ),
                                                      )
                                                    : ''}
                                            </Typography>
                                            {conversation.unread_count > 0 ? (
                                                <Chip
                                                    size="small"
                                                    color="primary"
                                                    label={`${conversation.unread_count} non lu(s)`}
                                                />
                                            ) : null}
                                        </Stack>
                                    </Stack>
                                }
                            />
                        </ListItemButton>
                    ))
                ) : (
                    <Box sx={{ px: 2, py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Aucune conversation pour le moment.
                        </Typography>
                    </Box>
                )}
            </List>
        </Paper>
    );
}

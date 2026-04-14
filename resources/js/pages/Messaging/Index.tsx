import { Head, router, useForm, usePage } from '@inertiajs/react';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect } from 'react';
import ConversationList from '@/components/messaging/conversation-list';
import MessageComposer from '@/components/messaging/message-composer';
import MessageThread from '@/components/messaging/message-thread';
import type {
    ConversationMessage,
    ConversationSummary,
    RecipientOption,
} from '@/components/messaging/types';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    conversations: ConversationSummary[];
    selectedConversation: {
        participant: RecipientOption;
        messages: ConversationMessage[];
    } | null;
    recipientOptions: RecipientOption[];
    auth: {
        user: {
            id: number;
        };
    };
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    errors: {
        content?: string;
        receiver_id?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Messagerie', href: '/messaging' },
];

export default function MessagingIndex({
    conversations,
    selectedConversation,
    recipientOptions,
    auth,
}: Props) {
    const { flash, errors } = usePage<Props>().props;
    const { data, setData, post, processing, reset } = useForm({
        receiver_id: selectedConversation?.participant.id
            ? String(selectedConversation.participant.id)
            : '',
        content: '',
    });

    const selectedConversationSummary = conversations.find(
        (conversation) =>
            conversation.participant.id === selectedConversation?.participant.id,
    );

    useEffect(() => {
        if (!auth.user?.id || !window.Echo) {
            return;
        }

        const channelName = `users.${auth.user.id}`;
        const channel = window.Echo.private(channelName);

        channel.listen('.message.sent', () => {
            router.reload({
                only: ['conversations', 'selectedConversation'],
            });
        });

        return () => {
            window.Echo?.leave(channelName);
        };
    }, [auth.user?.id]);

    const submitMessage = () => {
        if (!data.receiver_id || !data.content.trim()) {
            return;
        }

        post('/messaging', {
            preserveScroll: true,
            onSuccess: () => reset('content'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Messagerie" />

            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Messagerie interne
                    </Typography>
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        Centralisez les echanges entre enseignants, eleves,
                        parents et administration de votre etablissement.
                    </Typography>
                </Box>

                {flash?.success ? (
                    <Alert severity="success">{flash.success}</Alert>
                ) : null}
                {flash?.error ? (
                    <Alert severity="error">{flash.error}</Alert>
                ) : null}

                <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    spacing={3}
                    alignItems="stretch"
                >
                    <ConversationList
                        conversations={conversations}
                        selectedParticipantId={
                            selectedConversation?.participant.id ?? null
                        }
                    />

                    <Paper
                        variant="outlined"
                        sx={{
                            flex: 1,
                            minHeight: 640,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                p: 2.5,
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 2,
                                justifyContent: 'space-between',
                            }}
                        >
                            <Box>
                                <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 700 }}
                                >
                                    {selectedConversation?.participant.name ??
                                        'Nouvelle conversation'}
                                </Typography>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{ mt: 1, flexWrap: 'wrap' }}
                                >
                                    {(selectedConversation?.participant.roles ?? []).map(
                                        (role) => (
                                            <Chip
                                                key={role}
                                                size="small"
                                                variant="outlined"
                                                label={role}
                                            />
                                        ),
                                    )}
                                </Stack>
                            </Box>

                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1.5}
                            >
                                <TextField
                                    select
                                    label="Destinataire"
                                    value={data.receiver_id}
                                    onChange={(event) => {
                                        const nextValue = event.target.value;
                                        setData('receiver_id', nextValue);

                                        if (nextValue) {
                                            router.get(`/messaging/${nextValue}`);
                                        }
                                    }}
                                    sx={{ minWidth: { xs: '100%', sm: 260 } }}
                                    error={Boolean(errors.receiver_id)}
                                    helperText={errors.receiver_id}
                                >
                                    {recipientOptions.map((recipient) => (
                                        <MenuItem
                                            key={recipient.id}
                                            value={String(recipient.id)}
                                        >
                                            {recipient.name}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                {selectedConversation?.participant.id &&
                                selectedConversationSummary?.unread_count ? (
                                    <Button
                                        variant="outlined"
                                        startIcon={<MarkEmailReadRoundedIcon />}
                                        onClick={() =>
                                            router.patch(
                                                `/messaging/${selectedConversation.participant.id}/read`,
                                            )
                                        }
                                    >
                                        Marquer comme lu
                                    </Button>
                                ) : null}
                            </Stack>
                        </Box>

                        <Divider />

                        <Box
                            sx={{
                                flex: 1,
                                px: 2.5,
                                py: 3,
                                bgcolor: 'background.default',
                                overflowY: 'auto',
                            }}
                        >
                            {selectedConversation ? (
                                <MessageThread
                                    authUserId={auth.user.id}
                                    messages={selectedConversation.messages}
                                />
                            ) : (
                                <Box
                                    sx={{
                                        minHeight: 280,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Stack spacing={1.5} alignItems="center">
                                        <MailOutlineRoundedIcon
                                            color="disabled"
                                            sx={{ fontSize: 40 }}
                                        />
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Selectionnez un destinataire pour
                                            commencer a ecrire.
                                        </Typography>
                                    </Stack>
                                </Box>
                            )}
                        </Box>

                        <Divider />

                        <MessageComposer
                            content={data.content}
                            disabled={
                                processing ||
                                !data.receiver_id ||
                                !data.content.trim()
                            }
                            error={errors.content}
                            onChange={(value) => setData('content', value)}
                            onSubmit={submitMessage}
                        />
                    </Paper>
                </Stack>
            </Stack>
        </AppLayout>
    );
}

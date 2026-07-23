import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    List,
    ListItemButton,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Message = {
    id: number | string;
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
    metadata?: Record<string, unknown> | null;
    pending?: boolean;
};

type Conversation = {
    id: number;
    title: string | null;
    messages?: Message[];
    created_at?: string;
    updated_at?: string;
};

type Props = {
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    errors: {
        question?: string;
        conversation_id?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Assistant academique', href: '/academic-assistant' },
];

export default function AcademicAssistantIndex({
    conversations,
    selectedConversation,
}: Props) {
    const { flash, errors } = usePage<Props>().props;
    const [currentConversation, setCurrentConversation] =
        useState<Conversation | null>(selectedConversation);
    const [conversationsList, setConversationsList] =
        useState<Conversation[]>(conversations);
    const [question, setQuestion] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const messages = currentConversation?.messages ?? [];

    useEffect(() => {
        setCurrentConversation(selectedConversation);
    }, [selectedConversation]);

    useEffect(() => {
        setConversationsList(conversations);
    }, [conversations]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentConversation?.messages?.length]);

    const startNewConversation = () => {
        setCurrentConversation(null);
        setQuestion('');
        setError(null);
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();

        const trimmedQuestion = question.trim();

        if (!trimmedQuestion || isSending) {
            return;
        }

        const activeConversationId =
            currentConversation?.id && currentConversation.id !== 0
                ? currentConversation.id
                : null;
        const temporaryStamp = Date.now();
        const temporaryUserMessage: Message = {
            id: `temp-user-${temporaryStamp}`,
            role: 'user',
            content: trimmedQuestion,
            pending: true,
        };
        const temporaryAssistantMessage: Message = {
            id: `temp-assistant-${temporaryStamp}`,
            role: 'assistant',
            content: 'Réflexion en cours...',
            pending: true,
        };

        setQuestion('');
        setIsSending(true);
        setError(null);
        setCurrentConversation((previous) => {
            if (!previous) {
                return {
                    id: 0,
                    title: trimmedQuestion.slice(0, 50),
                    messages: [temporaryUserMessage, temporaryAssistantMessage],
                };
            }

            return {
                ...previous,
                messages: [
                    ...(previous.messages ?? []),
                    temporaryUserMessage,
                    temporaryAssistantMessage,
                ],
            };
        });

        try {
            const { data: result } = await axios.post(
                '/academic-assistant/messages',
                {
                    question: trimmedQuestion,
                    conversation_id: activeConversationId,
                },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            setCurrentConversation(result.conversation);
            setConversationsList((previous) => {
                const exists = previous.some(
                    (item) => item.id === result.conversation.id,
                );

                if (exists) {
                    return previous.map((item) =>
                        item.id === result.conversation.id
                            ? result.conversation
                            : item,
                    );
                }

                return [result.conversation, ...previous];
            });
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Impossible d'envoyer le message. Reessaie.",
            );
            setCurrentConversation((previous) => {
                if (!previous) {
                    return previous;
                }

                return {
                    ...previous,
                    messages: (previous.messages ?? []).map((message) => {
                        if (message.id === temporaryUserMessage.id) {
                            return {
                                ...message,
                                pending: false,
                            };
                        }

                        if (message.id === temporaryAssistantMessage.id) {
                            return {
                                ...message,
                                content:
                                    'Une erreur est survenue. Réessaie dans quelques instants.',
                                pending: false,
                            };
                        }

                        return message;
                    }),
                };
            });
            setQuestion(trimmedQuestion);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assistant academique" />

            <Stack spacing={3}>
                <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <AutoAwesomeRoundedIcon color="primary" />
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            Assistant academique
                        </Typography>
                    </Stack>
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        Posez une question sur les notes, absences, retards,
                        classes ou eleves a risque. Les reponses respectent
                        votre perimetre d acces.
                    </Typography>
                </Box>

                {flash?.success ? (
                    <Alert severity="success">{flash.success}</Alert>
                ) : null}
                {flash?.error ? (
                    <Alert severity="error">{flash.error}</Alert>
                ) : null}
                {errors.conversation_id ? (
                    <Alert severity="error">{errors.conversation_id}</Alert>
                ) : null}
                {error ? <Alert severity="error">{error}</Alert> : null}

                <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    spacing={3}
                    alignItems="stretch"
                >
                    <Paper
                        variant="outlined"
                        sx={{
                            width: { xs: '100%', lg: 320 },
                            minHeight: { xs: 'auto', lg: 640 },
                            overflow: 'hidden',
                        }}
                    >
                        <Box sx={{ p: 2.5 }}>
                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 700 }}
                            >
                                Conversations
                            </Typography>
                            <Button
                                onClick={startNewConversation}
                                variant="outlined"
                                size="small"
                                sx={{ mt: 2 }}
                                fullWidth
                            >
                                Nouvelle conversation
                            </Button>
                        </Box>
                        <Divider />
                        <List disablePadding>
                            {conversationsList.length === 0 ? (
                                <Box sx={{ p: 2.5 }}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Aucune conversation pour le moment.
                                    </Typography>
                                </Box>
                            ) : (
                                conversationsList.map((conversation) => {
                                    const latestMessage = conversation.messages
                                        ?.length
                                        ? conversation.messages[
                                              conversation.messages.length - 1
                                          ]
                                        : undefined;

                                    return (
                                        <ListItemButton
                                            key={conversation.id}
                                            selected={
                                                conversation.id ===
                                                currentConversation?.id
                                            }
                                            href={`/academic-assistant/conversations/${conversation.id}`}
                                            component={Link}
                                            sx={{
                                                alignItems: 'flex-start',
                                                py: 1.5,
                                            }}
                                        >
                                            <Stack
                                                spacing={0.5}
                                                sx={{ minWidth: 0 }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 700,
                                                        overflow: 'hidden',
                                                        textOverflow:
                                                            'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {conversation.title ??
                                                        'Conversation'}
                                                </Typography>
                                                {latestMessage ? (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{
                                                            display:
                                                                '-webkit-box',
                                                            WebkitBoxOrient:
                                                                'vertical',
                                                            WebkitLineClamp: 2,
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {latestMessage.content}
                                                    </Typography>
                                                ) : null}
                                            </Stack>
                                        </ListItemButton>
                                    );
                                })
                            )}
                        </List>
                    </Paper>

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
                        <Box sx={{ p: 2.5 }}>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                justifyContent="space-between"
                                spacing={1.5}
                            >
                                <Box>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        {currentConversation?.title ??
                                            'Nouvelle question'}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Assistant IA local avec fallback
                                        rule-based securise.
                                    </Typography>
                                </Box>
                                <Chip
                                    icon={<ForumRoundedIcon />}
                                    label={`${messages.length} message(s)`}
                                    variant="outlined"
                                />
                            </Stack>
                        </Box>

                        <Divider />

                        <Box
                            sx={{
                                flex: 1,
                                minHeight: 0,
                                px: { xs: 2, md: 3 },
                                py: 3,
                                bgcolor: 'background.default',
                                overflowY: 'auto',
                            }}
                        >
                            {messages.length > 0 ? (
                                <Stack spacing={2}>
                                    {messages.map((message) => {
                                        const isUser = message.role === 'user';

                                        return (
                                            <Box
                                                key={message.id}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: isUser
                                                        ? 'flex-end'
                                                        : 'flex-start',
                                                }}
                                            >
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        maxWidth: {
                                                            xs: '100%',
                                                            md: '78%',
                                                        },
                                                        p: 2,
                                                        borderRadius: 2,
                                                        opacity: message.pending
                                                            ? 0.7
                                                            : 1,
                                                        bgcolor: isUser
                                                            ? 'primary.main'
                                                            : 'background.paper',
                                                        color: isUser
                                                            ? 'primary.contrastText'
                                                            : 'text.primary',
                                                        border: isUser
                                                            ? 0
                                                            : '1px solid',
                                                        borderColor: 'divider',
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ opacity: 0.75 }}
                                                    >
                                                        {isUser
                                                            ? 'Vous'
                                                            : 'Assistant'}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            mt: 0.75,
                                                            whiteSpace:
                                                                'pre-wrap',
                                                        }}
                                                    >
                                                        {message.content}
                                                    </Typography>
                                                </Paper>
                                            </Box>
                                        );
                                    })}
                                    <Box ref={messagesEndRef} />
                                </Stack>
                            ) : (
                                <Box
                                    sx={{
                                        minHeight: 360,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Stack spacing={1.5} alignItems="center">
                                        <AutoAwesomeRoundedIcon
                                            color="disabled"
                                            sx={{ fontSize: 44 }}
                                        />
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Demandez par exemple : Quelle est la
                                            moyenne ? Combien d absences ? Quels
                                            eleves sont a risque ?
                                        </Typography>
                                    </Stack>
                                </Box>
                            )}
                        </Box>

                        <Divider />

                        <Box component="form" onSubmit={submit} sx={{ p: 2.5 }}>
                            <Stack spacing={1.5}>
                                <TextField
                                    label="Votre question"
                                    value={question}
                                    onChange={(event) =>
                                        setQuestion(event.target.value)
                                    }
                                    multiline
                                    minRows={3}
                                    error={Boolean(errors.question)}
                                    helperText={errors.question}
                                    fullWidth
                                />
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        endIcon={<SendRoundedIcon />}
                                        disabled={isSending || !question.trim()}
                                    >
                                        {isSending ? 'Envoi...' : 'Envoyer'}
                                    </Button>
                                </Box>
                            </Stack>
                        </Box>
                    </Paper>
                </Stack>
            </Stack>
        </AppLayout>
    );
}

import { Link, router, usePage } from '@inertiajs/react';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import {
    Badge,
    Box,
    Button,
    Divider,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Menu,
    Stack,
    Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from '@/i18n';

type NotificationItem = {
    id: string;
    title: string;
    body: string | null;
    category: string;
    action_url: string | null;
    read_at: string | null;
    created_at: string | null;
};

type SharedProps = {
    notificationCenter: {
        unread_count: number;
        recent: NotificationItem[];
    };
};

const dateLocales = {
    ar: 'ar-TN',
    en: 'en-US',
    fr: 'fr-FR',
};

export default function NotificationMenu() {
    const { notificationCenter } = usePage<SharedProps>().props;
    const { locale, t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(dateLocales[locale], {
                dateStyle: 'short',
                timeStyle: 'short',
            }),
        [locale],
    );

    const recentNotifications = useMemo(
        () => notificationCenter?.recent ?? [],
        [notificationCenter],
    );

    return (
        <>
            <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
                <Badge
                    color="error"
                    badgeContent={notificationCenter?.unread_count ?? 0}
                >
                    <NotificationsRoundedIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { width: 380, maxWidth: 'calc(100vw - 24px)' } }}
            >
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {t('notifications.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('notifications.unread', {
                            count: notificationCenter?.unread_count ?? 0,
                        })}
                    </Typography>
                </Box>

                <Divider />

                {recentNotifications.length > 0 ? (
                    <List sx={{ py: 0 }}>
                        {recentNotifications.map((notification) => (
                            <ListItemButton
                                key={notification.id}
                                onClick={() => {
                                    if (! notification.read_at) {
                                        router.patch(
                                            `/notifications/${notification.id}`,
                                            {},
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    if (notification.action_url) {
                                                        router.visit(notification.action_url);
                                                    }
                                                },
                                            },
                                        );

                                        return;
                                    }

                                    if (notification.action_url) {
                                        router.visit(notification.action_url);
                                    }
                                }}
                                sx={{
                                    alignItems: 'flex-start',
                                    gap: 1.5,
                                    bgcolor: notification.read_at ? 'transparent' : 'action.hover',
                                }}
                            >
                                <ListItemText
                                    primary={notification.title}
                                    primaryTypographyProps={{ fontWeight: notification.read_at ? 500 : 700 }}
                                    secondary={
                                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                            {notification.body ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    {notification.body}
                                                </Typography>
                                            ) : null}
                                            <Typography variant="caption" color="text.secondary">
                                                {notification.created_at
                                                    ? dateFormatter.format(new Date(notification.created_at))
                                                    : ''}
                                            </Typography>
                                        </Stack>
                                    }
                                />
                            </ListItemButton>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ px: 2, py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            {t('notifications.empty')}
                        </Typography>
                    </Box>
                )}

                <Divider />

                <Box sx={{ p: 1.5 }}>
                    <Button
                        component={Link}
                        href="/notifications"
                        fullWidth
                        onClick={() => setAnchorEl(null)}
                    >
                        {t('notifications.viewAll')}
                    </Button>
                </Box>
            </Menu>
        </>
    );
}

import { Head, Link } from '@inertiajs/react';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import {
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type NotificationRow = {
    id: string;
    title: string;
    body: string | null;
    category: string;
    action_url: string | null;
    read_at: string | null;
    created_at: string | null;
};

type Props = {
    notifications: {
        data: NotificationRow[];
        links: PaginationLink[];
    };
    unreadCount: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Notifications', href: '/notifications' },
];

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
});

export default function NotificationsIndex({
    notifications,
    unreadCount,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />

            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Notifications
                    </Typography>
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        Suivez les evenements importants et marquez les alertes
                        traitees comme lues.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip color="primary" label={`${unreadCount} non lue(s)`} />
                    <Chip
                        variant="outlined"
                        label={`${notifications.data.length} element(s) sur cette page`}
                    />
                </Stack>

                <Stack spacing={2}>
                    {notifications.data.length > 0 ? (
                        notifications.data.map((notification) => (
                            <Paper
                                key={notification.id}
                                variant="outlined"
                                sx={{
                                    p: 2.5,
                                    borderColor: notification.read_at
                                        ? 'divider'
                                        : 'primary.main',
                                }}
                            >
                                <Stack
                                    direction={{ xs: 'column', md: 'row' }}
                                    spacing={2}
                                    justifyContent="space-between"
                                >
                                    <Stack spacing={1.25}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            flexWrap="wrap"
                                        >
                                            <Typography
                                                variant="subtitle1"
                                                sx={{ fontWeight: 700 }}
                                            >
                                                {notification.title}
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label={notification.category}
                                                variant="outlined"
                                            />
                                            {!notification.read_at ? (
                                                <Chip
                                                    size="small"
                                                    color="primary"
                                                    label="Non lue"
                                                />
                                            ) : null}
                                        </Stack>

                                        {notification.body ? (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {notification.body}
                                            </Typography>
                                        ) : null}

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {notification.created_at
                                                ? dateTimeFormatter.format(
                                                      new Date(
                                                          notification.created_at,
                                                      ),
                                                  )
                                                : ''}
                                        </Typography>
                                    </Stack>

                                    <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        spacing={1.25}
                                    >
                                        {notification.action_url ? (
                                            <Button
                                                component={Link}
                                                href={notification.action_url}
                                                variant="outlined"
                                            >
                                                Ouvrir
                                            </Button>
                                        ) : null}
                                        {!notification.read_at ? (
                                            <Button
                                                component={Link}
                                                href={`/notifications/${notification.id}`}
                                                method="patch"
                                                as="button"
                                                preserveScroll
                                                variant="contained"
                                            >
                                                Marquer comme lue
                                            </Button>
                                        ) : null}
                                    </Stack>
                                </Stack>
                            </Paper>
                        ))
                    ) : (
                        <Paper
                            variant="outlined"
                            sx={{
                                minHeight: 240,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Stack spacing={1.5} alignItems="center">
                                <NotificationsActiveRoundedIcon
                                    color="disabled"
                                    sx={{ fontSize: 40 }}
                                />
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Aucune notification enregistree.
                                </Typography>
                            </Stack>
                        </Paper>
                    )}
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {notifications.links.map((link, index) =>
                        link.url ? (
                            <Button
                                key={`${link.label}-${index}`}
                                component={Link}
                                href={link.url}
                                preserveScroll
                                variant={link.active ? 'contained' : 'outlined'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <Button
                                key={`${link.label}-${index}`}
                                disabled
                                variant="outlined"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ),
                    )}
                </Stack>
            </Stack>
        </AppLayout>
    );
}

import { Head, Link, usePage } from '@inertiajs/react';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import CalendarViewWeekRoundedIcon from '@mui/icons-material/CalendarViewWeekRounded';
import ClassRoundedIcon from '@mui/icons-material/ClassRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Stack,
    Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import ParentDashboard from '@/components/parent-dashboard';
import type {ParentDashboardData} from '@/components/parent-dashboard';
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/stat-card';
import type { StatCardProps } from '@/components/ui/stat-card';
import { useTranslation } from '@/i18n';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { Auth, BreadcrumbItem } from '@/types';

type DashboardStats = {
    atRiskStudents?: number | null;
    classes?: number | null;
    establishments?: number | null;
    invoices?: number | null;
    parents?: number | null;
    payments?: number | null;
    students?: number | null;
    teachers?: number | null;
    users?: number | null;
};

type SharedPageProps = {
    auth: Auth;
    dashboardStats?: DashboardStats;
    studentDashboard?: StudentDashboardData;
    parentDashboard?: ParentDashboardData;
};

type QuickAction = {
    title: string;
    description: string;
    href: string;
    icon: ReactNode;
    visible: boolean;
};

type StudentDashboardData = {
    profile: {
        name: string;
        email: string;
        class_name?: string | null;
        establishment_name?: string | null;
        role: string;
    };
    todaySchedule: StudentScheduleItem[];
    assignments: StudentAssignmentItem[];
    notifications: {
        unread_count: number;
        recent: StudentNotificationItem[];
    };
    messages: {
        unread_count: number;
        recent: StudentConversationItem[];
    };
    summary: {
        assignments_due_count: number;
        today_sessions_count: number;
        notifications_unread_count: number;
        recent_messages_count: number;
        next_session?: StudentScheduleItem | null;
    };
};

type StudentScheduleItem = {
    id: number;
    subject?: string | null;
    teacher?: string | null;
    room?: string | null;
    start_time?: string | null;
    end_time?: string | null;
};

type StudentAssignmentItem = {
    id: number;
    title: string;
    subject?: string | null;
    due_date?: string | null;
    status: 'pending' | 'submitted';
};

type StudentNotificationItem = {
    id: string;
    title: string;
    body?: string | null;
    read_at?: string | null;
    created_at?: string | null;
    action_url?: string | null;
};

type StudentConversationItem = {
    participant?: {
        id?: number | null;
        name?: string | null;
    } | null;
    last_message?: {
        content?: string | null;
        created_at?: string | null;
        read_at?: string | null;
        sender_id?: number | null;
    } | null;
    unread_count: number;
};

function formatRoleLabel(role: string, t: (key: string) => string) {
    return t(`roles.${role}`);
}

function formatCount(value: number | null | undefined, locale = 'fr') {
    if (value === null || value === undefined) {
        return '--';
    }

    return new Intl.NumberFormat(locale === 'ar' ? 'ar-TN' : locale).format(value);
}

function formatDate(value: string | null | undefined, locale: string) {
    if (!value) {
        return '--';
    }

    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : locale, {
        day: '2-digit',
        month: 'short',
    }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined, locale: string) {
    if (!value) {
        return '';
    }

    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : locale, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function timeRange(item: StudentScheduleItem) {
    if (!item.start_time && !item.end_time) {
        return '--';
    }

    return [item.start_time, item.end_time].filter(Boolean).join(' - ');
}

function EmptyState({ text }: { text: string }) {
    return (
        <Box
            sx={{
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                color: 'text.secondary',
                px: 2,
                py: 3,
                textAlign: 'center',
            }}
        >
            <Typography variant="body2">{text}</Typography>
        </Box>
    );
}

function StudentDashboardView({
    data,
    locale,
    t,
}: {
    data: StudentDashboardData;
    locale: string;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
    const profile = data.profile;
    const establishmentName =
        profile.establishment_name ?? t('dashboard.noEstablishment');
    const className = profile.class_name ?? t('common.notAvailable');
    const nextSession = data.summary.next_session;
    const cards: StatCardProps[] = [
        {
            label: t('dashboard.student.cards.assignmentsDue'),
            value: formatCount(data.summary.assignments_due_count, locale),
            caption: t('dashboard.student.cards.assignmentsDueCaption'),
            icon: <PendingActionsRoundedIcon />,
            color: 'warning',
        },
        {
            label: t('dashboard.student.cards.nextCourse'),
            value: nextSession?.subject ?? '--',
            caption: nextSession
                ? timeRange(nextSession)
                : t('dashboard.student.cards.noNextCourse'),
            icon: <EventAvailableRoundedIcon />,
            color: 'primary',
        },
        {
            label: t('dashboard.student.cards.unreadNotifications'),
            value: formatCount(data.summary.notifications_unread_count, locale),
            caption: t('dashboard.student.cards.unreadNotificationsCaption'),
            icon: <NotificationsActiveRoundedIcon />,
            color: 'secondary',
        },
        {
            label: t('dashboard.student.cards.recentMessages'),
            value: formatCount(data.summary.recent_messages_count, locale),
            caption: t('dashboard.student.cards.recentMessagesCaption'),
            icon: <ForumRoundedIcon />,
            color: 'success',
        },
    ];

    const quickActions = [
        {
            title: t('navigation.academicAssistant'),
            href: '/academic-assistant',
            icon: <AutoStoriesRoundedIcon />,
        },
        {
            title: t('navigation.assignments'),
            href: '/student/assignments',
            icon: <AssignmentRoundedIcon />,
        },
        {
            title: t('navigation.mySchedule'),
            href: '/student/schedules',
            icon: <CalendarViewWeekRoundedIcon />,
        },
        {
            title: t('navigation.messaging'),
            href: '/messaging',
            icon: <ForumRoundedIcon />,
        },
        {
            title: t('navigation.notifications'),
            href: '/notifications',
            icon: <NotificationsActiveRoundedIcon />,
        },
    ];

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <PageHeader
                eyebrow={t('navigation.workspace.student')}
                title={t('dashboard.welcome', { name: profile.name })}
                description={t('dashboard.student.description')}
                actions={
                    <Button
                        component={Link}
                        href="/settings/profile"
                        variant="outlined"
                        startIcon={<SettingsRoundedIcon />}
                    >
                        {t('dashboard.openSettings')}
                    </Button>
                }
            />

            <Card
                sx={{
                    background:
                        'linear-gradient(135deg, rgba(25,118,210,0.10), rgba(46,125,50,0.08))',
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <CardContent>
                    <Stack spacing={1.5}>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            {profile.name}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {t('dashboard.student.intro')}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={className} color="primary" variant="outlined" />
                            <Chip
                                label={establishmentName}
                                color="success"
                                variant="outlined"
                            />
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))',
                        xl: 'repeat(4, minmax(0, 1fr))',
                    },
                }}
            >
                {cards.map((item) => (
                    <StatCard key={item.label} {...item} />
                ))}
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' },
                    alignItems: 'start',
                }}
            >
                <Card>
                    <CardContent>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={2}
                        >
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {t('dashboard.student.todaySchedule')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t('dashboard.student.todayScheduleDescription')}
                                </Typography>
                            </Box>
                            <Button
                                component={Link}
                                href="/student/schedules"
                                size="small"
                                variant="outlined"
                            >
                                {t('common.actions.view')}
                            </Button>
                        </Stack>

                        <Stack spacing={1.5} sx={{ mt: 3 }}>
                            {data.todaySchedule.length > 0 ? (
                                data.todaySchedule.map((item) => (
                                    <Card key={item.id} variant="outlined">
                                        <CardContent sx={{ py: 2 }}>
                                            <Stack
                                                direction={{ xs: 'column', sm: 'row' }}
                                                spacing={1.5}
                                                justifyContent="space-between"
                                            >
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{ fontWeight: 700 }}
                                                    >
                                                        {item.subject ??
                                                            t('common.notAvailable')}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ mt: 0.5 }}
                                                    >
                                                        {item.teacher ??
                                                            t('common.notAvailable')}
                                                        {item.room ? ` - ${item.room}` : ''}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={timeRange(item)}
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <EmptyState text={t('dashboard.student.emptySchedule')} />
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={2}
                        >
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {t('dashboard.student.assignments')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t('dashboard.student.assignmentsDescription')}
                                </Typography>
                            </Box>
                            <Button
                                component={Link}
                                href="/student/assignments"
                                size="small"
                                variant="contained"
                            >
                                {t('common.actions.view')}
                            </Button>
                        </Stack>

                        <Stack spacing={1.5} sx={{ mt: 3 }}>
                            {data.assignments.length > 0 ? (
                                data.assignments.map((assignment) => (
                                    <Card key={assignment.id} variant="outlined">
                                        <CardActionArea
                                            component={Link}
                                            href={`/student/assignments/${assignment.id}`}
                                        >
                                            <CardContent sx={{ py: 2 }}>
                                                <Stack spacing={1}>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="space-between"
                                                        alignItems="flex-start"
                                                    >
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography
                                                                variant="subtitle1"
                                                                sx={{ fontWeight: 700 }}
                                                            >
                                                                {assignment.title}
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                            >
                                                                {assignment.subject ??
                                                                    t('common.notAvailable')}
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            size="small"
                                                            color={
                                                                assignment.status ===
                                                                'submitted'
                                                                    ? 'success'
                                                                    : 'warning'
                                                            }
                                                            label={t(
                                                                `dashboard.student.assignmentStatus.${assignment.status}`,
                                                            )}
                                                        />
                                                    </Stack>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {t('dashboard.student.dueDate', {
                                                            date: formatDate(
                                                                assignment.due_date,
                                                                locale,
                                                            ),
                                                        })}
                                                    </Typography>
                                                </Stack>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                ))
                            ) : (
                                <EmptyState
                                    text={t('dashboard.student.emptyAssignments')}
                                />
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr 1fr' },
                    alignItems: 'start',
                }}
            >
                <Card>
                    <CardContent>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {t('dashboard.quickActions')}
                        </Typography>
                        <Box
                            sx={{
                                mt: 2,
                                display: 'grid',
                                gap: 1.5,
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, minmax(0, 1fr))',
                                    xl: '1fr',
                                },
                            }}
                        >
                            {quickActions.map((item) => (
                                <Button
                                    key={item.href}
                                    component={Link}
                                    href={item.href}
                                    variant="outlined"
                                    startIcon={item.icon}
                                    sx={{ justifyContent: 'flex-start', py: 1.2 }}
                                >
                                    {item.title}
                                </Button>
                            ))}
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {t('dashboard.student.recentActivity')}
                        </Typography>
                        <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ mt: 2 }}
                        >
                            {t('navigation.notifications')}
                        </Typography>
                        <List sx={{ mt: 1 }}>
                            {data.notifications.recent.length > 0 ? (
                                data.notifications.recent.map((notification, index) => (
                                    <Box key={notification.id}>
                                        <ListItem disableGutters alignItems="flex-start">
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <NotificationsActiveRoundedIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={notification.title}
                                                secondary={
                                                    notification.body ??
                                                    formatDateTime(
                                                        notification.created_at,
                                                        locale,
                                                    )
                                                }
                                            />
                                        </ListItem>
                                        {index < data.notifications.recent.length - 1 ? (
                                            <Divider component="li" />
                                        ) : null}
                                    </Box>
                                ))
                            ) : (
                                <EmptyState
                                    text={t('dashboard.student.emptyNotifications')}
                                />
                            )}
                        </List>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" color="text.secondary">
                            {t('navigation.messaging')}
                        </Typography>
                        <List sx={{ mt: 1 }}>
                            {data.messages.recent.length > 0 ? (
                                data.messages.recent.map((conversation, index) => (
                                    <Box
                                        key={
                                            conversation.participant?.id ??
                                            `conversation-${index}`
                                        }
                                    >
                                        <ListItem disableGutters alignItems="flex-start">
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <ForumRoundedIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    conversation.participant?.name ??
                                                    t('common.notAvailable')
                                                }
                                                secondary={
                                                    conversation.last_message?.content ??
                                                    formatDateTime(
                                                        conversation.last_message?.created_at,
                                                        locale,
                                                    )
                                                }
                                            />
                                            {conversation.unread_count > 0 ? (
                                                <Chip
                                                    size="small"
                                                    color="secondary"
                                                    label={formatCount(
                                                        conversation.unread_count,
                                                        locale,
                                                    )}
                                                />
                                            ) : null}
                                        </ListItem>
                                        {index < data.messages.recent.length - 1 ? (
                                            <Divider component="li" />
                                        ) : null}
                                    </Box>
                                ))
                            ) : (
                                <EmptyState text={t('dashboard.student.emptyMessages')} />
                            )}
                        </List>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {t('dashboard.student.workspaceSummary')}
                        </Typography>
                        <List sx={{ mt: 1 }}>
                            {[
                                [t('dashboard.account.user'), profile.name],
                                [t('dashboard.account.email'), profile.email],
                                [t('dashboard.student.class'), className],
                                [t('dashboard.account.establishment'), establishmentName],
                                [
                                    t('dashboard.account.role'),
                                    formatRoleLabel(profile.role, t),
                                ],
                            ].map(([label, value], index) => (
                                <Box key={label}>
                                    <ListItem disableGutters>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            {index === 0 ? (
                                                <PersonRoundedIcon color="primary" />
                                            ) : index === 1 ? (
                                                <MailOutlineRoundedIcon color="primary" />
                                            ) : index === 2 ? (
                                                <ClassRoundedIcon color="primary" />
                                            ) : (
                                                <SchoolRoundedIcon color="primary" />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText primary={label} secondary={value} />
                                    </ListItem>
                                    {index < 4 ? <Divider component="li" /> : null}
                                </Box>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            </Box>
        </Stack>
    );
}

export default function Dashboard() {
    const { locale, t } = useTranslation();
    const {
        auth,
        dashboardStats = {},
        studentDashboard,
        parentDashboard,
    } = usePage<SharedPageProps>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.dashboard'),
            href: dashboard(),
        },
    ];
    const roles = auth.user.roles?.map((role) => role.name) ?? [];
    const roleLabel =
        roles.length > 0
            ? roles.map((role) => formatRoleLabel(role, t)).join(', ')
            : t('dashboard.standardUser');
    const isPlatformAdmin = roles.includes('platform_admin');
    const isEstablishmentAdmin = roles.includes('establishment_admin');
    const isAdmin = roles.includes('admin');
    const isTeacher = roles.includes('teacher');
    const isStudent = roles.includes('student');
    const isParent = roles.includes('parent');
    const canViewAcademicInsights = isEstablishmentAdmin || isAdmin;
    const canViewRisk = isTeacher || isEstablishmentAdmin || isAdmin;
    const canViewFinance = isEstablishmentAdmin || isAdmin;
    const establishmentName =
        auth.user.establishment?.name ?? t('dashboard.noEstablishment');

    if (isStudent && studentDashboard) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={t('dashboard.student.title')} />
                <StudentDashboardView
                    data={studentDashboard}
                    locale={locale}
                    t={t}
                />
            </AppLayout>
        );
    }

    if (isParent && parentDashboard) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={t('navigation.workspace.parent')} />
                <ParentDashboard data={parentDashboard} locale={locale} />
            </AppLayout>
        );
    }

    const stats: StatCardProps[] = [
        ...(isPlatformAdmin
            ? [
                  {
                      label: t('dashboard.stats.establishments'),
                      value: formatCount(dashboardStats.establishments, locale),
                      caption: t('dashboard.stats.establishmentsCaption'),
                      icon: <SchoolRoundedIcon />,
                      color: 'primary' as const,
                  },
                  {
                      label: t('dashboard.stats.users'),
                      value: formatCount(dashboardStats.users, locale),
                      caption: t('dashboard.stats.usersCaption'),
                      icon: <GroupsRoundedIcon />,
                      color: 'secondary' as const,
                  },
              ]
            : []),
        ...(dashboardStats.students !== null &&
        dashboardStats.students !== undefined
            ? [
                  {
                      label: t('dashboard.stats.students'),
                      value: formatCount(dashboardStats.students, locale),
                      caption: t('dashboard.stats.studentsCaption'),
                      icon: <GroupsRoundedIcon />,
                      color: 'primary' as const,
                  },
              ]
            : []),
        ...(dashboardStats.teachers !== null &&
        dashboardStats.teachers !== undefined
            ? [
                  {
                      label: t('dashboard.stats.teachers'),
                      value: formatCount(dashboardStats.teachers, locale),
                      caption: t('dashboard.stats.teachersCaption'),
                      icon: <PersonRoundedIcon />,
                      color: 'secondary' as const,
                  },
              ]
            : []),
        ...(dashboardStats.classes !== null &&
        dashboardStats.classes !== undefined
            ? [
                  {
                      label: t('dashboard.stats.classes'),
                      value: formatCount(dashboardStats.classes, locale),
                      caption: t('dashboard.stats.classesCaption'),
                      icon: <ClassRoundedIcon />,
                      color: 'success' as const,
                  },
              ]
            : []),
        ...(dashboardStats.parents !== null &&
        dashboardStats.parents !== undefined
            ? [
                  {
                      label: t('dashboard.stats.parents'),
                      value: formatCount(dashboardStats.parents, locale),
                      caption: t('dashboard.stats.parentsCaption'),
                      icon: <PeopleAltRoundedIcon />,
                      color: 'primary' as const,
                  },
              ]
            : []),
        ...(canViewFinance &&
        dashboardStats.payments !== null &&
        dashboardStats.payments !== undefined
            ? [
                  {
                      label: t('dashboard.stats.payments'),
                      value: formatCount(dashboardStats.payments, locale),
                      caption: t('dashboard.stats.invoicesTracked', {
                          count: formatCount(dashboardStats.invoices, locale),
                      }),
                      icon: <PaidRoundedIcon />,
                      color: 'success' as const,
                  },
              ]
            : []),
        ...(canViewRisk &&
        dashboardStats.atRiskStudents !== null &&
        dashboardStats.atRiskStudents !== undefined
            ? [
                  {
                      label: t('dashboard.stats.atRiskStudents'),
                      value: formatCount(dashboardStats.atRiskStudents, locale),
                      caption: t('dashboard.stats.atRiskStudentsCaption'),
                      icon: <WarningAmberRoundedIcon />,
                      color: 'warning' as const,
                  },
              ]
            : []),
    ];

    const quickActions: QuickAction[] = [
        {
            title: t('dashboard.quick.manageStudents'),
            description: t('dashboard.quick.manageStudentsDescription'),
            href: '/establishment-admin/students',
            icon: <GroupsRoundedIcon />,
            visible: isEstablishmentAdmin,
        },
        {
            title: t('dashboard.quick.manageTeachers'),
            description: t('dashboard.quick.manageTeachersDescription'),
            href: '/establishment-admin/teachers',
            icon: <PersonRoundedIcon />,
            visible: isEstablishmentAdmin,
        },
        {
            title: t('navigation.classes'),
            description: t('dashboard.quick.classesDescription'),
            href: '/establishment-admin/classes',
            icon: <ClassRoundedIcon />,
            visible: isEstablishmentAdmin,
        },
        {
            title: t('navigation.schedule'),
            description: t('dashboard.quick.scheduleDescription'),
            href: isTeacher ? '/teacher/schedules' : '/establishment-admin/schedules',
            icon: <CalendarViewWeekRoundedIcon />,
            visible: isEstablishmentAdmin || isTeacher,
        },
        {
            title: t('navigation.riskAnalysis'),
            description: t('dashboard.quick.riskDescription'),
            href: '/risk',
            icon: <WarningAmberRoundedIcon />,
            visible: canViewRisk,
        },
        {
            title: t('dashboard.quick.openReporting'),
            description: t('dashboard.quick.openReportingDescription'),
            href: '/reports/exports',
            icon: <AssignmentRoundedIcon />,
            visible: canViewAcademicInsights,
        },
        {
            title: t('navigation.payments'),
            description: t('dashboard.quick.paymentsDescription'),
            href: '/finance/payments',
            icon: <PaidRoundedIcon />,
            visible: canViewFinance,
        },
        {
            title: t('navigation.academicAssistant'),
            description: t('dashboard.quick.academicAssistantDescription'),
            href: '/academic-assistant',
            icon: <AutoStoriesRoundedIcon />,
            visible: true,
        },
        {
            title: t('navigation.myClasses'),
            description: t('dashboard.quick.teacherClassesDescription'),
            href: '/teacher/classes',
            icon: <ClassRoundedIcon />,
            visible: isTeacher,
        },
        {
            title: t('navigation.assignments'),
            description: t('dashboard.quick.assignmentsDescription'),
            href: isStudent ? '/student/assignments' : '/teacher/assignments',
            icon: <AssignmentRoundedIcon />,
            visible: isTeacher || isStudent,
        },
        {
            title: t('navigation.childGrades'),
            description: t('dashboard.quick.childGradesDescription'),
            href: '/parent/reports',
            icon: <InsightsRoundedIcon />,
            visible: isParent,
        },
    ].filter((item) => item.visible);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dashboard.title')} />

            <Stack spacing={3} sx={{ minWidth: 0 }}>
                <PageHeader
                    eyebrow={t('dashboard.eyebrow')}
                    title={t('dashboard.welcome', { name: auth.user.name })}
                    description={t('dashboard.description')}
                    actions={
                        <Button
                            component={Link}
                            href="/settings/profile"
                            variant="outlined"
                            startIcon={<SettingsRoundedIcon />}
                        >
                            {t('dashboard.openSettings')}
                        </Button>
                    }
                />

                <Card>
                    <CardContent>
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={2}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', md: 'center' }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {auth.user.name}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.75 }}
                                >
                                    {roleLabel} - {establishmentName}
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {roles.map((role) => (
                                    <Chip
                                        key={role}
                                        label={formatRoleLabel(role, t)}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                                <Chip
                                    label={
                                        auth.user.email_verified_at
                                            ? t('dashboard.emailVerified')
                                            : t('dashboard.emailNotVerified')
                                    }
                                    color={
                                        auth.user.email_verified_at
                                            ? 'success'
                                            : 'warning'
                                    }
                                    variant="outlined"
                                />
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, minmax(0, 1fr))',
                            xl: 'repeat(3, minmax(0, 1fr))',
                        },
                    }}
                >
                    {stats.map((item) => (
                        <StatCard key={item.label} {...item} />
                    ))}
                </Box>

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: { xs: '1fr', xl: '1.35fr 0.85fr' },
                        alignItems: 'start',
                    }}
                >
                    <Card>
                        <CardContent>
                            <Stack spacing={0.75}>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {t('dashboard.quickActions')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t('dashboard.quickActionsDescription')}
                                </Typography>
                            </Stack>

                            <Box
                                sx={{
                                    mt: 3,
                                    display: 'grid',
                                    gap: 2,
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        md: 'repeat(2, minmax(0, 1fr))',
                                    },
                                }}
                            >
                                {quickActions.map((item) => (
                                    <Card
                                        key={`${item.title}-${item.href}`}
                                        variant="outlined"
                                        sx={{ height: '100%' }}
                                    >
                                        <CardActionArea
                                            component={Link}
                                            href={item.href}
                                            sx={{ height: '100%' }}
                                        >
                                            <CardContent>
                                                <Stack direction="row" spacing={1.5}>
                                                    <Box
                                                        sx={{
                                                            display: 'grid',
                                                            placeItems: 'center',
                                                            width: 42,
                                                            height: 42,
                                                            borderRadius: 2,
                                                            bgcolor: 'primary.main',
                                                            color: 'primary.contrastText',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {item.icon}
                                                    </Box>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{ fontWeight: 700 }}
                                                        >
                                                            {item.title}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ mt: 0.75 }}
                                                        >
                                                            {item.description}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {t('dashboard.workspaceSummary')}
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                {t('dashboard.workspaceSummaryDescription')}
                            </Typography>

                            <List sx={{ mt: 2 }}>
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <PersonRoundedIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t('dashboard.account.user')}
                                        secondary={auth.user.name}
                                    />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <MailOutlineRoundedIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t('dashboard.account.email')}
                                        secondary={auth.user.email}
                                    />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <SchoolRoundedIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t('dashboard.account.establishment')}
                                        secondary={establishmentName}
                                    />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <InsightsRoundedIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t('dashboard.account.role')}
                                        secondary={roleLabel}
                                    />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <MailOutlineRoundedIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t('dashboard.account.emailVerification')}
                                        secondary={
                                            auth.user.email_verified_at
                                                ? t('dashboard.account.verified')
                                                : t('dashboard.account.pending')
                                        }
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Box>
            </Stack>
        </AppLayout>
    );
}

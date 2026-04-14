import { Head, Link, usePage } from '@inertiajs/react';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import {
    Box,
    Button,
    Card,
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
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/stat-card';
import type {StatCardProps} from '@/components/ui/stat-card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { Auth, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

type SharedPageProps = {
    auth: Auth;
};

export default function Dashboard() {
    const { auth } = usePage<SharedPageProps>().props;
    const roles = auth.user.roles?.map((role) => role.name) ?? [];
    const isPlatformAdmin = roles.includes('platform_admin');
    const isEstablishmentAdmin = roles.includes('establishment_admin');
    const isTeacher = roles.includes('teacher');
    const isStudent = roles.includes('student');
    const isParent = roles.includes('parent');

    const stats: StatCardProps[] = [
        {
            label: 'Current role scope',
            value: `${roles.length || 1}`,
            caption: roles.length > 0 ? roles.join(', ') : 'Standard workspace',
            icon: <GroupRoundedIcon />,
            color: 'primary' as const,
        },
        {
            label: 'Platform area',
            value: isPlatformAdmin ? 'Global' : 'Scoped',
            caption: isPlatformAdmin
                ? 'Cross-tenant administration access'
                : 'Role-limited operational area',
            icon: <BusinessRoundedIcon />,
            color: 'secondary' as const,
        },
        {
            label: 'Workspace status',
            value: auth.user.email_verified_at ? 'Verified' : 'Pending',
            caption: auth.user.email_verified_at
                ? 'Account security baseline is met'
                : 'Email verification still required',
            icon: <CheckCircleRoundedIcon />,
            color: auth.user.email_verified_at ? 'success' : 'warning',
        },
    ];

    const quickLinks = [
        {
            title: 'Manage establishments',
            description: 'Review tenants, onboarding details and activation state.',
            href: '/platform-admin/establishments',
            visible: isPlatformAdmin,
        },
        {
            title: 'Academic years',
            description: 'Keep calendars and current school cycles aligned.',
            href: '/establishment-admin/academic-years',
            visible: isEstablishmentAdmin,
        },
        {
            title: 'Subjects and classes',
            description: 'Organize curriculum structure and class assignments.',
            href: '/establishment-admin/subjects',
            visible: isEstablishmentAdmin,
        },
        {
            title: 'Evaluations',
            description: 'Create evaluations and manage grade entry workflows.',
            href: '/evaluations',
            visible: isEstablishmentAdmin || isTeacher,
        },
        {
            title: 'My classes',
            description: 'Review the classes and subjects currently assigned to you.',
            href: '/teacher/classes',
            visible: isTeacher,
        },
        {
            title: 'Attendance',
            description: 'Record attendance by session and track repeated absences.',
            href: '/teacher/attendances',
            visible: isTeacher,
        },
        {
            title: 'Assignments',
            description: 'Publish assignments for your classes and notify enrolled students.',
            href: '/teacher/assignments',
            visible: isTeacher,
        },
        {
            title: 'Assignment submissions',
            description: 'Track pending, submitted and late homework deposits for your classes.',
            href: '/teacher/assignment-submissions',
            visible: isTeacher,
        },
        {
            title: 'Attendance history',
            description: 'Review past attendance records with class, date and status filters.',
            href: '/teacher/attendances/history',
            visible: isTeacher,
        },
        {
            title: 'User settings',
            description: 'Update profile, security and appearance preferences.',
            href: '/settings/profile',
            visible: true,
        },
        {
            title: 'Schedules',
            description: 'Open your teaching schedule grouped by day.',
            href: '/teacher/schedules',
            visible: isTeacher,
        },
        {
            title: 'My schedule',
            description: 'Open the weekly timetable for your assigned class.',
            href: '/student/schedules',
            visible: isStudent,
        },
        {
            title: 'Assignments',
            description: 'Review published homework and upload your submission files.',
            href: '/student/assignments',
            visible: isStudent,
        },
        {
            title: 'Profile settings',
            description: 'Update your personal information, security and appearance preferences.',
            href: '/settings/profile',
            visible: isStudent,
        },
        {
            title: 'Child grades',
            description: 'Consult grades, evaluations and averages for linked children.',
            href: '/parent/reports',
            visible: isParent,
        },
        {
            title: 'Child schedule',
            description: 'Open the weekly timetable for linked children.',
            href: '/parent/schedules',
            visible: isParent,
        },
    ].filter((item) => item.visible);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <Stack spacing={3}>
                <PageHeader
                    eyebrow="Overview"
                    title={`Welcome back, ${auth.user.name}`}
                    description="Your academic management workspace now uses a cleaner dashboard shell designed for faster navigation and more consistent CRUD workflows."
                    actions={
                        <Button
                            component={Link}
                            href="/settings/profile"
                            variant="outlined"
                        >
                            Open settings
                        </Button>
                    }
                />

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: 'repeat(2, 1fr)',
                            xl: 'repeat(3, 1fr)',
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
                        gridTemplateColumns: { xs: '1fr', xl: '1.3fr 0.9fr' },
                    }}
                >
                    <Card>
                        <CardContent>
                            <Stack spacing={1}>
                                <Typography variant="h5">
                                    Suggested next actions
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Start from the sections you use most often. These
                                    links preserve the existing routes and permissions.
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
                                {quickLinks.map((item) => (
                                    <Card
                                        key={item.title}
                                        variant="outlined"
                                        sx={{ height: '100%' }}
                                    >
                                        <CardContent>
                                            <Typography variant="h6">
                                                {item.title}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mt: 1.2, mb: 2.5 }}
                                            >
                                                {item.description}
                                            </Typography>
                                            <Button
                                                component={Link}
                                                href={item.href}
                                                variant="contained"
                                            >
                                                Open
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography variant="h5">Workspace summary</Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                A concise snapshot of the account currently connected to
                                the platform.
                            </Typography>

                            <List sx={{ mt: 2 }}>
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <SchoolRoundedIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="User"
                                        secondary={auth.user.name}
                                    />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <AutoStoriesRoundedIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Email"
                                        secondary={auth.user.email}
                                    />
                                </ListItem>
                                <Divider component="li" />
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <CalendarMonthRoundedIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Roles"
                                        secondary={
                                            roles.length > 0
                                                ? roles.join(', ')
                                                : 'No explicit role'
                                        }
                                    />
                                </ListItem>
                            </List>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                                {roles.length > 0 ? (
                                    roles.map((role) => (
                                        <Chip
                                            key={role}
                                            label={role}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    ))
                                ) : (
                                    <Chip label="standard_user" variant="outlined" />
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            </Stack>
        </AppLayout>
    );
}

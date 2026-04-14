import { Link, router, usePage } from '@inertiajs/react';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CalendarViewWeekRoundedIcon from '@mui/icons-material/CalendarViewWeekRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import ClassRoundedIcon from '@mui/icons-material/ClassRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MessageRoundedIcon from '@mui/icons-material/MessageRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import {
    AppBar,
    Avatar,
    Box,
    Breadcrumbs,
    Button,
    Chip,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Toolbar,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import NotificationMenu from '@/components/notifications/notification-menu';
import { dashboard, logout } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { drawerWidth } from '@/theme/theme';
import type { Auth, BreadcrumbItem, UserRole } from '@/types';

type SharedPageProps = {
    auth: Auth;
};

type NavEntry = {
    title: string;
    href: string;
    icon: ReactNode;
};

type AdminShellProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

const settingsItems: NavEntry[] = [
    {
        title: 'Profile',
        href: edit().url,
        icon: <PersonRoundedIcon fontSize="small" />,
    },
    {
        title: 'Security',
        href: editSecurity().url,
        icon: <TuneRoundedIcon fontSize="small" />,
    },
    {
        title: 'Appearance',
        href: editAppearance().url,
        icon: <SettingsRoundedIcon fontSize="small" />,
    },
];

function getRoleLabel(roles: UserRole[] = []) {
    return roles
        .map((role) =>
            role.name
                .split('_')
                .map((segment) => segment[0].toUpperCase() + segment.slice(1))
                .join(' '),
        )
        .join(', ');
}

function getWorkspaceLabel({
    isPlatformAdmin,
    isEstablishmentAdmin,
    isTeacher,
    isStudent,
    isParent,
}: {
    isPlatformAdmin: boolean;
    isEstablishmentAdmin: boolean;
    isTeacher: boolean;
    isStudent: boolean;
    isParent: boolean;
}) {
    if (isPlatformAdmin) {
        return 'Platform workspace';
    }

    if (isEstablishmentAdmin) {
        return 'Admin workspace';
    }

    if (isTeacher) {
        return 'Teacher workspace';
    }

    if (isStudent) {
        return 'Student workspace';
    }

    if (isParent) {
        return 'Parent workspace';
    }

    return 'Academic workspace';
}

export default function AdminShell({
    children,
    breadcrumbs = [],
}: AdminShellProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const currentUrl = usePage().url.split('?')[0];
    const theme = useTheme();
    const isDesktop = useMediaQuery((muiTheme: Theme) =>
        muiTheme.breakpoints.up('lg'),
    );
    const [mobileOpen, setMobileOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

    const roles = auth.user.roles ?? [];
    const isPlatformAdmin = roles.some((role) => role.name === 'platform_admin');
    const isEstablishmentAdmin = roles.some(
        (role) => role.name === 'establishment_admin',
    );
    const isAdmin = roles.some((role) => role.name === 'admin');
    const isTeacher = roles.some((role) => role.name === 'teacher');
    const isStudent = roles.some((role) => role.name === 'student');
    const isParent = roles.some((role) => role.name === 'parent');
    const canViewAcademicDashboard = isEstablishmentAdmin || isAdmin;

    const navigation = useMemo<NavEntry[]>(
        () => [
            {
                title: 'Dashboard',
                href: dashboard().url,
                icon: <DashboardRoundedIcon fontSize="small" />,
            },
            ...(isPlatformAdmin
                ? [
                      {
                          title: 'Establishments',
                          href: '/platform-admin/establishments',
                          icon: <HomeWorkRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Users',
                          href: '/users',
                          icon: <PeopleAltRoundedIcon fontSize="small" />,
                      },
                  ]
                : []),
            ...(canViewAcademicDashboard
                ? [
                      {
                          title: 'Academic Dashboard',
                          href: '/academic-dashboard',
                          icon: <InsightsRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Performance Analysis',
                          href: '/performance-analysis',
                          icon: <AutoStoriesRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Exports de rapports',
                          href: '/reports/exports',
                          icon: <AssignmentRoundedIcon fontSize="small" />,
                      },
                  ]
                : []),
            ...(isEstablishmentAdmin
                ? [
                      {
                          title: 'Academic Years',
                          href: '/establishment-admin/academic-years',
                          icon: <CalendarMonthRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Levels',
                          href: '/establishment-admin/levels',
                          icon: <SchoolRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Classes',
                          href: '/establishment-admin/classes',
                          icon: <ClassRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Subjects',
                          href: '/establishment-admin/subjects',
                          icon: <AutoStoriesRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Teachers',
                          href: '/establishment-admin/teachers',
                          icon: <PersonRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Schedules',
                          href: '/establishment-admin/schedules',
                          icon: (
                              <CalendarViewWeekRoundedIcon fontSize="small" />
                          ),
                      },
                      {
                          title: 'Students',
                          href: '/establishment-admin/students',
                          icon: <GroupsRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Parents',
                          href: '/establishment-admin/parents',
                          icon: <PeopleAltRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Messaging',
                          href: '/messaging',
                          icon: <MessageRoundedIcon fontSize="small" />,
                      },
                  ]
                : []),
            ...(isTeacher
                ? [
                      {
                          title: 'My Schedule',
                          href: '/teacher/schedules',
                          icon: <CalendarViewWeekRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'My Classes',
                          href: '/teacher/classes',
                          icon: <ClassRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Attendance',
                          href: '/teacher/attendances',
                          icon: <ChecklistRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Assignments',
                          href: '/teacher/assignments',
                          icon: <AssignmentRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Assignment Submissions',
                          href: '/teacher/assignment-submissions',
                          icon: <AssignmentRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Attendance History',
                          href: '/teacher/attendances/history',
                          icon: <CalendarMonthRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Evaluations',
                          href: '/evaluations',
                          icon: <AutoStoriesRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Messaging',
                          href: '/messaging',
                          icon: <MessageRoundedIcon fontSize="small" />,
                      },
                  ]
                : []),
            ...(isStudent
                ? [
                  {
                      title: 'My Schedule',
                      href: '/student/schedules',
                      icon: <CalendarViewWeekRoundedIcon fontSize="small" />,
                  },
                  {
                      title: 'Assignments',
                      href: '/student/assignments',
                      icon: <AssignmentRoundedIcon fontSize="small" />,
                  },
                  {
                      title: 'Profile',
                      href: edit().url,
                      icon: <PersonRoundedIcon fontSize="small" />,
                  },
                  {
                      title: 'Messaging',
                      href: '/messaging',
                      icon: <MessageRoundedIcon fontSize="small" />,
                  },
                  ]
                : []),
            ...(isParent
                ? [
                      {
                          title: 'Child Grades',
                          href: '/parent/reports',
                          icon: <AssignmentRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Child Schedule',
                          href: '/parent/schedules',
                          icon: <CalendarViewWeekRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Profile',
                          href: edit().url,
                          icon: <PersonRoundedIcon fontSize="small" />,
                      },
                      {
                          title: 'Messaging',
                          href: '/messaging',
                          icon: <MessageRoundedIcon fontSize="small" />,
                      },
                  ]
                : []),
        ],
        [
            isEstablishmentAdmin,
            isParent,
            isPlatformAdmin,
            isStudent,
            isTeacher,
            canViewAcademicDashboard,
        ],
    );
    const workspaceLabel = getWorkspaceLabel({
        isPlatformAdmin,
        isEstablishmentAdmin,
        isTeacher,
        isStudent,
        isParent,
    });

    useEffect(() => {
        if (!auth.user?.id || !window.Echo) {
            return;
        }

        const channelName = `users.${auth.user.id}`;
        const channel = window.Echo.private(channelName);

        channel.listen('.message.sent', () => {
            router.reload({
                only: ['notificationCenter'],
            });
        });

        return () => {
            window.Echo?.leave(channelName);
        };
    }, [auth.user?.id]);

    const pageTitle =
        breadcrumbs[breadcrumbs.length - 1]?.title ?? 'Administration';

    const drawerContent = (
        <Stack sx={{ height: '100%' }}>
            <Box
                sx={{
                    px: 3,
                    py: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
                <Avatar
                    variant="rounded"
                    sx={{
                        width: 44,
                        height: 44,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                    }}
                >
                    <SchoolRoundedIcon />
                </Avatar>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Academic SaaS
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {workspaceLabel}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ px: 2, pb: 2 }}>
                <Box
                    sx={{
                        borderRadius: 4,
                        p: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Connected as
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
                        {auth.user.name}
                    </Typography>
                    {roles.length > 0 ? (
                        <Chip
                            size="small"
                            label={getRoleLabel(roles)}
                            color="primary"
                            sx={{ mt: 1 }}
                        />
                    ) : null}
                </Box>
            </Box>

            <Box sx={{ flex: 1, px: 2 }}>
                <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ px: 1.5 }}
                >
                    Navigation
                </Typography>
                <List sx={{ mt: 1, gap: 0.5, display: 'grid' }}>
                    {navigation.map((item) => {
                        const isActive =
                            currentUrl === item.href ||
                            currentUrl.startsWith(`${item.href}/`);

                        return (
                            <ListItemButton
                                key={item.title}
                                component={Link as React.ElementType}
                                href={item.href}
                                selected={isActive}
                                onClick={() => setMobileOpen(false)}
                                sx={{
                                    borderRadius: 3,
                                    minHeight: 46,
                                    '&.Mui-selected': {
                                        bgcolor: alpha(
                                            theme.palette.primary.main,
                                            0.12,
                                        ),
                                        color: 'primary.main',
                                    },
                                    '&.Mui-selected:hover': {
                                        bgcolor: alpha(
                                            theme.palette.primary.main,
                                            0.16,
                                        ),
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 38,
                                        color: isActive
                                            ? 'primary.main'
                                            : 'text.secondary',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.title}
                                    primaryTypographyProps={{
                                        fontWeight: isActive ? 700 : 500,
                                    }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            </Box>

            <Box sx={{ px: 2, py: 2 }}>
                <Divider sx={{ mb: 1.5 }} />
                <List sx={{ gap: 0.5, display: 'grid' }}>
                    {settingsItems.map((item) => (
                        <ListItemButton
                            key={item.title}
                            component={Link as React.ElementType}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            sx={{ borderRadius: 3 }}
                        >
                            <ListItemIcon sx={{ minWidth: 38 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.title} />
                        </ListItemButton>
                    ))}
                </List>
            </Box>
        </Stack>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                color="inherit"
                sx={{
                    width: { lg: `calc(100% - ${drawerWidth}px)` },
                    ml: { lg: `${drawerWidth}px` },
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.82),
                }}
            >
                <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
                    {!isDesktop ? (
                        <IconButton
                            edge="start"
                            onClick={() => setMobileOpen(true)}
                            sx={{ mr: 1.5 }}
                        >
                            <MenuRoundedIcon />
                        </IconButton>
                    ) : null}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {breadcrumbs.length > 1 ? (
                            <Breadcrumbs
                                sx={{ mb: 0.5 }}
                                separator="›"
                                aria-label="breadcrumb"
                            >
                                {breadcrumbs.map((item, index) => {
                                    const isLast = index === breadcrumbs.length - 1;

                                    return isLast ? (
                                        <Typography
                                            key={`${item.title}-${index}`}
                                            variant="body2"
                                            color="text.primary"
                                        >
                                            {item.title}
                                        </Typography>
                                    ) : (
                                        <Typography
                                            key={`${item.title}-${index}`}
                                            component={Link as React.ElementType}
                                            href={item.href}
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                textDecoration: 'none',
                                                '&:hover': {
                                                    color: 'primary.main',
                                                },
                                            }}
                                        >
                                            {item.title}
                                        </Typography>
                                    );
                                })}
                            </Breadcrumbs>
                        ) : null}
                        <Typography variant="h5" noWrap>
                            {pageTitle}
                        </Typography>
                    </Box>

                    <Button
                        onClick={(event) => setMenuAnchor(event.currentTarget)}
                        endIcon={<ExpandMoreRoundedIcon />}
                        sx={{
                            borderRadius: 999,
                            px: 1,
                            color: 'text.primary',
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{ minWidth: 0 }}
                        >
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {auth.user.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box
                                sx={{
                                    display: { xs: 'none', sm: 'block' },
                                    textAlign: 'left',
                                    minWidth: 0,
                                }}
                            >
                                <Typography variant="subtitle2" noWrap>
                                    {auth.user.name}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    noWrap
                                >
                                    {auth.user.email}
                                </Typography>
                            </Box>
                        </Stack>
                    </Button>
                    <NotificationMenu />
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
            >
                <Drawer
                    variant={isDesktop ? 'permanent' : 'temporary'}
                    open={isDesktop ? true : mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { lg: `calc(100% - ${drawerWidth}px)` },
                }}
            >
                <Toolbar />
                <Box
                    sx={{
                        px: { xs: 2, sm: 3, md: 4 },
                        py: { xs: 3, md: 4 },
                    }}
                >
                    {children}
                </Box>
            </Box>

            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        width: 220,
                        mt: 1,
                    },
                }}
            >
                <MenuItem
                    component={Link as React.ElementType}
                    href={edit().url}
                    onClick={() => setMenuAnchor(null)}
                >
                    <ListItemIcon>
                        <SettingsRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    Settings
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setMenuAnchor(null);
                        router.post(logout().url);
                    }}
                >
                    <ListItemIcon>
                        <LogoutRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    Log out
                </MenuItem>
            </Menu>
        </Box>
    );
}

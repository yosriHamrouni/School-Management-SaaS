import { Link, router, usePage } from '@inertiajs/react';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
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
import type { ElementType, ReactNode } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MobileBottomNavigation from '@/components/navigation/mobile-bottom-navigation';
import NotificationMenu from '@/components/notifications/notification-menu';
import { useTranslation } from '@/i18n';
import { visibleSidebarSections } from '@/navigation/sidebar-sections';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import { drawerWidth } from '@/theme/theme';
import type { Auth, BreadcrumbItem, UserRole } from '@/types';

type SharedPageProps = {
    auth: Auth;
};

type AdminShellProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

const navigationTitleKeys: Record<string, string> = {
    'Academic Assistant': 'navigation.academicAssistant',
    'Academic Dashboard': 'navigation.academicDashboard',
    'Academic Years': 'navigation.academicYears',
    'Analyse des risques': 'navigation.riskAnalysis',
    Appearance: 'navigation.appearance',
    'Assignment Submissions': 'navigation.assignmentSubmissions',
    Assignments: 'navigation.assignments',
    Attendance: 'navigation.attendance',
    'Attendance History': 'navigation.attendanceHistory',
    'Child Grades': 'navigation.childGrades',
    'Child Schedule': 'navigation.childSchedule',
    Classes: 'navigation.classes',
    Dashboard: 'navigation.dashboard',
    Establishments: 'navigation.establishments',
    Evaluations: 'navigation.evaluations',
    'Exports de rapports': 'navigation.reportsExports',
    Levels: 'navigation.levels',
    Messaging: 'navigation.messaging',
    'My Classes': 'navigation.myClasses',
    'My Schedule': 'navigation.mySchedule',
    Notifications: 'navigation.notifications',
    Parents: 'navigation.parents',
    'Payment invoices': 'navigation.paymentInvoices',
    Payments: 'navigation.payments',
    'Performance Analysis': 'navigation.performanceAnalysis',
    Profile: 'navigation.profile',
    Schedules: 'navigation.schedule',
    Security: 'navigation.security',
    Settings: 'navigation.settings',
    'School Fees': 'navigation.schoolFees',
    Students: 'navigation.students',
    'Student Assignments': 'navigation.assignments',
    Subjects: 'navigation.subjects',
    Teachers: 'navigation.teachers',
    Users: 'navigation.users',
};

const sectionTitleKeys: Record<string, string> = {
    Compte: 'navigation.account',
    Communication: 'navigation.communication',
    'Administration plateforme': 'navigation.platformAdministration',
    'Emplois du temps': 'navigation.schedule',
    Finance: 'navigation.finance',
    'Gestion academique': 'navigation.academicManagement',
    Reporting: 'navigation.reports',
    'Suivi pedagogique': 'navigation.pedagogicalFollowUp',
    'Vue generale': 'navigation.overview',
};

function getRoleLabel(roles: UserRole[] = [], t: (key: string) => string) {
    return roles.map((role) => t(`roles.${role.name}`)).join(', ');
}

function getWorkspaceLabel(roles: UserRole[] = [], t: (key: string) => string) {
    const roleNames = roles.map((role) => role.name);

    if (roleNames.includes('platform_admin')) {
        return t('navigation.workspace.platformAdmin');
    }

    if (roleNames.includes('establishment_admin')) {
        return t('navigation.workspace.establishmentAdmin');
    }

    if (roleNames.includes('teacher')) {
        return t('navigation.workspace.teacher');
    }

    if (roleNames.includes('student')) {
        return t('navigation.workspace.student');
    }

    if (roleNames.includes('parent')) {
        return t('navigation.workspace.parent');
    }

    return t('navigation.academicWorkspace');
}

export default function AdminShell({
    children,
    breadcrumbs = [],
}: AdminShellProps) {
    const { dir, t } = useTranslation();
    const { auth } = usePage<SharedPageProps>().props;
    const currentUrl = usePage().url.split('?')[0];
    const theme = useTheme();
    const isDesktop = useMediaQuery((muiTheme: Theme) =>
        muiTheme.breakpoints.up('lg'),
    );
    const [mobileOpen, setMobileOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

    const roles = useMemo(() => auth.user.roles ?? [], [auth.user.roles]);
    const navigationSections = useMemo(
        () => visibleSidebarSections(roles, Boolean(auth.user.email_verified_at)),
        [auth.user.email_verified_at, roles],
    );
    const workspaceLabel = getWorkspaceLabel(roles, t);
    const isRtl = dir === 'rtl';

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
        breadcrumbs[breadcrumbs.length - 1]?.title ?? t('navigation.administration');
    const translateNavigationTitle = (title: string) =>
        t(navigationTitleKeys[title] ?? title);
    const translateSectionTitle = (title: string) =>
        t(sectionTitleKeys[title] ?? title);

    const drawerContent = (
        <Stack sx={{ height: '100%', minHeight: 0 }}>
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
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                        Academic SaaS
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {workspaceLabel}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ px: 2, pb: 2 }}>
                <Box
                    sx={{
                        borderRadius: 3,
                        p: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        {t('navigation.connectedAs')}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mt: 0.5 }} noWrap>
                        {auth.user.name}
                    </Typography>
                    {roles.length > 0 ? (
                        <Chip
                            size="small"
                            label={getRoleLabel(roles, t)}
                            color="primary"
                            sx={{ mt: 1, maxWidth: '100%' }}
                        />
                    ) : null}
                </Box>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2, pb: 2 }}>
                {navigationSections.map((section, sectionIndex) => (
                    <Box key={section.title} sx={{ mt: sectionIndex === 0 ? 0 : 2 }}>
                        <Typography
                            variant="overline"
                            color="text.secondary"
                            sx={{
                                display: 'block',
                                px: 1.5,
                                pb: 0.5,
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: 0,
                            }}
                        >
                            {translateSectionTitle(section.title)}
                        </Typography>
                        <List sx={{ gap: 0.35, display: 'grid', py: 0 }}>
                            {section.items.map((item) => {
                                const isActive =
                                    currentUrl === item.href ||
                                    currentUrl.startsWith(`${item.href}/`);

                                return (
                                    <ListItemButton
                                        key={`${section.title}-${item.href}`}
                                        component={Link as ElementType}
                                        href={item.href}
                                        selected={isActive}
                                        onClick={() => setMobileOpen(false)}
                                        sx={{
                                            borderRadius: 2,
                                            minHeight: 42,
                                            px: 1.5,
                                            '&.Mui-selected': {
                                                bgcolor: alpha(
                                                    theme.palette.primary.main,
                                                    0.12,
                                                ),
                                                color: 'primary.main',
                                                boxShadow: `inset ${isRtl ? '-3px' : '3px'} 0 0 ${theme.palette.primary.main}`,
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
                                                minWidth: 34,
                                                color: isActive
                                                    ? 'primary.main'
                                                    : 'text.secondary',
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={translateNavigationTitle(item.title)}
                                            primaryTypographyProps={{
                                                fontSize: 14,
                                                fontWeight: isActive ? 700 : 500,
                                                noWrap: true,
                                            }}
                                        />
                                    </ListItemButton>
                                );
                            })}
                        </List>
                        {sectionIndex < navigationSections.length - 1 ? (
                            <Divider sx={{ mt: 1.5 }} />
                        ) : null}
                    </Box>
                ))}
            </Box>
        </Stack>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', overflowX: 'hidden' }} dir={dir}>
            <AppBar
                position="fixed"
                color="inherit"
                sx={{
                    width: { lg: `calc(100% - ${drawerWidth}px)` },
                    ...(isRtl
                        ? { mr: { lg: `${drawerWidth}px` } }
                        : { ml: { lg: `${drawerWidth}px` } }),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.92),
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Toolbar
                    sx={{
                        gap: { xs: 0.5, sm: 1 },
                        px: { xs: 1, sm: 2, md: 3 },
                    }}
                >
                    {!isDesktop ? (
                        <IconButton
                            edge="start"
                            onClick={() => setMobileOpen(true)}
                            sx={isRtl ? { ml: 1.5 } : { mr: 1.5 }}
                        >
                            <MenuRoundedIcon />
                        </IconButton>
                    ) : null}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {breadcrumbs.length > 1 ? (
                            <Breadcrumbs
                                sx={{ mb: 0.5 }}
                                separator=">"
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
                                            component={Link as ElementType}
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
                            flexShrink: 0,
                            maxWidth: { xs: 52, lg: 244 },
                            overflow: 'hidden',
                            px: { xs: 0.5, sm: 1 },
                            color: 'text.primary',
                            minWidth: 0,
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{ minWidth: 0, overflow: 'hidden' }}
                        >
                            <Avatar
                                sx={{
                                    bgcolor: 'primary.main',
                                    width: { xs: 36, sm: 40 },
                                    height: { xs: 36, sm: 40 },
                                }}
                            >
                                {auth.user.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box
                                sx={{
                                    display: { xs: 'none', lg: 'block' },
                                    textAlign: isRtl ? 'right' : 'left',
                                    minWidth: 0,
                                    maxWidth: 180,
                                    overflow: 'hidden',
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    noWrap
                                    title={auth.user.name}
                                    sx={{ display: 'block', maxWidth: '100%' }}
                                >
                                    {auth.user.name}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    noWrap
                                    title={auth.user.email}
                                    sx={{ display: 'block', maxWidth: '100%' }}
                                >
                                    {auth.user.email}
                                </Typography>
                            </Box>
                        </Stack>
                    </Button>
                    <LanguageSwitcher compact />
                    <NotificationMenu />
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
            >
                <Drawer
                    anchor={isRtl ? 'right' : 'left'}
                    variant={isDesktop ? 'permanent' : 'temporary'}
                    open={isDesktop ? true : mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            overflowX: 'hidden',
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
                    minWidth: 0,
                    width: { lg: `calc(100% - ${drawerWidth}px)` },
                }}
            >
                <Toolbar />
                <Box
                    sx={{
                        px: { xs: 2, sm: 3, md: 4 },
                        py: { xs: 3, md: 4 },
                        pb: { xs: 'calc(88px + env(safe-area-inset-bottom))', lg: 4 },
                        maxWidth: '100%',
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
                transformOrigin={{
                    vertical: 'top',
                    horizontal: isRtl ? 'left' : 'right',
                }}
                PaperProps={{
                    sx: {
                        width: 220,
                        mt: 1,
                    },
                }}
            >
                <MenuItem
                    component={Link as ElementType}
                    href={edit().url}
                    onClick={() => setMenuAnchor(null)}
                >
                    <ListItemIcon>
                        <SettingsRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    {t('navigation.settings')}
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
                    {t('navigation.logout')}
                </MenuItem>
            </Menu>
            <MobileBottomNavigation roles={roles} currentUrl={currentUrl} />
        </Box>
    );
}

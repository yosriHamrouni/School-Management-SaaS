import { Link } from '@inertiajs/react';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import ClassRoundedIcon from '@mui/icons-material/ClassRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import {
    BottomNavigation,
    BottomNavigationAction,
    Paper,
} from '@mui/material';
import type { ElementType, ReactNode } from 'react';
import type { UserRole } from '@/types';

type MobileNavItem = {
    label: string;
    href: string;
    icon: ReactNode;
};

const common: MobileNavItem[] = [
    { label: 'Home', href: '/dashboard', icon: <DashboardRoundedIcon /> },
];

const byRole: Record<string, MobileNavItem[]> = {
    teacher: [
        { label: 'Classes', href: '/teacher/classes', icon: <ClassRoundedIcon /> },
        { label: 'Attendance', href: '/teacher/attendances', icon: <ChecklistRoundedIcon /> },
        { label: 'Grades', href: '/evaluations', icon: <AssignmentRoundedIcon /> },
    ],
    student: [
        { label: 'Schedule', href: '/student/schedules', icon: <CalendarMonthRoundedIcon /> },
        { label: 'Assignments', href: '/student/assignments', icon: <AssignmentRoundedIcon /> },
    ],
    parent: [
        { label: 'Children', href: '/parent/reports', icon: <GroupsRoundedIcon /> },
        { label: 'Schedule', href: '/parent/schedules', icon: <CalendarMonthRoundedIcon /> },
    ],
    establishment_admin: [
        { label: 'Classes', href: '/establishment-admin/classes', icon: <ClassRoundedIcon /> },
        { label: 'Users', href: '/establishment-admin/students', icon: <GroupsRoundedIcon /> },
    ],
};

export default function MobileBottomNavigation({
    roles,
    currentUrl,
}: {
    roles: UserRole[];
    currentUrl: string;
}) {
    const roleItems = roles.flatMap((role) => byRole[role.name] ?? []);
    const items = [
        ...common,
        ...roleItems.slice(0, 3),
        {
            label: 'Alerts',
            href: '/notifications',
            icon: <NotificationsRoundedIcon />,
        },
    ].slice(0, 5);
    const selected = items.findIndex(
        (item) => currentUrl === item.href || currentUrl.startsWith(`${item.href}/`),
    );

    return (
        <Paper
            component="nav"
            aria-label="Primary mobile navigation"
            elevation={8}
            sx={{
                display: { xs: 'block', lg: 'none' },
                position: 'fixed',
                right: 0,
                bottom: 0,
                left: 0,
                zIndex: (theme) => theme.zIndex.appBar,
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
        >
            <BottomNavigation showLabels value={selected}>
                {items.map((item) => (
                    <BottomNavigationAction
                        key={item.href}
                        component={Link as ElementType}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        sx={{ minWidth: 0, px: 0.5, touchAction: 'manipulation' }}
                    />
                ))}
            </BottomNavigation>
        </Paper>
    );
}

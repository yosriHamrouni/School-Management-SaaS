import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CalendarViewWeekRoundedIcon from '@mui/icons-material/CalendarViewWeekRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import ClassRoundedIcon from '@mui/icons-material/ClassRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import MessageRoundedIcon from '@mui/icons-material/MessageRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import type { ReactNode } from 'react';
import { dashboard } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { UserRole } from '@/types';

export type SidebarRole =
    | 'admin'
    | 'establishment_admin'
    | 'parent'
    | 'platform_admin'
    | 'student'
    | 'teacher';

export type SidebarItem = {
    title: string;
    href: string;
    icon: ReactNode;
    roles?: SidebarRole[];
    requiresVerifiedEmail?: boolean;
};

export type SidebarSection = {
    title: string;
    items: SidebarItem[];
};

export const sidebarSections: SidebarSection[] = [
    {
        title: 'Vue generale',
        items: [
            {
                title: 'Dashboard',
                href: dashboard().url,
                icon: <DashboardRoundedIcon fontSize="small" />,
            },
            {
                title: 'Academic Dashboard',
                href: '/academic-dashboard',
                icon: <InsightsRoundedIcon fontSize="small" />,
                roles: ['establishment_admin', 'admin'],
            },
        ],
    },
    {
        title: 'Gestion academique',
        items: [
            {
                title: 'Academic Years',
                href: '/establishment-admin/academic-years',
                icon: <CalendarMonthRoundedIcon fontSize="small" />,
                roles: ['establishment_admin'],
            },
            {
                title: 'Levels',
                href: '/establishment-admin/levels',
                icon: <SchoolRoundedIcon fontSize="small" />,
                roles: ['establishment_admin'],
            },
            {
                title: 'Classes',
                href: '/establishment-admin/classes',
                icon: <ClassRoundedIcon fontSize="small" />,
                roles: ['establishment_admin'],
            },
            {
                title: 'Subjects',
                href: '/establishment-admin/subjects',
                icon: <AutoStoriesRoundedIcon fontSize="small" />,
                roles: ['establishment_admin'],
            },
            {
                title: 'Teachers',
                href: '/establishment-admin/teachers',
                icon: <PersonRoundedIcon fontSize="small" />,
                roles: ['establishment_admin'],
            },
            {
                title: 'Students',
                href: '/establishment-admin/students',
                icon: <GroupsRoundedIcon fontSize="small" />,
                roles: ['establishment_admin'],
            },
            {
                title: 'Parents',
                href: '/establishment-admin/parents',
                icon: <PeopleAltRoundedIcon fontSize="small" />,
                roles: ['establishment_admin'],
            },
            {
                title: 'Schedules',
                href: '/establishment-admin/schedules',
                icon: <CalendarViewWeekRoundedIcon fontSize="small" />,
                roles: ['establishment_admin'],
            },
            {
                title: 'Evaluations',
                href: '/evaluations',
                icon: <ChecklistRoundedIcon fontSize="small" />,
                roles: ['establishment_admin', 'teacher'],
            },
        ],
    },
    {
        title: 'Suivi pedagogique',
        items: [
            {
                title: 'Performance Analysis',
                href: '/performance-analysis',
                icon: <AutoStoriesRoundedIcon fontSize="small" />,
                roles: ['establishment_admin', 'admin'],
            },
            {
                title: 'Analyse des risques',
                href: '/risk',
                icon: <WarningAmberRoundedIcon fontSize="small" />,
                roles: ['teacher', 'establishment_admin', 'admin'],
            },
            {
                title: 'Academic Assistant',
                href: '/academic-assistant',
                icon: <SmartToyRoundedIcon fontSize="small" />,
            },
            {
                title: 'My Classes',
                href: '/teacher/classes',
                icon: <ClassRoundedIcon fontSize="small" />,
                roles: ['teacher'],
            },
            {
                title: 'Attendance',
                href: '/teacher/attendances',
                icon: <ChecklistRoundedIcon fontSize="small" />,
                roles: ['teacher'],
            },
            {
                title: 'Assignments',
                href: '/teacher/assignments',
                icon: <AssignmentRoundedIcon fontSize="small" />,
                roles: ['teacher'],
            },
            {
                title: 'Assignment Submissions',
                href: '/teacher/assignment-submissions',
                icon: <AssignmentRoundedIcon fontSize="small" />,
                roles: ['teacher'],
            },
            {
                title: 'Attendance History',
                href: '/teacher/attendances/history',
                icon: <CalendarMonthRoundedIcon fontSize="small" />,
                roles: ['teacher'],
            },
            {
                title: 'Student Assignments',
                href: '/student/assignments',
                icon: <AssignmentRoundedIcon fontSize="small" />,
                roles: ['student'],
            },
            {
                title: 'Child Grades',
                href: '/parent/reports',
                icon: <AssignmentRoundedIcon fontSize="small" />,
                roles: ['parent'],
            },
        ],
    },
    {
        title: 'Emplois du temps',
        items: [
            {
                title: 'My Schedule',
                href: '/teacher/schedules',
                icon: <CalendarViewWeekRoundedIcon fontSize="small" />,
                roles: ['teacher'],
            },
            {
                title: 'My Schedule',
                href: '/student/schedules',
                icon: <CalendarViewWeekRoundedIcon fontSize="small" />,
                roles: ['student'],
            },
            {
                title: 'Child Schedule',
                href: '/parent/schedules',
                icon: <CalendarViewWeekRoundedIcon fontSize="small" />,
                roles: ['parent'],
            },
        ],
    },
    {
        title: 'Communication',
        items: [
            {
                title: 'Messaging',
                href: '/messaging',
                icon: <MessageRoundedIcon fontSize="small" />,
            },
            {
                title: 'Notifications',
                href: '/notifications',
                icon: <NotificationsRoundedIcon fontSize="small" />,
            },
        ],
    },
    {
        title: 'Finance',
        items: [
            {
                title: 'School Fees',
                href: '/finance/fee-types',
                icon: <ReceiptLongRoundedIcon fontSize="small" />,
                roles: ['establishment_admin', 'admin'],
            },
            {
                title: 'Payments',
                href: '/finance/payments',
                icon: <PaidRoundedIcon fontSize="small" />,
                roles: ['establishment_admin', 'admin'],
            },
            {
                title: 'Payment invoices',
                href: '/finance/payment-invoices',
                icon: <ReceiptLongRoundedIcon fontSize="small" />,
                roles: ['establishment_admin', 'admin'],
            },
        ],
    },
    {
        title: 'Reporting',
        items: [
            {
                title: 'Exports de rapports',
                href: '/reports/exports',
                icon: <AssignmentRoundedIcon fontSize="small" />,
                roles: ['establishment_admin', 'admin'],
            },
        ],
    },
    {
        title: 'Administration plateforme',
        items: [
            {
                title: 'Establishments',
                href: '/platform-admin/establishments',
                icon: <HomeWorkRoundedIcon fontSize="small" />,
                roles: ['platform_admin'],
            },
            {
                title: 'Users',
                href: '/users',
                icon: <PeopleAltRoundedIcon fontSize="small" />,
                roles: ['platform_admin'],
            },
        ],
    },
    {
        title: 'Compte',
        items: [
            {
                title: 'Profile',
                href: edit().url,
                icon: <PersonRoundedIcon fontSize="small" />,
            },
            {
                title: 'Security',
                href: editSecurity().url,
                icon: <TuneRoundedIcon fontSize="small" />,
                requiresVerifiedEmail: true,
            },
            {
                title: 'Appearance',
                href: editAppearance().url,
                icon: <SettingsRoundedIcon fontSize="small" />,
                requiresVerifiedEmail: true,
            },
        ],
    },
];

export function visibleSidebarSections(
    roles: UserRole[] = [],
    emailVerified = false,
): SidebarSection[] {
    const roleNames = roles.map((role) => role.name);

    return sidebarSections
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => {
                if (item.requiresVerifiedEmail && !emailVerified) {
                    return false;
                }

                if (!item.roles) {
                    return true;
                }

                return item.roles.some((role) => roleNames.includes(role));
            }),
        }))
        .filter((section) => section.items.length > 0);
}

import { Link, usePage } from '@inertiajs/react';
import { BookOpen, BookOpenText, Bot, Building2, CalendarClock, CalendarRange, CheckSquare, FileText, FolderGit2, GraduationCap, LayoutGrid, MessageSquare, School, UserRoundCheck, UserRoundPen, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as {
        auth: {
            user?: {
                roles?: Array<{ name: string }>;
            } | null;
        };
    };

    const isPlatformAdmin = Boolean(
        auth.user?.roles?.some((role) => role.name === 'platform_admin'),
    );
    const isEstablishmentAdmin = Boolean(
        auth.user?.roles?.some((role) => role.name === 'establishment_admin'),
    );
    const isTeacher = Boolean(
        auth.user?.roles?.some((role) => role.name === 'teacher'),
    );
    const isStudent = Boolean(
        auth.user?.roles?.some((role) => role.name === 'student'),
    );
    const isParent = Boolean(
        auth.user?.roles?.some((role) => role.name === 'parent'),
    );

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Assistant academique',
            href: '/academic-assistant',
            icon: Bot,
        },
        ...(isPlatformAdmin
            ? [
                  {
                      title: 'Establishments',
                      href: '/platform-admin/establishments',
                      icon: Building2,
                  },
                  {
                      title: 'Users',
                      href: '/users',
                      icon: Users,
                  },
              ]
            : []),
        ...(isEstablishmentAdmin
            ? [
                  {
                      title: 'Academic Years',
                      href: '/establishment-admin/academic-years',
                      icon: CalendarRange,
                  },
                  {
                      title: 'Levels',
                      href: '/establishment-admin/levels',
                      icon: GraduationCap,
                  },
                  {
                      title: 'Classes',
                      href: '/establishment-admin/classes',
                      icon: School,
                  },
                  {
                      title: 'Subjects',
                      href: '/establishment-admin/subjects',
                      icon: BookOpenText,
                  },
                  {
                      title: 'Teachers',
                      href: '/establishment-admin/teachers',
                      icon: UserRoundPen,
                  },
                  {
                      title: 'Schedules',
                      href: '/establishment-admin/schedules',
                      icon: CalendarClock,
                  },
                  {
                      title: 'Evaluations',
                      href: '/evaluations',
                      icon: BookOpen,
                  },
                  {
                      title: 'Students',
                      href: '/establishment-admin/students',
                      icon: Users,
                  },
                  {
                      title: 'Parents',
                      href: '/establishment-admin/parents',
                      icon: UserRoundCheck,
                  },
                  {
                      title: 'Messaging',
                      href: '/messaging',
                      icon: MessageSquare,
                  },
              ]
            : []),
        ...(isTeacher
            ? [
                  {
                      title: 'My Schedule',
                      href: '/teacher/schedules',
                      icon: CalendarClock,
                  },
                  {
                      title: 'My Classes',
                      href: '/teacher/classes',
                      icon: School,
                  },
                  {
                      title: 'Attendance',
                      href: '/teacher/attendances',
                      icon: CheckSquare,
                  },
                  {
                      title: 'Assignments',
                      href: '/teacher/assignments',
                      icon: FileText,
                  },
                  {
                      title: 'Assignment Submissions',
                      href: '/teacher/assignment-submissions',
                      icon: FileText,
                  },
                  {
                      title: 'Attendance History',
                      href: '/teacher/attendances/history',
                      icon: CalendarRange,
                  },
                  {
                      title: 'Evaluations',
                      href: '/evaluations',
                      icon: BookOpen,
                  },
                  {
                      title: 'Messaging',
                      href: '/messaging',
                      icon: MessageSquare,
                  },
              ]
            : []),
        ...(isStudent
            ? [
                  {
                      title: 'My Schedule',
                      href: '/student/schedules',
                      icon: CalendarClock,
                  },
                  {
                      title: 'Assignments',
                      href: '/student/assignments',
                      icon: FileText,
                  },
                  {
                      title: 'Messaging',
                      href: '/messaging',
                      icon: MessageSquare,
                  },
              ]
            : []),
        ...(isParent
            ? [
                  {
                      title: 'Child Grades',
                      href: '/parent/reports',
                      icon: FileText,
                  },
                  {
                      title: 'Child Schedule',
                      href: '/parent/schedules',
                      icon: CalendarClock,
                  },
                  {
                      title: 'Messaging',
                      href: '/messaging',
                      icon: MessageSquare,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

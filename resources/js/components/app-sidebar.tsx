import { Link, usePage } from '@inertiajs/react';
import { BookOpen, BookOpenText, Bot, Building2, CalendarClock, CalendarRange, CheckSquare, FileText, FolderGit2, GraduationCap, LayoutGrid, MessageSquare, School, UserRoundCheck, UserRoundPen, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { useTranslation } from '@/i18n';
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
    const { t } = useTranslation();
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
            title: t('navigation.dashboard'),
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: t('navigation.academicAssistant'),
            href: '/academic-assistant',
            icon: Bot,
        },
        ...(isPlatformAdmin
            ? [
                  {
                      title: t('navigation.establishments'),
                      href: '/platform-admin/establishments',
                      icon: Building2,
                  },
                  {
                      title: t('navigation.users'),
                      href: '/users',
                      icon: Users,
                  },
              ]
            : []),
        ...(isEstablishmentAdmin
            ? [
                  {
                      title: t('navigation.academicYears'),
                      href: '/establishment-admin/academic-years',
                      icon: CalendarRange,
                  },
                  {
                      title: t('navigation.levels'),
                      href: '/establishment-admin/levels',
                      icon: GraduationCap,
                  },
                  {
                      title: t('navigation.classes'),
                      href: '/establishment-admin/classes',
                      icon: School,
                  },
                  {
                      title: t('navigation.subjects'),
                      href: '/establishment-admin/subjects',
                      icon: BookOpenText,
                  },
                  {
                      title: t('navigation.teachers'),
                      href: '/establishment-admin/teachers',
                      icon: UserRoundPen,
                  },
                  {
                      title: t('navigation.schedule'),
                      href: '/establishment-admin/schedules',
                      icon: CalendarClock,
                  },
                  {
                      title: t('navigation.evaluations'),
                      href: '/evaluations',
                      icon: BookOpen,
                  },
                  {
                      title: t('navigation.students'),
                      href: '/establishment-admin/students',
                      icon: Users,
                  },
                  {
                      title: t('navigation.parents'),
                      href: '/establishment-admin/parents',
                      icon: UserRoundCheck,
                  },
                  {
                      title: t('navigation.messaging'),
                      href: '/messaging',
                      icon: MessageSquare,
                  },
                  {
                      title: t('navigation.payments'),
                      href: '/finance/payments',
                      icon: FileText,
                  },
                  {
                      title: t('navigation.paymentInvoices'),
                      href: '/finance/payment-invoices',
                      icon: FileText,
                  },
              ]
            : []),
        ...(isTeacher
            ? [
                  {
                      title: t('navigation.mySchedule'),
                      href: '/teacher/schedules',
                      icon: CalendarClock,
                  },
                  {
                      title: t('navigation.myClasses'),
                      href: '/teacher/classes',
                      icon: School,
                  },
                  {
                      title: t('navigation.attendance'),
                      href: '/teacher/attendances',
                      icon: CheckSquare,
                  },
                  {
                      title: t('navigation.assignments'),
                      href: '/teacher/assignments',
                      icon: FileText,
                  },
                  {
                      title: t('navigation.assignmentSubmissions'),
                      href: '/teacher/assignment-submissions',
                      icon: FileText,
                  },
                  {
                      title: t('navigation.attendanceHistory'),
                      href: '/teacher/attendances/history',
                      icon: CalendarRange,
                  },
                  {
                      title: t('navigation.evaluations'),
                      href: '/evaluations',
                      icon: BookOpen,
                  },
                  {
                      title: t('navigation.messaging'),
                      href: '/messaging',
                      icon: MessageSquare,
                  },
              ]
            : []),
        ...(isStudent
            ? [
                  {
                      title: t('navigation.mySchedule'),
                      href: '/student/schedules',
                      icon: CalendarClock,
                  },
                  {
                      title: t('navigation.assignments'),
                      href: '/student/assignments',
                      icon: FileText,
                  },
                  {
                      title: t('navigation.messaging'),
                      href: '/messaging',
                      icon: MessageSquare,
                  },
              ]
            : []),
        ...(isParent
            ? [
                  {
                      title: t('navigation.childGrades'),
                      href: '/parent/reports',
                      icon: FileText,
                  },
                  {
                      title: t('navigation.childSchedule'),
                      href: '/parent/schedules',
                      icon: CalendarClock,
                  },
                  {
                      title: t('navigation.messaging'),
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

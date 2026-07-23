import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import { dashboard, login, register } from '@/routes';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    BookOpenCheck,
    BrainCircuit,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    GraduationCap,
    LayoutDashboard,
    LockKeyhole,
    NotebookTabs,
    ShieldCheck,
    Sparkles,
    UsersRound,
} from 'lucide-react';

type WelcomeProps = {
    canRegister?: boolean;
};

const accessLinks = [
    {
        icon: NotebookTabs,
        labelKey: 'landing.teacherSpace',
        href: '/teacher-access',
        descriptionKey: 'landing.teacherDescription',
    },
    {
        icon: GraduationCap,
        labelKey: 'landing.studentSpace',
        href: '/student-access',
        descriptionKey: 'landing.studentDescription',
    },
    {
        icon: UsersRound,
        labelKey: 'landing.parentSpace',
        href: '/parent-access',
        descriptionKey: 'landing.parentDescription',
    },
];

const features = [
    {
        icon: UsersRound,
        titleKey: 'landing.features.roles',
        descriptionKey: 'landing.features.rolesDescription',
    },
    {
        icon: CalendarDays,
        titleKey: 'landing.features.schedules',
        descriptionKey: 'landing.features.schedulesDescription',
    },
    {
        icon: BookOpenCheck,
        titleKey: 'landing.features.grades',
        descriptionKey: 'landing.features.gradesDescription',
    },
    {
        icon: ClipboardCheck,
        titleKey: 'landing.features.attendance',
        descriptionKey: 'landing.features.attendanceDescription',
    },
    {
        icon: BarChart3,
        titleKey: 'landing.features.reports',
        descriptionKey: 'landing.features.reportsDescription',
    },
    {
        icon: ShieldCheck,
        titleKey: 'landing.features.risk',
        descriptionKey: 'landing.features.riskDescription',
    },
];

const benefits = [
    {
        icon: LayoutDashboard,
        titleKey: 'landing.benefits.centralized',
        descriptionKey: 'landing.benefits.centralizedDescription',
    },
    {
        icon: LockKeyhole,
        titleKey: 'landing.benefits.secure',
        descriptionKey: 'landing.benefits.secureDescription',
    },
    {
        icon: BrainCircuit,
        titleKey: 'landing.benefits.assistant',
        descriptionKey: 'landing.benefits.assistantDescription',
    },
];

const proofStats = [
    ['2000+', 'landing.stats.students'],
    ['120+', 'landing.stats.classes'],
    ['24/7', 'landing.stats.access'],
];

export default function Welcome({ canRegister = true }: WelcomeProps) {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const primaryHref = auth.user ? dashboard() : login();

    return (
        <>
            <Head title={t('landing.headTitle')} />

            <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
                <header className="sticky top-0 z-40 border-b border-cyan-100/70 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                        <Link
                            href="/"
                            className="inline-flex min-w-0 items-center gap-3"
                        >
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-100">
                                <GraduationCap className="size-6" />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-xs font-bold tracking-[0.2em] text-cyan-700 uppercase">
                                    {t('landing.brandEyebrow')}
                                </span>
                                <span className="block text-sm font-semibold text-slate-900 sm:text-base">
                                    {t('landing.brandName')}
                                </span>
                            </span>
                        </Link>

                        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
                            <a
                                href="#plateforme"
                                className="rounded-full px-3 py-2 transition hover:bg-cyan-50 hover:text-cyan-700"
                            >
                                {t('landing.nav.platform')}
                            </a>
                            <a
                                href="#espaces"
                                className="rounded-full px-3 py-2 transition hover:bg-cyan-50 hover:text-cyan-700"
                            >
                                {t('landing.nav.spaces')}
                            </a>
                            <a
                                href="#fonctionnalites"
                                className="rounded-full px-3 py-2 transition hover:bg-cyan-50 hover:text-cyan-700"
                            >
                                {t('landing.nav.features')}
                            </a>
                            <a
                                href="#pourquoi"
                                className="rounded-full px-3 py-2 transition hover:bg-cyan-50 hover:text-cyan-700"
                            >
                                {t('landing.nav.why')}
                            </a>
                        </nav>

                        <div className="flex flex-wrap items-center gap-2">
                            <LanguageSwitcher />
                            {auth.user ? (
                                <Button
                                    asChild
                                    className="rounded-full bg-cyan-500 px-5 text-white shadow-md shadow-cyan-100 hover:bg-cyan-600"
                                >
                                    <Link href={dashboard()}>
                                        {t('landing.dashboard')}
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="rounded-full text-cyan-700 hover:bg-cyan-50"
                                    >
                                        <Link href={login()}>{t('landing.login')}</Link>
                                    </Button>
                                    {canRegister ? (
                                        <Button
                                            asChild
                                            className="rounded-full bg-cyan-500 px-5 text-white shadow-md shadow-cyan-100 hover:bg-cyan-600"
                                        >
                                            <Link href={register()}>
                                                {t('landing.createAccount')}
                                            </Link>
                                        </Button>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <section
                    id="plateforme"
                    className="relative overflow-hidden bg-[#82d8f2]"
                >
                    <div className="absolute top-12 right-[8%] h-44 w-44 rounded-full border-[20px] border-white/25" />
                    <div className="absolute right-[-4rem] bottom-20 h-60 w-60 rounded-full border-[28px] border-white/20" />
                    <div className="absolute bottom-16 left-[48%] h-28 w-28 rounded-full border-[16px] border-white/20" />

                    <div className="relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
                        <div className="max-w-xl">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-cyan-700 shadow-lg shadow-cyan-600/10">
                                <Sparkles className="size-4" />
                                {t('landing.heroBadge')}
                            </div>

                            <h1 className="text-5xl leading-[1.05] font-black tracking-normal text-white drop-shadow-sm sm:text-6xl lg:text-7xl">
                                {t('landing.heroTitle')}
                            </h1>

                            <p className="mt-6 max-w-lg text-xl leading-8 font-medium text-white/95">
                                {t('landing.heroDescription')}
                            </p>

                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-14 rounded-full bg-cyan-600 px-8 text-base font-bold text-white shadow-xl shadow-cyan-700/20 hover:bg-cyan-700"
                                >
                                    <Link href={primaryHref}>
                                        {t('landing.requestDemo')}
                                        <ArrowRight className="size-5" />
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-14 rounded-full bg-white px-8 text-base font-bold text-cyan-700 shadow-xl shadow-cyan-700/10 hover:bg-cyan-50"
                                >
                                    <a href="#espaces">{t('landing.viewSpaces')}</a>
                                </Button>
                            </div>
                        </div>

                        <div className="relative min-h-[360px] lg:min-h-[540px]">
                            <img
                                src="/images/landing-school-hero.png"
                                alt={t('landing.imageAlt')}
                                className="absolute inset-x-0 bottom-0 mx-auto h-full max-h-[560px] w-full max-w-[760px] object-contain object-bottom drop-shadow-2xl"
                            />

                            <div className="absolute top-8 left-0 hidden rounded-3xl bg-white/95 p-4 shadow-2xl shadow-cyan-800/10 md:block">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-11 items-center justify-center rounded-2xl bg-lime-100 text-lime-700">
                                        <CheckCircle2 className="size-6" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500">
                                            {t('landing.today')}
                                        </p>
                                        <p className="text-xl font-black text-slate-950">
                                            {t('landing.attendanceRate')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute right-4 bottom-8 hidden rounded-3xl bg-white/95 p-4 shadow-2xl shadow-cyan-800/10 md:block">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                                        <BrainCircuit className="size-6" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500">
                                            {t('landing.assistant')}
                                        </p>
                                        <p className="text-xl font-black text-slate-950">
                                            {t('landing.smartFollowUp')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mx-auto grid max-w-5xl gap-4 rounded-[2rem] border border-cyan-100 bg-white p-5 shadow-xl shadow-cyan-100/70 sm:grid-cols-3">
                        {proofStats.map(([value, labelKey]) => (
                            <div
                                key={labelKey}
                                className="text-center sm:border-r sm:border-cyan-100 sm:last:border-r-0"
                            >
                                <p className="text-3xl font-black text-cyan-600">
                                    {value}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    {t(labelKey)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section
                    id="espaces"
                    className="bg-gradient-to-b from-white to-cyan-50 px-4 py-16 sm:px-6 lg:px-8"
                >
                    <div className="mx-auto max-w-7xl">
                        <div className="mx-auto max-w-3xl text-center">
                            <p className="text-sm font-black tracking-[0.2em] text-cyan-600 uppercase">
                                {t('landing.spacesEyebrow')}
                            </p>
                            <h2 className="mt-3 text-4xl font-black text-slate-950">
                                {t('landing.spacesTitle')}
                            </h2>
                        </div>

                        <div className="mt-10 grid gap-5 md:grid-cols-3">
                            {accessLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group rounded-[2rem] border border-cyan-100 bg-white p-7 shadow-xl shadow-cyan-100/70 transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-200/80"
                                >
                                    <span className="flex size-16 items-center justify-center rounded-3xl bg-cyan-100 text-cyan-700 transition group-hover:bg-cyan-500 group-hover:text-white">
                                        <item.icon className="size-8" />
                                    </span>
                                    <h3 className="mt-6 text-2xl font-black text-slate-950">
                                        {t(item.labelKey)}
                                    </h3>
                                    <p className="mt-3 text-base leading-7 text-slate-600">
                                        {t(item.descriptionKey)}
                                    </p>
                                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-cyan-700">
                                        {t('landing.accessSpace')}
                                        <ArrowRight className="size-4" />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    id="fonctionnalites"
                    className="bg-white px-4 py-16 sm:px-6 lg:px-8"
                >
                    <div className="mx-auto max-w-7xl">
                        <div className="max-w-3xl">
                            <p className="text-sm font-black tracking-[0.2em] text-cyan-600 uppercase">
                                {t('landing.featuresEyebrow')}
                            </p>
                            <h2 className="mt-3 text-4xl font-black text-slate-950">
                                {t('landing.featuresTitle')}
                            </h2>
                        </div>

                        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature) => (
                                <article
                                    key={feature.titleKey}
                                    className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-6 transition hover:bg-cyan-50"
                                >
                                    <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
                                        <feature.icon className="size-6" />
                                    </span>
                                    <h3 className="mt-5 text-lg font-black text-slate-950">
                                        {t(feature.titleKey)}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {t(feature.descriptionKey)}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    id="pourquoi"
                    className="bg-cyan-600 px-4 py-16 text-white sm:px-6 lg:px-8"
                >
                    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                        <div>
                            <p className="text-sm font-black tracking-[0.2em] text-cyan-100 uppercase">
                                {t('landing.whyEyebrow')}
                            </p>
                            <h2 className="mt-3 text-4xl font-black">
                                {t('landing.whyTitle')}
                            </h2>
                            <p className="mt-4 text-lg leading-8 text-cyan-50">
                                {t('landing.whyDescription')}
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            {benefits.map((benefit) => (
                                <article
                                    key={benefit.titleKey}
                                    className="rounded-[1.5rem] bg-white/15 p-6 backdrop-blur"
                                >
                                    <benefit.icon className="size-8 text-white" />
                                    <h3 className="mt-5 text-lg font-black">
                                        {t(benefit.titleKey)}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-cyan-50">
                                        {t(benefit.descriptionKey)}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

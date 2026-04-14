import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type TeacherClass = {
    id: number;
    name: string;
    level_name: string | null;
    academic_year_name: string | null;
    student_count: number;
    subjects: Array<{
        id: number;
        name: string;
    }>;
};

type Props = {
    classes: TeacherClass[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Classes', href: '/teacher/classes' },
];

export default function TeacherClassesIndex({ classes }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Classes" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <h1 className="text-2xl font-semibold">My Classes</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Review the classes and subjects currently assigned to you.
                    </p>
                </div>

                {classes.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {classes.map((schoolClass) => (
                            <div
                                key={schoolClass.id}
                                className="rounded-xl border border-sidebar-border/70 bg-background p-6"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold">{schoolClass.name}</h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {schoolClass.level_name ?? 'No level'} · {schoolClass.academic_year_name ?? 'No academic year'}
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                        {schoolClass.student_count} students
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <p className="text-sm font-medium">Subjects</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {schoolClass.subjects.map((subject) => (
                                            <span
                                                key={subject.id}
                                                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                                            >
                                                {subject.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-5 flex gap-2">
                                    <Button variant="outline" asChild>
                                        <Link href="/evaluations">Open evaluations</Link>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href="/teacher/schedules">View schedule</Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-sidebar-border/70 bg-background px-6 py-8 text-sm text-muted-foreground">
                        No classes are assigned to you yet. Ask your establishment admin to configure your class-subject assignments.
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

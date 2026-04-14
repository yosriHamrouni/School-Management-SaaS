import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import FlashAlerts from '@/components/ui/flash-alerts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    assignment: {
        id: number;
        title: string;
        description: string | null;
        due_date: string | null;
        subject_name: string | null;
        class_name: string | null;
        academic_year_name: string | null;
        is_overdue: boolean;
    };
    submission: {
        id: number;
        submission_text: string | null;
        attachment_original_name: string;
        attachment_url: string;
        submitted_at: string | null;
        is_late: boolean;
    } | null;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

type SubmissionFormData = {
    submission_text: string;
    attachment: File | null;
};

export default function StudentAssignmentsShow({ assignment, submission }: Props) {
    const { flash } = usePage<Props>().props;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Assignments', href: '/student/assignments' },
        { title: assignment.title, href: `/student/assignments/${assignment.id}` },
    ];
    const form = useForm<SubmissionFormData>({
        submission_text: submission?.submission_text ?? '',
        attachment: null,
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(`/student/assignments/${assignment.id}/submission`, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={assignment.title} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{assignment.title}</h1>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span>{assignment.subject_name ?? '-'}</span>
                            <span>/</span>
                            <span>{assignment.class_name ?? '-'}</span>
                            <span>/</span>
                            <span>{assignment.academic_year_name ?? '-'}</span>
                        </div>
                    </div>

                    <Button variant="outline" asChild>
                        <Link href="/student/assignments">Back to assignments</Link>
                    </Button>
                </div>

                <FlashAlerts flash={flash} />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                        <h2 className="text-lg font-semibold">Instructions</h2>
                        <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
                            {assignment.description || 'No additional instructions were provided for this assignment.'}
                        </p>
                    </div>

                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                        <h2 className="text-lg font-semibold">Submission</h2>
                        <div className="mt-4 space-y-3 text-sm">
                            <div>
                                <div className="text-muted-foreground">Due date</div>
                                <div className={assignment.is_overdue && !submission ? 'font-medium text-red-600' : 'font-medium'}>
                                    {assignment.due_date ?? '-'}
                                </div>
                            </div>

                            {submission ? (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                                    <div className="font-medium">Current submission</div>
                                    <div className="mt-2 text-sm">{submission.attachment_original_name}</div>
                                    <div className="mt-1 text-xs">
                                        Submitted on {submission.submitted_at ?? '-'}
                                    </div>
                                    {submission.is_late ? (
                                        <div className="mt-1 text-xs text-amber-700">This submission was made after the due date.</div>
                                    ) : null}
                                    <div className="mt-3">
                                        <a
                                            href={submission.attachment_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                                        >
                                            Open attached file
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-border bg-muted/30 p-4 text-muted-foreground">
                                    No submission has been uploaded yet.
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="submission_text">Comment (optional)</Label>
                                <textarea
                                    id="submission_text"
                                    value={form.data.submission_text}
                                    onChange={(event) => form.setData('submission_text', event.target.value)}
                                    className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                                    placeholder="Add a note for this submission"
                                />
                                <InputError message={form.errors.submission_text} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="attachment">Attachment</Label>
                                <Input
                                    id="attachment"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.txt"
                                    onChange={(event) => form.setData('attachment', event.target.files?.[0] ?? null)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Accepted formats: PDF, DOC, DOCX, PNG, JPG, ZIP, TXT. Max 10 MB.
                                </p>
                                <InputError message={form.errors.attachment} />
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={form.processing}>
                                    {submission ? 'Replace submission' : 'Submit assignment'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

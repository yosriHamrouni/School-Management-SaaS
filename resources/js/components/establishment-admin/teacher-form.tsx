import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TeacherFormData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    assignments: string[];
};

type AssignmentGroup = {
    class_id: number;
    class_name: string;
    subjects: Array<{
        key: string;
        subject_id: number;
        subject_name: string;
    }>;
};

type TeacherFormProps = {
    data: TeacherFormData;
    errors: Record<string, string | undefined>;
    processing: boolean;
    submitLabel: string;
    assignmentOptions: AssignmentGroup[];
    passwordOptional?: boolean;
    setData: {
        (key: 'name', value: string): void;
        (key: 'email', value: string): void;
        (key: 'password', value: string): void;
        (key: 'password_confirmation', value: string): void;
        (key: 'assignments', value: string[]): void;
    };
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function TeacherForm({
    data,
    errors,
    processing,
    submitLabel,
    assignmentOptions,
    passwordOptional = false,
    setData,
    onSubmit,
}: TeacherFormProps) {
    const toggleAssignment = (key: string, checked: boolean) => {
        const nextAssignments = checked
            ? [...data.assignments, key]
            : data.assignments.filter((assignment) => assignment !== key);

        setData('assignments', nextAssignments);
    };

    const toggleClassAssignments = (keys: string[], checked: boolean) => {
        const currentAssignments = new Set(data.assignments);

        keys.forEach((key) => {
            if (checked) {
                currentAssignments.add(key);
            } else {
                currentAssignments.delete(key);
            }
        });

        setData('assignments', Array.from(currentAssignments));
    };

    return (
        <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        placeholder="Teacher name"
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        placeholder="teacher@school.test"
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">
                        {passwordOptional ? 'Password (optional)' : 'Password'}
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(event) =>
                            setData('password', event.target.value)
                        }
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">
                        Password confirmation
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(event) =>
                            setData('password_confirmation', event.target.value)
                        }
                    />
                </div>

                <div className="grid gap-4 md:col-span-2">
                    <div>
                        <Label>Assigned classes</Label>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Configure the teaching scope as:
                            <span className="ml-1 font-medium text-foreground">
                                Teacher -&gt; Classes -&gt; Subjects
                            </span>
                        </p>
                    </div>

                    {assignmentOptions.length > 0 ? (
                        <div className="grid gap-4">
                            {assignmentOptions.map((group) => {
                                const classKeys = group.subjects.map((subject) => subject.key);
                                const selectedCount = classKeys.filter((key) =>
                                    data.assignments.includes(key),
                                ).length;
                                const allSelected =
                                    classKeys.length > 0 && selectedCount === classKeys.length;

                                return (
                                    <div
                                        key={group.class_id}
                                        className="rounded-xl border border-border bg-muted/20 p-4"
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    Class: {group.class_name}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Choose the subjects this teacher handles in this class.
                                                </p>
                                            </div>

                                            <label className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onChange={(event) =>
                                                        toggleClassAssignments(classKeys, event.target.checked)
                                                    }
                                                />
                                                <span>
                                                    Assign class
                                                    {selectedCount > 0
                                                        ? ` (${selectedCount}/${classKeys.length})`
                                                        : ''}
                                                </span>
                                            </label>
                                        </div>

                                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                                            {group.subjects.map((subject) => (
                                                <label
                                                    key={subject.key}
                                                    className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 text-sm"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={data.assignments.includes(subject.key)}
                                                        onChange={(event) =>
                                                            toggleAssignment(subject.key, event.target.checked)
                                                        }
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {subject.subject_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            Assign subject to teacher for {group.class_name}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground">
                            No classes or subjects are available yet in this establishment.
                        </div>
                    )}

                    <InputError message={errors.assignments} />
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

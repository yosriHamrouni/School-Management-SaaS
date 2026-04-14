import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type StudentOption = {
    id: number;
    name: string;
    student_number: string | null;
};

type ParentFormData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    student_ids: number[];
};

type ParentFormProps = {
    data: ParentFormData;
    errors: Record<string, string | undefined>;
    processing: boolean;
    submitLabel: string;
    passwordOptional?: boolean;
    students: StudentOption[];
    setData: {
        (key: 'name', value: string): void;
        (key: 'email', value: string): void;
        (key: 'password', value: string): void;
        (key: 'password_confirmation', value: string): void;
        (key: 'student_ids', value: number[]): void;
    };
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ParentForm({
    data,
    errors,
    processing,
    submitLabel,
    passwordOptional = false,
    students,
    setData,
    onSubmit,
}: ParentFormProps) {
    return (
        <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        placeholder="Parent name"
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
                        placeholder="parent@school.test"
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
            </div>

            <div className="grid gap-3 rounded-lg border border-border p-4">
                <div>
                    <p className="text-sm font-medium">Linked students</p>
                    <p className="text-sm text-muted-foreground">
                        Select one or more students from your establishment.
                    </p>
                </div>

                {students.length > 0 ? (
                    students.map((student) => {
                        const checked = data.student_ids.includes(student.id);

                        return (
                            <label
                                key={student.id}
                                className="flex items-center gap-3 text-sm text-foreground"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) =>
                                        setData(
                                            'student_ids',
                                            event.target.checked
                                                ? [...data.student_ids, student.id]
                                                : data.student_ids.filter(
                                                      (studentId) =>
                                                          studentId !== student.id,
                                                  ),
                                        )
                                    }
                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <span>
                                    {student.name}
                                    {student.student_number
                                        ? ` (${student.student_number})`
                                        : ''}
                                </span>
                            </label>
                        );
                    })
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No students available.
                    </p>
                )}

                <InputError message={errors.student_ids} />
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

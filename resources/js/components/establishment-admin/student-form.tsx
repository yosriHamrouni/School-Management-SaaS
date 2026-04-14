import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Option = {
    id: number;
    name: string;
};

export type StudentFormData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    class_id: string;
    student_number: string;
    date_of_birth: string;
    gender: string;
    enrollment_date: string;
    status: string;
    photo_url: string;
};

type StudentFormProps = {
    data: StudentFormData;
    errors: Record<string, string | undefined>;
    processing: boolean;
    submitLabel: string;
    classes: Option[];
    passwordOptional?: boolean;
    setData: {
        (key: keyof StudentFormData, value: string): void;
    };
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const selectClassName =
    'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]';

export default function StudentForm({
    data,
    errors,
    processing,
    submitLabel,
    classes,
    passwordOptional = false,
    setData,
    onSubmit,
}: StudentFormProps) {
    return (
        <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        placeholder="Student name"
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
                        placeholder="student@school.test"
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
                        onChange={(event) => setData('password', event.target.value)}
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">Password confirmation</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(event) => setData('password_confirmation', event.target.value)}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="class_id">Class</Label>
                    <select
                        id="class_id"
                        value={data.class_id}
                        onChange={(event) => setData('class_id', event.target.value)}
                        className={selectClassName}
                    >
                        <option value="">No class assigned</option>
                        {classes.map((schoolClass) => (
                            <option key={schoolClass.id} value={String(schoolClass.id)}>
                                {schoolClass.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.class_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="student_number">Student number</Label>
                    <Input
                        id="student_number"
                        value={data.student_number}
                        onChange={(event) => setData('student_number', event.target.value)}
                        placeholder="STU-001"
                    />
                    <InputError message={errors.student_number} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Input
                        id="status"
                        value={data.status}
                        onChange={(event) => setData('status', event.target.value)}
                        placeholder="active"
                    />
                    <InputError message={errors.status} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="date_of_birth">Date of birth</Label>
                    <Input
                        id="date_of_birth"
                        type="date"
                        value={data.date_of_birth}
                        onChange={(event) => setData('date_of_birth', event.target.value)}
                    />
                    <InputError message={errors.date_of_birth} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Input
                        id="gender"
                        value={data.gender}
                        onChange={(event) => setData('gender', event.target.value)}
                        placeholder="female"
                    />
                    <InputError message={errors.gender} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="enrollment_date">Enrollment date</Label>
                    <Input
                        id="enrollment_date"
                        type="date"
                        value={data.enrollment_date}
                        onChange={(event) => setData('enrollment_date', event.target.value)}
                    />
                    <InputError message={errors.enrollment_date} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="photo_url">Photo URL</Label>
                    <Input
                        id="photo_url"
                        value={data.photo_url}
                        onChange={(event) => setData('photo_url', event.target.value)}
                        placeholder="https://..."
                    />
                    <InputError message={errors.photo_url} />
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

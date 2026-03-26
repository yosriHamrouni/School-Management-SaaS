import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type EstablishmentFormData = {
    name: string;
    code: string;
    type: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    director_name: string;
    is_active: boolean;
};

type EstablishmentFormProps = {
    data: EstablishmentFormData;
    errors: Record<string, string | undefined>;
    processing: boolean;
    submitLabel: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    setData: {
        (key: 'name', value: string): void;
        (key: 'code', value: string): void;
        (key: 'type', value: string): void;
        (key: 'address', value: string): void;
        (key: 'city', value: string): void;
        (key: 'phone', value: string): void;
        (key: 'email', value: string): void;
        (key: 'director_name', value: string): void;
        (key: 'is_active', value: boolean): void;
    };
};

export default function EstablishmentForm({
    data,
    errors,
    processing,
    submitLabel,
    onSubmit,
    setData,
}: EstablishmentFormProps) {
    return (
        <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        placeholder="Establishment name"
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="code">Code</Label>
                    <Input
                        id="code"
                        value={data.code}
                        onChange={(event) => setData('code', event.target.value)}
                        placeholder="EST-001"
                    />
                    <InputError message={errors.code} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Input
                        id="type"
                        value={data.type}
                        onChange={(event) => setData('type', event.target.value)}
                        placeholder="School"
                    />
                    <InputError message={errors.type} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                        id="city"
                        value={data.city}
                        onChange={(event) => setData('city', event.target.value)}
                        placeholder="Tunis"
                    />
                    <InputError message={errors.city} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        value={data.phone}
                        onChange={(event) => setData('phone', event.target.value)}
                        placeholder="+216 00 000 000"
                    />
                    <InputError message={errors.phone} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        placeholder="contact@establishment.test"
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="director_name">Director Name</Label>
                    <Input
                        id="director_name"
                        value={data.director_name}
                        onChange={(event) =>
                            setData('director_name', event.target.value)
                        }
                        placeholder="Director full name"
                    />
                    <InputError message={errors.director_name} />
                </div>

                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <textarea
                        id="address"
                        value={data.address}
                        onChange={(event) => setData('address', event.target.value)}
                        placeholder="Full address"
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                    />
                    <InputError message={errors.address} />
                </div>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm text-foreground">
                <input
                    type="checkbox"
                    checked={data.is_active}
                    onChange={(event) =>
                        setData('is_active', event.target.checked)
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>Establishment is active</span>
            </label>
            <InputError message={errors.is_active} />

            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

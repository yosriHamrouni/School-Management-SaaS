import { useEffect, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Option = {
    id: number;
    name: string;
};

type UserRow = {
    id: number;
    name: string;
    email: string;
    establishment: string | null;
    establishment_id: number | null;
    roles: string[];
    role_ids: number[];
};

type UsersIndexProps = {
    users: UserRow[];
    establishments: Option[];
    roles: Option[];
};

type UserFormData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    establishment_id: string;
    role_ids: number[];
};

type SharedPageProps = {
    flash?: {
        success?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Gestion des utilisateurs',
        href: '/users',
    },
];

const initialFormData: UserFormData = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    establishment_id: '',
    role_ids: [],
};

function UserFormDialog({
    open,
    onOpenChange,
    title,
    description,
    submitLabel,
    form,
    establishments,
    roles,
    onSubmit,
    isEditing = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    submitLabel: string;
    form: ReturnType<typeof useForm<UserFormData>>;
    establishments: Option[];
    roles: Option[];
    onSubmit: () => void;
    isEditing?: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSubmit();
                    }}
                    className="grid gap-5"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nom</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="Nom complet"
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.data.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                            placeholder="email@exemple.com"
                        />
                        <InputError message={form.errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="establishment_id">Etablissement</Label>
                        <Select
                            value={form.data.establishment_id}
                            onValueChange={(value) =>
                                form.setData(
                                    'establishment_id',
                                    value === 'none' ? '' : value,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choisir un etablissement" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Aucun etablissement</SelectItem>
                                {establishments.map((establishment) => (
                                    <SelectItem
                                        key={establishment.id}
                                        value={String(establishment.id)}
                                    >
                                        {establishment.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.establishment_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Roles</Label>
                        <div className="grid gap-3 rounded-lg border border-border p-4">
                            {roles.map((role) => {
                                const checked = form.data.role_ids.includes(role.id);

                                return (
                                    <label
                                        key={role.id}
                                        className="flex items-center gap-3 text-sm text-foreground"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(event) =>
                                                form.setData(
                                                    'role_ids',
                                                    event.target.checked
                                                        ? [...form.data.role_ids, role.id]
                                                        : form.data.role_ids.filter(
                                                              (currentRoleId) =>
                                                                  currentRoleId !==
                                                                  role.id,
                                                          ),
                                                )
                                            }
                                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                        />
                                        <span>{role.name}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <InputError message={form.errors.role_ids} />
                    </div>

                    <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                {isEditing
                                    ? 'Nouveau mot de passe'
                                    : 'Mot de passe'}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.data.password}
                                onChange={(event) =>
                                    form.setData('password', event.target.value)
                                }
                                placeholder={
                                    isEditing
                                        ? 'Laisser vide pour conserver'
                                        : 'Mot de passe'
                                }
                            />
                            <InputError message={form.errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Confirmation du mot de passe
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={form.data.password_confirmation}
                                onChange={(event) =>
                                    form.setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                placeholder="Confirmer le mot de passe"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function UsersIndex({
    users,
    establishments,
    roles,
}: UsersIndexProps) {
    const { flash } = usePage<SharedPageProps>().props;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);

    const createForm = useForm<UserFormData>(initialFormData);
    const editForm = useForm<UserFormData>(initialFormData);
    const deleteForm = useForm({});

    useEffect(() => {
        if (!editingUser) {
            editForm.reset();
            editForm.clearErrors();
            return;
        }

        editForm.setData({
            name: editingUser.name,
            email: editingUser.email,
            password: '',
            password_confirmation: '',
            establishment_id: editingUser.establishment_id
                ? String(editingUser.establishment_id)
                : '',
            role_ids: editingUser.role_ids,
        });
        editForm.clearErrors();
    }, [editingUser]);

    const handleCreate = () => {
        createForm.post('/users', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
                createForm.clearErrors();
            },
        });
    };

    const handleUpdate = () => {
        if (!editingUser) {
            return;
        }

        editForm.put(`/users/${editingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingUser(null);
                editForm.reset();
                editForm.clearErrors();
            },
        });
    };

    const handleDelete = () => {
        if (!deletingUser) {
            return;
        }

        deleteForm.delete(`/users/${deletingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingUser(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestion des utilisateurs" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-sidebar-border/70 bg-background p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            Gestion des utilisateurs
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Creer, modifier et supprimer les utilisateurs de la
                            plateforme.
                        </p>
                    </div>

                    <Button onClick={() => setIsCreateOpen(true)}>
                        Ajouter un utilisateur
                    </Button>
                </div>

                {flash?.success ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                ) : null}

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Nom
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Etablissement
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                        Role
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 text-sm text-foreground">
                                                {user.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-foreground">
                                                {user.email}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-foreground">
                                                {user.establishment ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-foreground">
                                                {user.roles.length > 0
                                                    ? user.roles.join(', ')
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setEditingUser(user)
                                                        }
                                                    >
                                                        Modifier
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDeletingUser(user)
                                                        }
                                                    >
                                                        Supprimer
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-sm text-muted-foreground"
                                        >
                                            Aucun utilisateur
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <UserFormDialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);

                    if (!open) {
                        createForm.reset();
                        createForm.clearErrors();
                    }
                }}
                title="Ajouter un utilisateur"
                description="Creer un nouvel utilisateur et lui attribuer un etablissement et des roles."
                submitLabel="Creer l'utilisateur"
                form={createForm}
                establishments={establishments}
                roles={roles}
                onSubmit={handleCreate}
            />

            <UserFormDialog
                open={editingUser !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingUser(null);
                    }
                }}
                title="Modifier un utilisateur"
                description="Mettre a jour les informations, les roles et eventuellement le mot de passe."
                submitLabel="Enregistrer les modifications"
                form={editForm}
                establishments={establishments}
                roles={roles}
                onSubmit={handleUpdate}
                isEditing
            />

            <Dialog
                open={deletingUser !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingUser(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer un utilisateur</DialogTitle>
                        <DialogDescription>
                            Cette action supprimera definitivement{' '}
                            <span className="font-medium text-foreground">
                                {deletingUser?.name}
                            </span>
                            .
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingUser(null)}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deleteForm.processing}
                            onClick={handleDelete}
                        >
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

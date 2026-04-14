import { Head, Link, router, usePage } from '@inertiajs/react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    InputAdornment,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import FlashAlerts from '@/components/ui/flash-alerts';
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/stat-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type EstablishmentRow = {
    id: number;
    name: string;
    code: string;
    type: string;
    city: string | null;
    phone: string | null;
    email: string | null;
    director_name: string | null;
    is_active: boolean;
    created_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type EstablishmentsPagination = {
    data: EstablishmentRow[];
    links: PaginationLink[];
};

type PageProps = {
    filters: {
        search: string;
    };
    establishments: EstablishmentsPagination;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Platform Admin',
        href: '/platform-admin',
    },
    {
        title: 'Establishments',
        href: '/platform-admin/establishments',
    },
];

export default function EstablishmentsIndex({
    filters,
    establishments,
}: PageProps) {
    const { flash } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState<EstablishmentRow | null>(null);

    const activeCount = useMemo(
        () => establishments.data.filter((item) => item.is_active).length,
        [establishments.data],
    );

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/platform-admin/establishments',
            { search },
            { preserveState: true, replace: true },
        );
    };

    const handleToggleStatus = (id: number) => {
        router.patch(
            `/platform-admin/establishments/${id}/toggle-status`,
            {},
            { preserveScroll: true },
        );
    };

    const stats = [
        {
            label: 'Visible rows',
            value: `${establishments.data.length}`,
            caption: 'Current page of tenant records',
            color: 'primary' as const,
            icon: <SearchRoundedIcon />,
        },
        {
            label: 'Active',
            value: `${activeCount}`,
            caption: 'Establishments currently enabled',
            color: 'success' as const,
            icon: <SwapHorizRoundedIcon />,
        },
        {
            label: 'Filtered by',
            value: search ? 'Search' : 'All',
            caption: search || 'No search filter applied',
            color: 'secondary' as const,
            icon: <VisibilityRoundedIcon />,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Establishments" />

            <Stack spacing={3}>
                <PageHeader
                    eyebrow="Platform administration"
                    title="Establishments"
                    description="Manage tenant establishments without changing the existing backend workflows. Search, review status and open create or edit flows from the same management view."
                    actions={
                        <Button
                            component={Link}
                            href="/platform-admin/establishments/create"
                            variant="contained"
                            startIcon={<AddRoundedIcon />}
                        >
                            Add establishment
                        </Button>
                    }
                />

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: 'repeat(3, minmax(0, 1fr))',
                        },
                    }}
                >
                    {stats.map((item) => (
                        <StatCard key={item.label} {...item} />
                    ))}
                </Box>

                <FlashAlerts flash={flash} />

                <Card>
                    <CardContent>
                        <Box
                            component="form"
                            onSubmit={submitSearch}
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    md: 'minmax(0, 1fr) auto auto',
                                },
                            }}
                        >
                            <TextField
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by name or code"
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchRoundedIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button type="submit" variant="contained">
                                Search
                            </Button>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={() => {
                                    setSearch('');
                                    router.get(
                                        '/platform-admin/establishments',
                                        {},
                                        { preserveState: true, replace: true },
                                    );
                                }}
                            >
                                Reset
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Code</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>City</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {establishments.data.length > 0 ? (
                                        establishments.data.map((establishment) => (
                                            <TableRow
                                                key={establishment.id}
                                                hover
                                                sx={{
                                                    '&:last-child td': {
                                                        borderBottom: 0,
                                                    },
                                                }}
                                            >
                                                <TableCell>
                                                    <Stack spacing={0.5}>
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{ fontWeight: 700 }}
                                                        >
                                                            {establishment.name}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            {establishment.email ??
                                                                'No email'}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>{establishment.code}</TableCell>
                                                <TableCell>{establishment.type}</TableCell>
                                                <TableCell>
                                                    {establishment.city ?? '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={
                                                            establishment.is_active
                                                                ? 'Active'
                                                                : 'Inactive'
                                                        }
                                                        color={
                                                            establishment.is_active
                                                                ? 'success'
                                                                : 'default'
                                                        }
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="flex-end"
                                                        flexWrap="wrap"
                                                        useFlexGap
                                                    >
                                                        <Button
                                                            component={Link}
                                                            href={`/platform-admin/establishments/${establishment.id}`}
                                                            variant="outlined"
                                                            size="small"
                                                            startIcon={
                                                                <VisibilityRoundedIcon />
                                                            }
                                                        >
                                                            View
                                                        </Button>
                                                        <Button
                                                            component={Link}
                                                            href={`/platform-admin/establishments/${establishment.id}/edit`}
                                                            variant="outlined"
                                                            size="small"
                                                            startIcon={<EditRoundedIcon />}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="text"
                                                            size="small"
                                                            color="secondary"
                                                            onClick={() =>
                                                                handleToggleStatus(
                                                                    establishment.id,
                                                                )
                                                            }
                                                        >
                                                            {establishment.is_active
                                                                ? 'Disable'
                                                                : 'Activate'}
                                                        </Button>
                                                        <Button
                                                            variant="text"
                                                            size="small"
                                                            color="error"
                                                            startIcon={
                                                                <DeleteOutlineRoundedIcon />
                                                            }
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    establishment,
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6}>
                                                <Box
                                                    sx={{
                                                        py: 8,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    <Typography variant="h6">
                                                        No establishments found
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ mt: 1 }}
                                                    >
                                                        Adjust the search filter or
                                                        create the first tenant.
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>

                <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    justifyContent="flex-end"
                >
                    {establishments.links.map((link, index) => (
                        <Button
                            key={`${link.label}-${index}`}
                            variant={link.active ? 'contained' : 'outlined'}
                            size="small"
                            disabled={!link.url}
                            onClick={() => {
                                if (!link.url) {
                                    return;
                                }

                                router.visit(link.url, { preserveScroll: true });
                            }}
                        >
                            <span
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        </Button>
                    ))}
                </Stack>
            </Stack>

            <Dialog
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Delete establishment</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {deleteTarget
                            ? `Delete "${deleteTarget.name}"? This keeps the existing destructive action, but now uses a clearer confirmation dialog.`
                            : ''}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => {
                            if (!deleteTarget) {
                                return;
                            }

                            router.delete(
                                `/platform-admin/establishments/${deleteTarget.id}`,
                                {
                                    preserveScroll: true,
                                    onFinish: () => setDeleteTarget(null),
                                },
                            );
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </AppLayout>
    );
}

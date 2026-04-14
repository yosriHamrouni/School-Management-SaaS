import { Head, router, usePage } from '@inertiajs/react';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import TableViewRoundedIcon from '@mui/icons-material/TableViewRounded';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import type { FormEvent } from 'react';
import { useState } from 'react';
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/stat-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type PageProps = {
    filters: {
        startDate: string;
        endDate: string;
    };
    report: {
        meta: {
            establishmentName: string;
            generatedAt: string;
            period: {
                startDate: string;
                endDate: string;
                label: string;
            };
            hasAcademicData: boolean;
        };
        stats: {
            totalClasses: number;
            totalStudents: number;
            totalSubjects: number;
            totalTeachers: number;
            globalAverage: number;
            successRate: number;
            gradesCount: number;
            passingThreshold: number;
        };
        classAverages: Array<{
            id: number;
            className: string;
            average: number;
            gradesCount: number;
        }>;
        subjectAverages: Array<{
            id: number;
            name: string;
            average: number;
            gradesCount: number;
        }>;
        teacherPerformance: Array<{
            id: number;
            name: string;
            classesCount: number;
            subjectsCount: number;
            average: number;
            successRate: number;
            gradesCount: number;
        }>;
    };
    flash: {
        error?: string | null;
        success?: string | null;
    };
    errors: Record<string, string | undefined>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Exports de rapports', href: '/reports/exports' },
];

export default function ReportExportIndex({ filters, report }: PageProps) {
    const { flash, errors } = usePage<PageProps>().props;
    const [form, setForm] = useState(filters);

    const hasDateError = Boolean(
        form.startDate &&
            form.endDate &&
            new Date(`${form.endDate}T00:00:00`) < new Date(`${form.startDate}T00:00:00`),
    );

    const canSubmit = Boolean(form.startDate && form.endDate) && !hasDateError;
    const canExport = canSubmit && report.meta.hasAcademicData;

    const exportQuery = new URLSearchParams({
        start_date: form.startDate,
        end_date: form.endDate,
    }).toString();

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        router.get(
            '/reports/exports',
            {
                start_date: form.startDate,
                end_date: form.endDate,
            },
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exports de rapports" />

            <Stack spacing={3}>
                <PageHeader
                    eyebrow="Administration"
                    title="Exports de rapports academiques"
                    description="Selectionnez une periode, controlez l'apercu du rapport et telechargez un export PDF ou Excel strictement limite a l'etablissement connecte."
                    actions={
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip
                                color="primary"
                                variant="outlined"
                                label={`${report.stats.passingThreshold.toFixed(0)}/20 seuil de validation`}
                            />
                            <Chip
                                variant="outlined"
                                label={`${report.stats.gradesCount} note(s) retenue(s)`}
                            />
                        </Stack>
                    }
                />

                <Card component="form" onSubmit={submitFilters}>
                    <CardContent>
                        <Stack spacing={2.5}>
                            <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                spacing={2}
                                alignItems={{ xs: 'stretch', md: 'flex-end' }}
                            >
                                <TextField
                                    label="Date de debut"
                                    type="date"
                                    value={form.startDate}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            startDate: event.target.value,
                                        }))
                                    }
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(errors.start_date) || hasDateError}
                                    helperText={
                                        errors.start_date ??
                                        (hasDateError
                                            ? 'La date de fin doit etre posterieure ou egale a la date de debut.'
                                            : ' ')
                                    }
                                    fullWidth
                                />
                                <TextField
                                    label="Date de fin"
                                    type="date"
                                    value={form.endDate}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            endDate: event.target.value,
                                        }))
                                    }
                                    InputLabelProps={{ shrink: true }}
                                    error={Boolean(errors.end_date) || hasDateError}
                                    helperText={errors.end_date ?? ' '}
                                    fullWidth
                                />
                            </Stack>

                            <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                spacing={1.5}
                                justifyContent="space-between"
                                alignItems={{ xs: 'stretch', md: 'center' }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    Periode en cours: {report.meta.period.label}
                                </Typography>

                                <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
                                    <Button
                                        type="submit"
                                        variant="outlined"
                                        startIcon={<DownloadRoundedIcon />}
                                        disabled={!canSubmit}
                                    >
                                        Actualiser l'apercu
                                    </Button>
                                    <Button
                                        component="a"
                                        href={`/reports/exports/pdf?${exportQuery}`}
                                        variant="contained"
                                        startIcon={<PictureAsPdfRoundedIcon />}
                                        disabled={!canExport}
                                    >
                                        Export PDF
                                    </Button>
                                    <Button
                                        component="a"
                                        href={`/reports/exports/excel?${exportQuery}`}
                                        variant="outlined"
                                        startIcon={<TableViewRoundedIcon />}
                                        disabled={!canExport}
                                    >
                                        Export Excel
                                    </Button>
                                </Stack>
                            </Stack>

                            {flash.error ? <Alert severity="warning">{flash.error}</Alert> : null}
                            {flash.success ? <Alert severity="success">{flash.success}</Alert> : null}

                            {!report.meta.hasAcademicData ? (
                                <Alert severity="info">
                                    Aucune donnee academique n'est disponible sur la periode selectionnee.
                                </Alert>
                            ) : null}
                        </Stack>
                    </CardContent>
                </Card>

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: 'repeat(2, 1fr)',
                            xl: 'repeat(4, 1fr)',
                        },
                    }}
                >
                    <StatCard
                        label="Classes"
                        value={String(report.stats.totalClasses)}
                        caption="Classes de l'etablissement incluses dans le perimetre du rapport."
                        icon={<GroupsRoundedIcon />}
                    />
                    <StatCard
                        label="Matieres"
                        value={String(report.stats.totalSubjects)}
                        caption="Matieres rattachees a l'etablissement."
                        icon={<AutoStoriesRoundedIcon />}
                        color="secondary"
                    />
                    <StatCard
                        label="Moyenne globale"
                        value={`${report.stats.globalAverage.toFixed(2)}/20`}
                        caption="Moyenne calculee a partir des notes de la periode."
                        icon={<InsightsRoundedIcon />}
                        color="warning"
                    />
                    <StatCard
                        label="Taux de reussite"
                        value={`${report.stats.successRate.toFixed(1)}%`}
                        caption="Part des notes au-dessus du seuil de validation."
                        icon={<DownloadRoundedIcon />}
                        color={report.stats.successRate >= 50 ? 'success' : 'warning'}
                    />
                </Box>

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
                    }}
                >
                    <Card>
                        <CardContent>
                            <Stack spacing={1}>
                                <Typography variant="h5">Moyenne par classe</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Vue synthetique exploitee dans les exports pour comparer les classes.
                                </Typography>
                            </Stack>

                            <Box sx={{ mt: 3, overflowX: 'auto' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Classe</TableCell>
                                            <TableCell align="right">Moyenne</TableCell>
                                            <TableCell align="right">Notes</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {report.classAverages.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{row.className}</TableCell>
                                                <TableCell align="right">
                                                    {row.average.toFixed(2)}/20
                                                </TableCell>
                                                <TableCell align="right">
                                                    {row.gradesCount}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Stack spacing={1}>
                                <Typography variant="h5">Moyenne par matiere</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Resume reutilisable dans le PDF et la feuille Excel dediee aux matieres.
                                </Typography>
                            </Stack>

                            <Box sx={{ mt: 3, overflowX: 'auto' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Matiere</TableCell>
                                            <TableCell align="right">Moyenne</TableCell>
                                            <TableCell align="right">Notes</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {report.subjectAverages.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell align="right">
                                                    {row.average.toFixed(2)}/20
                                                </TableCell>
                                                <TableCell align="right">
                                                    {row.gradesCount}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Card>
                    <CardContent>
                        <Stack spacing={1}>
                            <Typography variant="h5">Indicateurs de performance enseignant</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Les exports reprennent les affectations classe-matiere et les resultats reels des evaluations de la periode.
                            </Typography>
                        </Stack>

                        <Box sx={{ mt: 3, overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Enseignant</TableCell>
                                        <TableCell align="right">Classes</TableCell>
                                        <TableCell align="right">Matieres</TableCell>
                                        <TableCell align="right">Moyenne</TableCell>
                                        <TableCell align="right">Reussite</TableCell>
                                        <TableCell align="right">Notes</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {report.teacherPerformance.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell align="right">{row.classesCount}</TableCell>
                                            <TableCell align="right">{row.subjectsCount}</TableCell>
                                            <TableCell align="right">
                                                {row.average.toFixed(2)}/20
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.successRate.toFixed(1)}%
                                            </TableCell>
                                            <TableCell align="right">{row.gradesCount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </CardContent>
                </Card>
            </Stack>
        </AppLayout>
    );
}

import { Head } from '@inertiajs/react';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import AcademicBarChart from '@/components/academic-dashboard/bar-chart';
import GroupedBarChart from '@/components/detailed-performance/grouped-bar-chart';
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/stat-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    stats: {
        totalSubjects: number;
        totalTeachers: number;
        globalAverage: number;
        successRate: number;
        passingThreshold: number;
        hasAcademicData: boolean;
    };
    subjectPerformance: Array<{
        id: number;
        name: string;
        average: number;
        gradesCount: number;
    }>;
    classComparison: Array<{
        className: string;
        average: number;
        gradesCount: number;
        subjectBreakdown: Array<{
            subjectId: number;
            subjectName: string;
            average: number;
            gradesCount: number;
        }>;
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
    charts: {
        subjectsAverageChart: {
            labels: string[];
            values: number[];
        };
        classesComparisonChart: {
            labels: string[];
            values: number[];
            series: Array<{
                name: string;
                values: number[];
            }>;
        };
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Analyse detaillee', href: '/performance-analysis' },
];

export default function DetailedPerformanceIndex({
    stats,
    subjectPerformance,
    classComparison,
    teacherPerformance,
    charts,
}: Props) {
    const subjectChartData = subjectPerformance
        .filter((item) => item.gradesCount > 0)
        .map((item) => ({
            label: item.name,
            value: item.average,
        }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Analyse detaillee" />

            <Stack spacing={3}>
                <PageHeader
                    eyebrow="Administration"
                    title="Analyse de performance detaillee"
                    description="Analysez les resultats par matiere, comparez les classes et identifiez les indicateurs de performance enseignant a partir des evaluations et notes existantes."
                    actions={
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip
                                color="primary"
                                variant="outlined"
                                label={`${stats.passingThreshold.toFixed(0)}/20 seuil de reussite`}
                            />
                            <Chip
                                variant="outlined"
                                label={`${teacherPerformance.length} enseignant(s) analyses`}
                            />
                        </Stack>
                    }
                />

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
                        label="Matieres analysees"
                        value={String(stats.totalSubjects)}
                        caption="Matieres rattachees a l'etablissement."
                        icon={<AutoStoriesRoundedIcon />}
                    />
                    <StatCard
                        label="Enseignants analyses"
                        value={String(stats.totalTeachers)}
                        caption="Enseignants ayant des affectations classe-matiere."
                        icon={<GroupsRoundedIcon />}
                        color="secondary"
                    />
                    <StatCard
                        label="Moyenne globale"
                        value={`${stats.globalAverage.toFixed(2)}/20`}
                        caption="Moyenne calculee sur l'ensemble des notes disponibles."
                        icon={<InsightsRoundedIcon />}
                        color="warning"
                    />
                    <StatCard
                        label="Taux de reussite"
                        value={`${stats.successRate.toFixed(1)}%`}
                        caption="Part des notes au-dessus du seuil de validation."
                        icon={<CheckCircleRoundedIcon />}
                        color={stats.successRate >= 50 ? 'success' : 'warning'}
                    />
                </Box>

                {!stats.hasAcademicData ? (
                    <Card>
                        <CardContent
                            sx={{
                                minHeight: 220,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                            }}
                        >
                            <Stack spacing={1.5} alignItems="center">
                                <Typography variant="h6">
                                    Aucune performance detaillee disponible
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Les indicateurs resteront vides tant qu'aucune note
                                    n'a ete saisie pour les classes, matieres et
                                    enseignants de cet etablissement.
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                ) : null}

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: { xs: '1fr', xl: '1.1fr 0.9fr' },
                    }}
                >
                    <Card>
                        <CardContent>
                            <Stack spacing={1}>
                                <Typography variant="h5">
                                    Moyenne par matiere
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Vue globale des matieres, avec moyenne et volume de
                                    notes utilisees dans le calcul.
                                </Typography>
                            </Stack>

                            <Box sx={{ mt: 3 }}>
                                <AcademicBarChart
                                    data={subjectChartData}
                                    emptyMessage="Aucune matiere ne dispose encore de notes exploitables."
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Stack spacing={1.5}>
                                <Typography variant="h5">
                                    Tableau des matieres
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Les matieres sans note restent visibles avec une
                                    moyenne a 0.00 pour garder une lecture complete.
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
                                        {subjectPerformance.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell align="right">
                                                    {item.average.toFixed(2)}/20
                                                </TableCell>
                                                <TableCell align="right">
                                                    {item.gradesCount}
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
                            <Typography variant="h5">
                                Comparaison inter-classes
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Lecture comparative des classes par matiere pour
                                identifier rapidement les zones fortes et les classes a
                                accompagner.
                            </Typography>
                        </Stack>

                        <Box sx={{ mt: 3 }}>
                            <GroupedBarChart
                                labels={charts.classesComparisonChart.labels}
                                series={charts.classesComparisonChart.series}
                                emptyMessage="Aucune comparaison inter-classes n'est disponible sans notes."
                            />
                        </Box>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Stack spacing={1.5}>
                            <Typography variant="h5">
                                Indicateurs de performance enseignant
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Les indicateurs sont derives des resultats des eleves
                                dans les couples classe-matiere assures par chaque
                                enseignant.
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
                                    {teacherPerformance.map((teacher) => (
                                        <TableRow key={teacher.id}>
                                            <TableCell>{teacher.name}</TableCell>
                                            <TableCell align="right">
                                                {teacher.classesCount}
                                            </TableCell>
                                            <TableCell align="right">
                                                {teacher.subjectsCount}
                                            </TableCell>
                                            <TableCell align="right">
                                                {teacher.average.toFixed(2)}/20
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    size="small"
                                                    color={
                                                        teacher.successRate >= 50
                                                            ? 'success'
                                                            : 'warning'
                                                    }
                                                    label={`${teacher.successRate.toFixed(1)}%`}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {teacher.gradesCount}
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
                        <Stack spacing={1.5}>
                            <Typography variant="h5">
                                Synthese par classe
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Resume utile pour la demo avec moyenne generale et
                                detail par matiere pour chaque classe.
                            </Typography>
                        </Stack>

                        <Box
                            sx={{
                                mt: 3,
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    md: 'repeat(2, minmax(0, 1fr))',
                                },
                            }}
                        >
                            {classComparison.map((item) => (
                                <Card key={item.className} variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6">
                                            {item.className}
                                        </Typography>
                                        <Typography
                                            variant="h4"
                                            sx={{ mt: 1.5, mb: 0.5 }}
                                        >
                                            {item.average.toFixed(2)}/20
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {item.gradesCount} note(s) exploitee(s)
                                        </Typography>

                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            useFlexGap
                                            flexWrap="wrap"
                                            sx={{ mt: 2 }}
                                        >
                                            {item.subjectBreakdown.length > 0 ? (
                                                item.subjectBreakdown.map((subject) => (
                                                    <Chip
                                                        key={`${item.className}-${subject.subjectId}`}
                                                        size="small"
                                                        variant="outlined"
                                                        label={`${subject.subjectName}: ${subject.average.toFixed(1)}`}
                                                    />
                                                ))
                                            ) : (
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label="Aucune note"
                                                />
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            </Stack>
        </AppLayout>
    );
}

import { Head } from '@inertiajs/react';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Stack,
    Typography,
} from '@mui/material';
import AcademicBarChart from '@/components/academic-dashboard/bar-chart';
import AcademicDonutChart from '@/components/academic-dashboard/donut-chart';
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/stat-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    stats: {
        totalClasses: number;
        totalStudents: number;
        successRate: number;
        studentsWithGrades: number;
        gradedClasses: number;
        passingThreshold: number;
        hasAcademicData: boolean;
    };
    averagesByClass: Array<{
        className: string;
        average: number;
        gradeCount: number;
    }>;
    charts: {
        classAverages: {
            labels: string[];
            values: number[];
        };
        successBreakdown: {
            labels: string[];
            values: number[];
        };
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard academique', href: '/academic-dashboard' },
];

export default function AcademicDashboardIndex({
    stats,
    averagesByClass,
    charts,
}: Props) {
    const chartData = averagesByClass
        .filter((item) => item.gradeCount > 0)
        .map((item) => ({
            label: item.className,
            value: item.average,
        }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard academique" />

            <Stack spacing={3}>
                <PageHeader
                    eyebrow="Administration"
                    title="Tableau de bord academique"
                    description="Suivez les performances de l'etablissement a partir des notes deja saisies, avec une vue claire sur les classes, la reussite globale et les tendances utiles a la demonstration."
                    actions={
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip
                                color="primary"
                                variant="outlined"
                                label={`${stats.passingThreshold.toFixed(0)}/20 seuil de validation`}
                            />
                            <Chip
                                variant="outlined"
                                label={`${stats.studentsWithGrades} eleves analyses`}
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
                        label="Classes"
                        value={String(stats.totalClasses)}
                        caption="Nombre total de classes dans l'etablissement."
                        icon={<ApartmentRoundedIcon />}
                    />
                    <StatCard
                        label="Eleves"
                        value={String(stats.totalStudents)}
                        caption="Nombre total d'eleves rattaches a l'etablissement."
                        icon={<GroupsRoundedIcon />}
                        color="secondary"
                    />
                    <StatCard
                        label="Taux de reussite"
                        value={`${stats.successRate.toFixed(1)}%`}
                        caption="Part des eleves ayant une moyenne generale validee."
                        icon={<CheckCircleRoundedIcon />}
                        color={stats.successRate >= 50 ? 'success' : 'warning'}
                    />
                    <StatCard
                        label="Classes notees"
                        value={String(stats.gradedClasses)}
                        caption="Classes ayant au moins une note exploitable."
                        icon={<InsightsRoundedIcon />}
                        color="warning"
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
                                    Aucune donnee academique disponible
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Les cartes restent disponibles, mais aucun calcul
                                    de moyenne ou de reussite ne peut etre produit tant
                                    qu'aucune note n'a ete saisie pour cet etablissement.
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                ) : null}

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: { xs: '1fr', xl: '1.35fr 0.85fr' },
                    }}
                >
                    <Card>
                        <CardContent>
                            <Stack spacing={1}>
                                <Typography variant="h5">
                                    Moyenne par classe
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Vue comparee des moyennes calculees a partir des
                                    notes existantes, sans inclure les classes vides dans
                                    le graphique.
                                </Typography>
                            </Stack>

                            <Box sx={{ mt: 3 }}>
                                <AcademicBarChart
                                    data={chartData}
                                    emptyMessage="Aucune classe ne dispose encore de notes exploitables."
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Stack spacing={1}>
                                <Typography variant="h5">
                                    Repartition de la reussite
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Lecture rapide du nombre d'eleves en situation de
                                    reussite par rapport au seuil de validation.
                                </Typography>
                            </Stack>

                            <Box sx={{ mt: 3 }}>
                                <AcademicDonutChart
                                    labels={charts.successBreakdown.labels}
                                    values={charts.successBreakdown.values}
                                    emptyMessage="Aucun eleve note n'est encore disponible pour calculer la reussite."
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Card>
                    <CardContent>
                        <Stack spacing={1.5}>
                            <Typography variant="h5">
                                Detail des classes
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Les classes sans note sont conservees dans la vue pour
                                ne pas casser le tableau de bord, avec une moyenne
                                affichee a 0.00 et un compteur de notes a 0.
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
                            {averagesByClass.map((item) => (
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
                                            {item.gradeCount} note(s) prise(s) en compte
                                        </Typography>
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

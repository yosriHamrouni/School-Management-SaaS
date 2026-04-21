import { Head, Link, router } from '@inertiajs/react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SourceRoundedIcon from '@mui/icons-material/SourceRounded';
import {
    Alert,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Skeleton,
    Stack,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import RiskBadge from '@/components/Risk/RiskBadge';
import RiskFeaturesPanel from '@/components/Risk/RiskFeaturesPanel';
import RiskReasonsList from '@/components/Risk/RiskReasonsList';
import PageHeader from '@/components/ui/page-header';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types/navigation';
import type { RiskOption, RiskShowResponse } from '@/utils/risk';
import { buildRiskStudentDetailsApiUrl, formatRiskDate, formatRiskScore } from '@/utils/risk';

type Props = {
    studentId: number;
    studentPreview: {
        full_name: string | null;
        student_number: string | null;
        class_name: string | null;
    };
    filters: {
        school_year_id: string;
    };
    defaults: {
        school_year_id: string;
    };
    schoolYears: RiskOption[];
    backUrl: string;
};

export default function RiskShow({
    studentId,
    studentPreview,
    filters,
    defaults,
    schoolYears,
    backUrl,
}: Props) {
    const [selectedSchoolYearId, setSelectedSchoolYearId] = useState(filters.school_year_id);
    const [response, setResponse] = useState<RiskShowResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryIndex, setRetryIndex] = useState(0);

    useEffect(() => {
        setSelectedSchoolYearId(filters.school_year_id || defaults.school_year_id);
    }, [defaults.school_year_id, filters.school_year_id]);

    useEffect(() => {
        const controller = new AbortController();

        async function loadDetails() {
            try {
                setLoading(true);
                setError(null);

                const request = await fetch(
                    buildRiskStudentDetailsApiUrl(studentId, filters.school_year_id),
                    {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        signal: controller.signal,
                        credentials: 'same-origin',
                    },
                );

                if (!request.ok) {
                    throw new Error('Impossible de charger le detail de l analyse.');
                }

                const payload = (await request.json()) as RiskShowResponse;

                setResponse(payload);
            } catch (caughtError) {
                if (controller.signal.aborted) {
                    return;
                }

                setError(
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Une erreur est survenue lors du chargement du detail.',
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadDetails();

        return () => controller.abort();
    }, [filters.school_year_id, retryIndex, studentId]);

    const student = response?.data.student;
    const prediction = response?.data.risk_prediction ?? null;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Analyse des risques', href: '/risk' },
        {
            title:
                student?.full_name
                ?? studentPreview.full_name
                ?? 'Detail eleve',
            href: `/risk/students/${studentId}/details`,
        },
    ];

    const applySchoolYearFilter = (schoolYearId: string) => {
        router.get(
            `/risk/students/${studentId}/details`,
            {
                school_year_id: schoolYearId,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail du risque eleve" />

            <Stack spacing={3}>
                <PageHeader
                    eyebrow="Module Risk"
                    title={student?.full_name ?? studentPreview.full_name ?? 'Detail de l eleve'}
                    description="Consultez les indicateurs qui expliquent le classement de l eleve et la derniere analyse disponible pour l annee scolaire selectionnee."
                    actions={
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                            <Button
                                component={Link}
                                href={backUrl}
                                variant="outlined"
                                startIcon={<ArrowBackRoundedIcon />}
                            >
                                Retour a la liste
                            </Button>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel id="risk-show-school-year-label">Annee scolaire</InputLabel>
                                <Select
                                    labelId="risk-show-school-year-label"
                                    label="Annee scolaire"
                                    value={selectedSchoolYearId}
                                    onChange={(event) => {
                                        const nextSchoolYearId = event.target.value;

                                        setSelectedSchoolYearId(nextSchoolYearId);
                                        applySchoolYearFilter(nextSchoolYearId);
                                    }}
                                >
                                    {schoolYears.map((schoolYear) => (
                                        <MenuItem key={schoolYear.id} value={String(schoolYear.id)}>
                                            {schoolYear.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    }
                />

                {error ? (
                    <Alert
                        severity="error"
                        action={
                            <Button color="inherit" size="small" onClick={() => setRetryIndex((value) => value + 1)}>
                                Reessayer
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                ) : null}

                {loading && response === null ? (
                    <Stack spacing={2}>
                        <Skeleton variant="rounded" height={140} />
                        <Skeleton variant="rounded" height={180} />
                        <Skeleton variant="rounded" height={240} />
                    </Stack>
                ) : (
                    <>
                        <Card>
                            <CardContent>
                                <Stack
                                    display="grid"
                                    gap={2}
                                    gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }}
                                >
                                    <InfoBlock
                                        label="Nom complet"
                                        value={student?.full_name ?? studentPreview.full_name ?? 'Non disponible'}
                                    />
                                    <InfoBlock
                                        label="Matricule"
                                        value={student?.student_number ?? studentPreview.student_number ?? 'Non renseigne'}
                                    />
                                    <InfoBlock
                                        label="Classe"
                                        value={student?.class?.name ?? studentPreview.class_name ?? 'Classe non renseignee'}
                                    />
                                </Stack>
                            </CardContent>
                        </Card>

                        {prediction === null ? (
                            <Card>
                                <CardContent sx={{ py: 8 }}>
                                    <Stack spacing={1.5} alignItems="center" textAlign="center">
                                        <Typography variant="h6">
                                            Aucune analyse disponible pour cet eleve
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" maxWidth={520}>
                                            Le backend n a pas encore enregistre de prediction pour l annee scolaire selectionnee.
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <Card>
                                    <CardContent>
                                        <Stack
                                            display="grid"
                                            gap={2}
                                            gridTemplateColumns={{ xs: '1fr', md: 'repeat(4, 1fr)' }}
                                        >
                                            <InfoBlock
                                                label="Niveau de risque"
                                                value={<RiskBadge level={prediction.level} />}
                                            />
                                            <InfoBlock
                                                label="Score"
                                                value={formatRiskScore(prediction.score)}
                                                icon={<InsightsRoundedIcon color="primary" fontSize="small" />}
                                            />
                                            <InfoBlock
                                                label="Source"
                                                value={prediction.source ?? 'Non disponible'}
                                                icon={<SourceRoundedIcon color="primary" fontSize="small" />}
                                            />
                                            <InfoBlock
                                                label="Derniere analyse"
                                                value={formatRiskDate(prediction.analyzed_at)}
                                                icon={<AutoGraphRoundedIcon color="primary" fontSize="small" />}
                                            />
                                        </Stack>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent>
                                        <Typography variant="h5" sx={{ mb: 1.5 }}>
                                            Causes principales
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Les raisons ci-dessous sont celles qui ont le plus contribue au classement de risque pour cet eleve.
                                        </Typography>
                                        <RiskReasonsList
                                            reasons={prediction.reasons}
                                            emptyLabel="Aucune cause detaillee n a ete remontee par le moteur."
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent>
                                        <Typography variant="h5" sx={{ mb: 1.5 }}>
                                            Features calculees
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            Lecture simplifiee des indicateurs utilises par le moteur rule-based pour etablir la prediction.
                                        </Typography>
                                        <RiskFeaturesPanel features={prediction.features} />
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </>
                )}
            </Stack>
        </AppLayout>
    );
}

function InfoBlock({
    label,
    value,
    icon,
}: {
    label: string;
    value: ReactNode;
    icon?: ReactNode;
}) {
    return (
        <Stack spacing={1.25} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
                {icon}
                <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>
                    {label}
                </Typography>
            </Stack>
            {typeof value === 'string' ? (
                <Typography variant="h6">{value}</Typography>
            ) : (
                value
            )}
        </Stack>
    );
}

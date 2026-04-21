import { Head, router } from '@inertiajs/react';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Chip, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/ui/page-header';
import RiskFilters from '@/components/Risk/RiskFilters';
import RiskStudentTable from '@/components/Risk/RiskStudentTable';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types/navigation';
import type { RiskFilters as RiskFiltersShape, RiskListResponse, RiskOption } from '@/utils/risk';
import { buildRiskStudentsApiUrl } from '@/utils/risk';

type Props = {
    filters: RiskFiltersShape;
    defaults: {
        school_year_id: string;
        per_page: string;
    };
    classes: RiskOption[];
    schoolYears: RiskOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Analyse des risques', href: '/risk' },
];

export default function RiskIndex({
    filters,
    defaults,
    classes,
    schoolYears,
}: Props) {
    const [draftFilters, setDraftFilters] = useState<RiskFiltersShape>(filters);
    const [response, setResponse] = useState<RiskListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryIndex, setRetryIndex] = useState(0);

    useEffect(() => {
        setDraftFilters(filters);
    }, [filters]);

    useEffect(() => {
        const controller = new AbortController();

        async function loadStudents() {
            try {
                setLoading(true);
                setError(null);

                const request = await fetch(buildRiskStudentsApiUrl(filters), {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: controller.signal,
                    credentials: 'same-origin',
                });

                if (!request.ok) {
                    throw new Error('Impossible de charger les analyses de risque.');
                }

                const payload = (await request.json()) as RiskListResponse;

                setResponse(payload);
            } catch (caughtError) {
                if (controller.signal.aborted) {
                    return;
                }

                setError(
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Une erreur est survenue lors du chargement.',
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadStudents();

        return () => controller.abort();
    }, [filters, retryIndex]);

    const applyFilters = () => {
        router.get(
            '/risk',
            {
                ...draftFilters,
                page: '1',
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        router.get(
            '/risk',
            {
                school_year_id: defaults.school_year_id,
                per_page: defaults.per_page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const navigatePage = (page: string) => {
        router.get(
            '/risk',
            {
                ...filters,
                page,
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
            <Head title="Analyse des risques" />

            <Stack spacing={3}>
                <PageHeader
                    eyebrow="Module Risk"
                    title="Analyse des risques"
                    description="Identifiez rapidement les eleves les plus fragiles, comprenez les causes principales et accedez au detail de chaque analyse sans quitter l espace de pilotage."
                    actions={
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip
                                color="primary"
                                variant="outlined"
                                icon={<ShieldRoundedIcon />}
                                label={`${response?.meta.total ?? 0} eleve(s) charges`}
                            />
                            <Chip
                                color="warning"
                                variant="outlined"
                                icon={<WarningAmberRoundedIcon />}
                                label="Derniere prediction par eleve"
                            />
                        </Stack>
                    }
                />

                <RiskFilters
                    values={draftFilters}
                    classes={classes}
                    schoolYears={schoolYears}
                    loading={loading}
                    onChange={(field, value) =>
                        setDraftFilters((current) => ({
                            ...current,
                            [field]: value,
                            page: field === 'page' ? value : '1',
                        }))
                    }
                    onSubmit={applyFilters}
                    onReset={resetFilters}
                />

                <RiskStudentTable
                    response={response}
                    loading={loading}
                    error={error}
                    filters={filters}
                    onRetry={() => setRetryIndex((value) => value + 1)}
                    onNavigatePage={navigatePage}
                />
            </Stack>
        </AppLayout>
    );
}

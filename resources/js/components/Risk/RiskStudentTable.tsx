import { Link } from '@inertiajs/react';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    LinearProgress,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import RiskBadge from '@/components/Risk/RiskBadge';
import RiskReasonsList from '@/components/Risk/RiskReasonsList';
import type { PaginationLink, RiskFilters, RiskListItem, RiskListResponse } from '@/utils/risk';
import { formatRiskDate, formatRiskScore } from '@/utils/risk';

type Props = {
    response: RiskListResponse | null;
    loading: boolean;
    error: string | null;
    filters: RiskFilters;
    onRetry: () => void;
    onNavigatePage: (page: string) => void;
};

function PaginationButtons({
    links,
    onNavigatePage,
}: {
    links: PaginationLink[];
    onNavigatePage: (page: string) => void;
}) {
    const numberedLinks = links.filter((link) => link.label !== '&laquo; Previous' && link.label !== 'Next &raquo;');

    return (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {numberedLinks.map((link, index) => {
                const page = extractPage(link.url);

                return (
                    <Button
                        key={`${link.label}-${index}`}
                        variant={link.active ? 'contained' : 'outlined'}
                        size="small"
                        disabled={!page || link.active}
                        onClick={() => page && onNavigatePage(page)}
                    >
                        {normalizePaginationLabel(link.label)}
                    </Button>
                );
            })}
        </Stack>
    );
}

function normalizePaginationLabel(label: string): string {
    return label
        .replace(/&laquo;/g, '<<')
        .replace(/&raquo;/g, '>>')
        .replace(/<[^>]*>/g, '')
        .trim();
}

export default function RiskStudentTable({
    response,
    loading,
    error,
    filters,
    onRetry,
    onNavigatePage,
}: Props) {
    if (loading && response === null) {
        return (
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton key={index} variant="rounded" height={64} />
                        ))}
                    </Stack>
                </CardContent>
            </Card>
        );
    }

    if (error && response === null) {
        return (
            <Alert
                severity="error"
                action={
                    <Button color="inherit" size="small" onClick={onRetry}>
                        Reessayer
                    </Button>
                }
            >
                {error}
            </Alert>
        );
    }

    const items = response?.data ?? [];

    if (items.length === 0) {
        return (
            <Card>
                {loading ? <LinearProgress /> : null}
                <CardContent sx={{ py: 8 }}>
                    <Stack spacing={1.5} alignItems="center" textAlign="center">
                        <Typography variant="h6">Aucune donnee disponible</Typography>
                        <Typography variant="body2" color="text.secondary" maxWidth={520}>
                            Aucun eleve ne correspond aux filtres actuels pour l annee selectionnee.
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            {loading ? <LinearProgress /> : null}
            <CardContent>
                {error ? (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                ) : null}

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Eleve</TableCell>
                                <TableCell>Classe</TableCell>
                                <TableCell>Niveau de risque</TableCell>
                                <TableCell>Score</TableCell>
                                <TableCell>Causes principales</TableCell>
                                <TableCell>Derniere analyse</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item) => (
                                <RiskStudentRow key={item.student_id} item={item} filters={filters} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    spacing={2}
                    sx={{ mt: 3 }}
                >
                    <Typography variant="body2" color="text.secondary">
                        {response?.meta.from ?? 0} - {response?.meta.to ?? 0} sur {response?.meta.total ?? 0} eleve(s)
                    </Typography>

                    <PaginationButtons links={response?.meta.links ?? []} onNavigatePage={onNavigatePage} />
                </Stack>
            </CardContent>
        </Card>
    );
}

function RiskStudentRow({
    item,
    filters,
}: {
    item: RiskListItem;
    filters: RiskFilters;
}) {
    const detailHref = buildDetailHref(item.student_id, filters.school_year_id);

    return (
        <TableRow hover>
            <TableCell>
                <Stack spacing={0.5}>
                    <Typography variant="subtitle2">
                        {item.full_name ?? 'Nom indisponible'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {item.student_number ?? 'Matricule non renseigne'}
                    </Typography>
                </Stack>
            </TableCell>
            <TableCell>{item.class?.name ?? 'Classe non renseignee'}</TableCell>
            <TableCell>
                <RiskBadge level={item.risk?.level} />
            </TableCell>
            <TableCell>
                <Typography variant="subtitle2">{formatRiskScore(item.risk?.score)}</Typography>
            </TableCell>
            <TableCell sx={{ minWidth: 280 }}>
                <RiskReasonsList
                    reasons={item.risk?.reasons}
                    limit={3}
                    variant="chips"
                    emptyLabel="Aucune cause detaillee"
                />
            </TableCell>
            <TableCell>{formatRiskDate(item.risk?.analyzed_at)}</TableCell>
            <TableCell align="right">
                <Button
                    component={Link}
                    href={detailHref}
                    variant="outlined"
                    size="small"
                    endIcon={<OpenInNewRoundedIcon />}
                >
                    Voir detail
                </Button>
            </TableCell>
        </TableRow>
    );
}

function buildDetailHref(studentId: number, schoolYearId: string): string {
    const params = new URLSearchParams();

    if (schoolYearId) {
        params.set('school_year_id', schoolYearId);
    }

    const query = params.toString();

    return query.length > 0
        ? `/risk/students/${studentId}/details?${query}`
        : `/risk/students/${studentId}/details`;
}

function extractPage(url: string | null): string | null {
    if (!url) {
        return null;
    }

    try {
        const parsedUrl = new URL(url);

        return parsedUrl.searchParams.get('page');
    } catch {
        return null;
    }
}

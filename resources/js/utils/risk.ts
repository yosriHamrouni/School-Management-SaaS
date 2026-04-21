export type RiskLevel = 'low' | 'medium' | 'high';

export type RiskOption = {
    id: number;
    name: string;
};

export type RiskFilters = {
    search: string;
    class_id: string;
    risk_level: string;
    school_year_id: string;
    per_page: string;
    page: string;
};

export type RiskListItem = {
    student_id: number;
    student_number: string | null;
    full_name: string | null;
    class: {
        id: number | null;
        name: string | null;
    } | null;
    risk: {
        level: RiskLevel;
        score: number;
        reasons: string[];
        source: string | null;
        analyzed_at: string | null;
    };
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type RiskListResponse = {
    data: RiskListItem[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        links: PaginationLink[];
        path: string;
        per_page: number;
        to: number | null;
        total: number;
    };
};

export type RiskStudentDetails = {
    student: {
        id: number;
        student_number: string | null;
        full_name: string | null;
        class: {
            id: number | null;
            name: string | null;
        } | null;
    };
    risk_prediction: {
        level: RiskLevel;
        score: number;
        reasons: string[];
        features: Record<string, number | null> | null;
        source: string | null;
        analyzed_at: string | null;
    } | null;
};

export type RiskShowResponse = {
    data: RiskStudentDetails;
};

export const riskLevelOptions = [
    { value: '', label: 'Tous' },
    { value: 'low', label: 'Faible' },
    { value: 'medium', label: 'Moyen' },
    { value: 'high', label: 'Eleve' },
] as const;

export const perPageOptions = [
    { value: '10', label: '10 / page' },
    { value: '15', label: '15 / page' },
    { value: '25', label: '25 / page' },
    { value: '50', label: '50 / page' },
] as const;

const featureLabels: Record<string, string> = {
    general_average: 'Moyenne generale',
    absence_count: 'Absences',
    late_count: 'Retards',
    failed_subjects_count: 'Matieres faibles',
    recent_average: 'Moyenne recente',
    average_trend: 'Tendance',
};

const featureDescriptions: Record<string, string> = {
    general_average: 'Moyenne globale observee sur les notes disponibles.',
    absence_count: 'Nombre total d absences prises en compte.',
    late_count: 'Nombre total de retards releves.',
    failed_subjects_count: 'Nombre de matieres sous le seuil de validation.',
    recent_average: 'Moyenne calculee sur les evaluations recentes.',
    average_trend: 'Evolution recente de la moyenne de l eleve.',
};

export function cleanRiskFilters(filters: Partial<RiskFilters>): Record<string, string> {
    return Object.entries(filters).reduce<Record<string, string>>((carry, [key, value]) => {
        if (value === undefined || value === null || value === '') {
            return carry;
        }

        carry[key] = String(value);

        return carry;
    }, {});
}

export function buildRiskStudentsApiUrl(filters: Partial<RiskFilters>): string {
    const params = new URLSearchParams(cleanRiskFilters(filters));

    return params.size > 0 ? `/risk/students?${params.toString()}` : '/risk/students';
}

export function buildRiskStudentDetailsApiUrl(studentId: number, schoolYearId: string): string {
    const params = new URLSearchParams(cleanRiskFilters({ school_year_id: schoolYearId }));

    return params.size > 0
        ? `/risk/students/${studentId}?${params.toString()}`
        : `/risk/students/${studentId}`;
}

export function getRiskLevelLabel(level: string | null | undefined): string {
    return (
        riskLevelOptions.find((option) => option.value === level)?.label ?? 'Inconnu'
    );
}

export function getRiskBadgeColor(level: string | null | undefined): 'success' | 'warning' | 'error' | 'default' {
    switch (level) {
        case 'low':
            return 'success';
        case 'medium':
            return 'warning';
        case 'high':
            return 'error';
        default:
            return 'default';
    }
}

export function formatRiskScore(score: number | null | undefined): string {
    if (typeof score !== 'number' || Number.isNaN(score)) {
        return '-';
    }

    return `${Math.round(score)}%`;
}

export function formatRiskDate(value: string | null | undefined): string {
    if (!value) {
        return 'Non disponible';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Non disponible';
    }

    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function getFeatureCards(features: Record<string, number | null> | null | undefined) {
    const payload = features ?? {};

    return [
        'general_average',
        'absence_count',
        'late_count',
        'failed_subjects_count',
        'recent_average',
        'average_trend',
    ].map((key) => ({
        key,
        label: featureLabels[key] ?? key,
        description: featureDescriptions[key] ?? '',
        value: formatFeatureValue(key, payload[key] ?? null),
    }));
}

export function formatFeatureValue(key: string, value: number | null | undefined): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-';
    }

    if (key === 'general_average' || key === 'recent_average') {
        return `${value.toFixed(2)} / 20`;
    }

    if (key === 'average_trend') {
        return `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
    }

    return String(value);
}

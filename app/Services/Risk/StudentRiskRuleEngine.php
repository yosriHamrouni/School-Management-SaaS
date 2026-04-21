<?php

namespace App\Services\Risk;

class StudentRiskRuleEngine
{
    public const GENERAL_AVERAGE_HIGH_RISK_THRESHOLD = 10.0;

    public const GENERAL_AVERAGE_MEDIUM_RISK_THRESHOLD = 12.0;

    public const HIGH_ABSENCE_THRESHOLD = 8;

    public const MEDIUM_ABSENCE_THRESHOLD = 4;

    public const HIGH_LATE_THRESHOLD = 6;

    public const MEDIUM_LATE_THRESHOLD = 3;

    public const FAILED_SUBJECTS_HIGH_THRESHOLD = 3;

    public const FAILED_SUBJECTS_MEDIUM_THRESHOLD = 1;

    public const NEGATIVE_TREND_THRESHOLD = -1.0;

    public const STRONG_NEGATIVE_TREND_THRESHOLD = -2.5;

    /**
     * @param  array<string, mixed>  $featurePayload
     * @return array{risk_level: string, risk_score: int, reasons: array<int, string>}
     */
    public function evaluate(array $featurePayload): array
    {
        $features = is_array($featurePayload['features'] ?? null) ? $featurePayload['features'] : [];

        $generalAverage = $this->normalizeFloat($features['general_average'] ?? 0);
        $absenceCount = $this->normalizeInt($features['absence_count'] ?? 0);
        $lateCount = $this->normalizeInt($features['late_count'] ?? 0);
        $failedSubjectsCount = $this->normalizeInt($features['failed_subjects_count'] ?? 0);
        $averageTrend = $this->normalizeFloat($features['average_trend'] ?? 0);

        $score = 0;
        $reasons = [];

        if ($generalAverage < self::GENERAL_AVERAGE_HIGH_RISK_THRESHOLD) {
            $score += 35;
            $reasons[] = 'Moyenne generale inferieure a 10';
        } elseif ($generalAverage < self::GENERAL_AVERAGE_MEDIUM_RISK_THRESHOLD) {
            $score += 15;
            $reasons[] = 'Moyenne generale fragile';
        }

        if ($absenceCount >= self::HIGH_ABSENCE_THRESHOLD) {
            $score += 25;
            $reasons[] = 'Nombre d absences eleve';
        } elseif ($absenceCount >= self::MEDIUM_ABSENCE_THRESHOLD) {
            $score += 10;
            $reasons[] = 'Absences a surveiller';
        }

        if ($lateCount >= self::HIGH_LATE_THRESHOLD) {
            $score += 10;
            $reasons[] = 'Retards frequents';
        } elseif ($lateCount >= self::MEDIUM_LATE_THRESHOLD) {
            $score += 5;
            $reasons[] = 'Retards repetes';
        }

        if ($failedSubjectsCount >= self::FAILED_SUBJECTS_HIGH_THRESHOLD) {
            $score += 20;
            $reasons[] = 'Plusieurs matieres en difficulte';
        } elseif ($failedSubjectsCount >= self::FAILED_SUBJECTS_MEDIUM_THRESHOLD) {
            $score += 10;
            $reasons[] = 'Au moins une matiere en difficulte';
        }

        if ($averageTrend <= self::STRONG_NEGATIVE_TREND_THRESHOLD) {
            $score += 15;
            $reasons[] = 'Tendance recente en forte baisse';
        } elseif ($averageTrend <= self::NEGATIVE_TREND_THRESHOLD) {
            $score += 10;
            $reasons[] = 'Tendance recente en baisse';
        }

        $riskScore = min(100, max(0, $score));

        return [
            'risk_level' => $this->resolveRiskLevel($riskScore),
            'risk_score' => $riskScore,
            'reasons' => array_values(array_unique($reasons)),
        ];
    }

    private function resolveRiskLevel(int $score): string
    {
        return match (true) {
            $score >= 60 => 'high',
            $score >= 30 => 'medium',
            default => 'low',
        };
    }

    private function normalizeFloat(mixed $value): float
    {
        return is_numeric($value) ? (float) $value : 0.0;
    }

    private function normalizeInt(mixed $value): int
    {
        return max(0, (int) $value);
    }
}

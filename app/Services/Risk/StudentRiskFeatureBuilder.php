<?php

namespace App\Services\Risk;

class StudentRiskFeatureBuilder
{
    private const PASSING_GRADE = 10.0;

    private const RECENT_GRADES_WINDOW = 3;

    /**
     * @param  array<string, mixed>  $rawStudentData
     * @return array<string, mixed>
     */
    public function build(array $rawStudentData): array
    {
        $grades = $this->normalizeGrades($rawStudentData['grades'] ?? []);

        return [
            'student_id' => (int) ($rawStudentData['student_id'] ?? 0),
            'establishment_id' => (int) ($rawStudentData['establishment_id'] ?? 0),
            'school_year_id' => (int) ($rawStudentData['school_year_id'] ?? 0),
            'features' => [
                'general_average' => $this->calculateGeneralAverage($grades),
                'absence_count' => $this->normalizeCount($rawStudentData['absences_count'] ?? 0),
                'late_count' => $this->normalizeCount($rawStudentData['lates_count'] ?? 0),
                'failed_subjects_count' => $this->calculateFailedSubjectsCount($grades),
                'recent_average' => $this->calculateRecentAverage($grades),
                'average_trend' => $this->calculateAverageTrend($grades),
            ],
        ];
    }

    /**
     * @param  iterable<int, array<string, mixed>>  $studentsRawData
     * @return array<int, array<string, mixed>>
     */
    public function buildMany(iterable $studentsRawData): array
    {
        $payloads = [];

        foreach ($studentsRawData as $rawStudentData) {
            $payloads[] = $this->build($rawStudentData);
        }

        return $payloads;
    }

    /**
     * @param  mixed  $grades
     * @return array<int, array{subject_key: string|null, value: float, recorded_at: int}>
     */
    private function normalizeGrades(mixed $grades): array
    {
        if (! is_iterable($grades)) {
            return [];
        }

        $normalized = [];

        foreach ($grades as $grade) {
            if (! is_array($grade)) {
                continue;
            }

            $value = $this->normalizeFloat($grade['value'] ?? null);

            if ($value === null) {
                continue;
            }

            $normalized[] = [
                'subject_key' => $this->resolveSubjectKey($grade),
                'value' => $value,
                'recorded_at' => $this->normalizeTimestamp($grade['recorded_at'] ?? null),
            ];
        }

        usort(
            $normalized,
            static fn (array $left, array $right): int => $left['recorded_at'] <=> $right['recorded_at'],
        );

        return $normalized;
    }

    /**
     * @param  array<int, array{subject_key: string|null, value: float, recorded_at: int}>  $grades
     */
    private function calculateGeneralAverage(array $grades): float
    {
        if ($grades === []) {
            return 0.0;
        }

        return $this->roundValue(array_sum(array_column($grades, 'value')) / count($grades));
    }

    /**
     * @param  array<int, array{subject_key: string|null, value: float, recorded_at: int}>  $grades
     */
    private function calculateFailedSubjectsCount(array $grades): int
    {
        if ($grades === []) {
            return 0;
        }

        $subjectBuckets = [];

        foreach ($grades as $grade) {
            if ($grade['subject_key'] === null) {
                continue;
            }

            $subjectBuckets[$grade['subject_key']][] = $grade['value'];
        }

        $failedSubjects = 0;

        foreach ($subjectBuckets as $values) {
            if ($values === []) {
                continue;
            }

            $average = array_sum($values) / count($values);

            if ($average < self::PASSING_GRADE) {
                $failedSubjects++;
            }
        }

        return $failedSubjects;
    }

    /**
     * @param  array<int, array{subject_key: string|null, value: float, recorded_at: int}>  $grades
     */
    private function calculateRecentAverage(array $grades): float
    {
        if ($grades === []) {
            return 0.0;
        }

        $recentGrades = array_slice($grades, -self::RECENT_GRADES_WINDOW);

        return $this->roundValue(array_sum(array_column($recentGrades, 'value')) / count($recentGrades));
    }

    /**
     * @param  array<int, array{subject_key: string|null, value: float, recorded_at: int}>  $grades
     */
    private function calculateAverageTrend(array $grades): float
    {
        $gradeCount = count($grades);

        if ($gradeCount < 4) {
            return 0.0;
        }

        $splitIndex = intdiv($gradeCount, 2);
        $olderGrades = array_slice($grades, 0, $splitIndex);
        $recentGrades = array_slice($grades, $splitIndex);

        if ($olderGrades === [] || $recentGrades === []) {
            return 0.0;
        }

        $olderAverage = array_sum(array_column($olderGrades, 'value')) / count($olderGrades);
        $recentAverage = array_sum(array_column($recentGrades, 'value')) / count($recentGrades);

        return $this->roundValue($recentAverage - $olderAverage);
    }

    private function normalizeCount(mixed $value): int
    {
        return max(0, (int) $value);
    }

    private function normalizeFloat(mixed $value): ?float
    {
        if (! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }

    /**
     * @param  array<string, mixed>  $grade
     */
    private function resolveSubjectKey(array $grade): ?string
    {
        if (isset($grade['subject_id']) && is_numeric($grade['subject_id'])) {
            return 'id:'.(int) $grade['subject_id'];
        }

        if (isset($grade['subject_name']) && is_string($grade['subject_name']) && $grade['subject_name'] !== '') {
            return 'name:'.$grade['subject_name'];
        }

        return null;
    }

    private function normalizeTimestamp(mixed $value): int
    {
        if (! is_string($value) || $value === '') {
            return 0;
        }

        $timestamp = strtotime($value);

        return $timestamp !== false ? $timestamp : 0;
    }

    private function roundValue(float $value): float
    {
        return round($value, 2);
    }
}

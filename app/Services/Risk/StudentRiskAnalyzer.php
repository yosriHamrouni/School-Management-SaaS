<?php

namespace App\Services\Risk;

use App\Models\StudentRiskPrediction;
use Illuminate\Support\Collection;

class StudentRiskAnalyzer
{
    private const SOURCE_RULE_BASED = 'rule_based';

    private const SOURCE_ML = 'ml';

    public function __construct(
        private readonly StudentRiskDataService $studentRiskDataService,
        private readonly StudentRiskFeatureBuilder $studentRiskFeatureBuilder,
        private readonly StudentRiskRuleEngine $studentRiskRuleEngine,
        private readonly StudentRiskMlPredictor $studentRiskMlPredictor,
    ) {
    }

    public function analyzeStudent(int $studentId, int $establishmentId, int $schoolYearId): ?StudentRiskPrediction
    {
        $rawData = $this->studentRiskDataService->getStudentRawData($studentId, $establishmentId, $schoolYearId);

        if ($rawData === null) {
            return null;
        }

        $featurePayload = $this->studentRiskFeatureBuilder->build($rawData);
        $evaluation = $this->evaluateWithMlOrFallback($featurePayload);

        return $this->persistPrediction($rawData, $featurePayload, $evaluation);
    }

    /**
     * @param  array<int, int>|null  $studentIds
     * @return Collection<int, StudentRiskPrediction>
     */
    public function analyzeStudents(int $establishmentId, int $schoolYearId, ?array $studentIds = null): Collection
    {
        $rawStudentsData = $this->studentRiskDataService->getStudentsRawData(
            $establishmentId,
            $schoolYearId,
            $studentIds,
        );

        if ($rawStudentsData->isEmpty()) {
            return collect();
        }

        return $rawStudentsData
            ->map(function (array $rawData): StudentRiskPrediction {
                $featurePayload = $this->studentRiskFeatureBuilder->build($rawData);
                $evaluation = $this->evaluateWithMlOrFallback($featurePayload);

                return $this->persistPrediction($rawData, $featurePayload, $evaluation);
            })
            ->values();
    }

    /**
     * @param  array<string, mixed>  $featurePayload
     * @return array{risk_level: string, risk_score: int, reasons: array<int, string>, source: string}
     */
    private function evaluateWithMlOrFallback(array $featurePayload): array
    {
        $ruleEvaluation = $this->evaluateWithRules($featurePayload);
        $features = is_array($featurePayload['features'] ?? null) ? $featurePayload['features'] : [];
        $mlPrediction = $this->studentRiskMlPredictor->predict($features);

        if ($mlPrediction !== null) {
            return [
                'risk_level' => $mlPrediction['prediction'],
                'risk_score' => $this->normalizeMlScore($mlPrediction['score']),
                'reasons' => $ruleEvaluation['reasons'],
                'source' => self::SOURCE_ML,
            ];
        }

        return [
            ...$ruleEvaluation,
            'source' => self::SOURCE_RULE_BASED,
        ];
    }

    /**
     * @param  array<string, mixed>  $featurePayload
     * @return array{risk_level: string, risk_score: int, reasons: array<int, string>}
     */
    private function evaluateWithRules(array $featurePayload): array
    {
        return $this->studentRiskRuleEngine->evaluate($featurePayload);
    }

    private function normalizeMlScore(float $score): int
    {
        $normalized = $score <= 1.0 ? $score * 100 : $score;

        return (int) round(min(100, max(0, $normalized)));
    }

    /**
     * Phase 2 keeps full history so each re-analysis creates a new snapshot.
     *
     * @param  array<string, mixed>  $rawData
     * @param  array<string, mixed>  $featurePayload
     * @param  array{risk_level: string, risk_score: int, reasons: array<int, string>, source: string}  $evaluation
     */
    private function persistPrediction(
        array $rawData,
        array $featurePayload,
        array $evaluation,
    ): StudentRiskPrediction {
        return StudentRiskPrediction::query()->create([
            'student_id' => (int) $rawData['student_id'],
            'establishment_id' => (int) $rawData['establishment_id'],
            'school_year_id' => (int) $rawData['school_year_id'],
            'risk_level' => (string) $evaluation['risk_level'],
            'risk_score' => (int) $evaluation['risk_score'],
            'reasons' => array_values($evaluation['reasons']),
            'features' => is_array($featurePayload['features'] ?? null) ? $featurePayload['features'] : [],
            'source' => (string) $evaluation['source'],
            'analyzed_at' => now(),
        ]);
    }
}

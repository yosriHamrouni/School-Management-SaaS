<?php

namespace App\Console\Commands;

use App\Services\Risk\StudentRiskDataService;
use App\Services\Risk\StudentRiskFeatureBuilder;
use App\Services\Risk\StudentRiskRuleEngine;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ExportStudentRiskDataset extends Command
{
    private const CSV_HEADERS = [
        'student_id',
        'school_year_id',
        'general_average',
        'absence_count',
        'late_count',
        'failed_subjects_count',
        'recent_average',
        'average_trend',
        'risk_label',
    ];

    protected $signature = 'risk:export-dataset
        {establishment_id : Identifiant de l\'etablissement}
        {school_year_id : Identifiant de l\'annee scolaire}
        {--path= : Chemin absolu ou relatif du fichier CSV de sortie}';

    protected $description = 'Exporte un dataset CSV de risque eleve pour l entrainement ML.';

    public function __construct(
        private readonly StudentRiskDataService $studentRiskDataService,
        private readonly StudentRiskFeatureBuilder $studentRiskFeatureBuilder,
        private readonly StudentRiskRuleEngine $studentRiskRuleEngine,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $establishmentId = (int) $this->argument('establishment_id');
        $schoolYearId = (int) $this->argument('school_year_id');
        $outputPath = $this->resolveOutputPath($establishmentId, $schoolYearId);

        $rows = $this->studentRiskDataService->getStudentsRawData($establishmentId, $schoolYearId);

        File::ensureDirectoryExists(dirname($outputPath));

        $handle = fopen($outputPath, 'wb');

        if ($handle === false) {
            $this->error('Impossible de creer le fichier CSV: '.$outputPath);

            return self::FAILURE;
        }

        try {
            fputcsv($handle, self::CSV_HEADERS);

            $exportedCount = 0;

            foreach ($rows as $rawData) {
                $featurePayload = $this->studentRiskFeatureBuilder->build($rawData);
                $evaluation = $this->studentRiskRuleEngine->evaluate($featurePayload);

                fputcsv($handle, $this->buildCsvRow($featurePayload, $schoolYearId, $evaluation['risk_level'] ?? 'low'));
                $exportedCount++;
            }
        } finally {
            fclose($handle);
        }

        if ($rows->isEmpty()) {
            $this->warn('Aucun eleve exporte pour cet etablissement et cette annee scolaire.');
        }

        $this->info(sprintf('Dataset exporte: %d eleve(s).', $exportedCount));
        $this->line('Fichier genere: '.$outputPath);

        return self::SUCCESS;
    }

    private function resolveOutputPath(int $establishmentId, int $schoolYearId): string
    {
        $customPath = $this->option('path');

        if (is_string($customPath) && trim($customPath) !== '') {
            return $this->normalizePath($customPath);
        }

        return storage_path(sprintf(
            'app/risk/student-risk-dataset-establishment-%d-school-year-%d-%s.csv',
            $establishmentId,
            $schoolYearId,
            now()->format('Ymd_His'),
        ));
    }

    private function normalizePath(string $path): string
    {
        if (preg_match('/^[A-Za-z]:\\\\/', $path) === 1 || str_starts_with($path, DIRECTORY_SEPARATOR)) {
            return $path;
        }

        return base_path($path);
    }

    /**
     * @param  array<string, mixed>  $featurePayload
     * @return array<int, float|int|string>
     */
    private function buildCsvRow(array $featurePayload, int $schoolYearId, string $riskLabel): array
    {
        $features = is_array($featurePayload['features'] ?? null) ? $featurePayload['features'] : [];

        return [
            (int) ($featurePayload['student_id'] ?? 0),
            (int) ($featurePayload['school_year_id'] ?? $schoolYearId),
            $this->normalizeFloat($features['general_average'] ?? 0),
            $this->normalizeInt($features['absence_count'] ?? 0),
            $this->normalizeInt($features['late_count'] ?? 0),
            $this->normalizeInt($features['failed_subjects_count'] ?? 0),
            $this->normalizeFloat($features['recent_average'] ?? 0),
            $this->normalizeFloat($features['average_trend'] ?? 0),
            $this->normalizeRiskLabel($riskLabel),
        ];
    }

    private function normalizeFloat(mixed $value): float
    {
        return is_numeric($value) ? round((float) $value, 2) : 0.0;
    }

    private function normalizeInt(mixed $value): int
    {
        return max(0, (int) $value);
    }

    private function normalizeRiskLabel(mixed $value): string
    {
        $label = is_string($value) ? strtolower($value) : 'low';

        return in_array($label, ['low', 'medium', 'high'], true) ? $label : 'low';
    }
}

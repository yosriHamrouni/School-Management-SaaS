<?php

namespace App\Http\Resources\Risk;

use App\Models\StudentProfile;
use App\Models\StudentRiskPrediction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin array{student: StudentProfile, risk_prediction: StudentRiskPrediction|null}
 */
class RiskStudentShowResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var StudentProfile $student */
        $student = $this['student'];
        /** @var StudentRiskPrediction|null $prediction */
        $prediction = $this['risk_prediction'];

        return [
            'student' => [
                'id' => (int) $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->name,
                'class' => [
                    'id' => $student->schoolClass?->id,
                    'name' => $student->schoolClass?->name,
                ],
            ],
            'risk_prediction' => $prediction === null ? null : [
                'level' => $prediction->risk_level,
                'score' => $prediction->risk_score,
                'reasons' => $prediction->reasons ?? [],
                'features' => $prediction->features ?? [],
                'source' => $prediction->source,
                'analyzed_at' => $prediction->analyzed_at?->toISOString(),
            ],
        ];
    }
}

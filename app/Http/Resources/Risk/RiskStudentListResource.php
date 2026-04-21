<?php

namespace App\Http\Resources\Risk;

use App\Models\StudentRiskPrediction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StudentRiskPrediction
 */
class RiskStudentListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'student_id' => (int) $this->student_id,
            'student_number' => $this->student?->student_number,
            'full_name' => $this->student?->user?->name,
            'class' => [
                'id' => $this->student?->schoolClass?->id,
                'name' => $this->student?->schoolClass?->name,
            ],
            'risk' => [
                'level' => $this->risk_level,
                'score' => $this->risk_score,
                'reasons' => $this->reasons ?? [],
                'source' => $this->source,
                'analyzed_at' => $this->analyzed_at?->toISOString(),
            ],
        ];
    }
}

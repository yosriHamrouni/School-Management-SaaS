<?php

namespace App\Http\Requests\Risk;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexRiskStudentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $establishmentId = (int) $this->user()->establishment_id;

        return [
            'school_year_id' => [
                'nullable',
                'integer',
                Rule::exists('academic_years', 'id')->where(
                    fn ($query) => $query->where('establishment_id', $establishmentId),
                ),
            ],
            'class_id' => [
                'nullable',
                'integer',
                Rule::exists('classes', 'id')->where(
                    fn ($query) => $query->where('establishment_id', $establishmentId),
                ),
            ],
            'risk_level' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}

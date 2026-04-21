<?php

namespace App\Http\Requests\Risk;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ShowRiskStudentRequest extends FormRequest
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
        ];
    }
}

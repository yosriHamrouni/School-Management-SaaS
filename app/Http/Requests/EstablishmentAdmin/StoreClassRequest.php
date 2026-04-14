<?php

namespace App\Http\Requests\EstablishmentAdmin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $establishmentId = $this->user()?->establishment_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'level_id' => [
                'required',
                'integer',
                Rule::exists('levels', 'id')->where(
                    fn ($query) => $query->where('establishment_id', $establishmentId),
                ),
            ],
            'academic_year_id' => [
                'required',
                'integer',
                Rule::exists('academic_years', 'id')->where(
                    fn ($query) => $query->where('establishment_id', $establishmentId),
                ),
            ],
        ];
    }
}

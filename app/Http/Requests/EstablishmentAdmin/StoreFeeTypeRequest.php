<?php

namespace App\Http\Requests\EstablishmentAdmin;

use App\Models\FeeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeeTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(FeeType::TYPES)],
            'description' => ['nullable', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
            'frequency' => ['required', Rule::in(FeeType::FREQUENCIES)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

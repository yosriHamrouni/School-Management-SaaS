<?php

namespace App\Http\Requests\EstablishmentAdmin;

use Illuminate\Foundation\Http\FormRequest;

class StoreTeacherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'assignments' => ['nullable', 'array'],
            'assignments.*' => ['string', 'regex:/^\d+:\d+$/'],
        ];
    }
}

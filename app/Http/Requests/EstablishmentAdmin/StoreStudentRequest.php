<?php

namespace App\Http\Requests\EstablishmentAdmin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $establishmentId = (int) $this->user()->establishment_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'class_id' => [
                'nullable',
                'integer',
                Rule::exists('classes', 'id')->where(
                    fn ($query) => $query->where('establishment_id', $establishmentId),
                ),
            ],
            'student_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('student_profiles', 'student_number')
                    ->whereNull('deleted_at'),
            ],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:50'],
            'enrollment_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:100'],
            'photo_url' => ['nullable', 'string', 'max:255'],
        ];
    }
}

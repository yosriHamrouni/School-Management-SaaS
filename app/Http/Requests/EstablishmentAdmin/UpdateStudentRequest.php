<?php

namespace App\Http\Requests\EstablishmentAdmin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var User $student */
        $student = $this->route('student');
        $studentProfileId = $student->studentProfile?->id;
        $establishmentId = (int) $this->user()->establishment_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($student->id),
            ],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
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
                    ->whereNull('deleted_at')
                    ->ignore($studentProfileId),
            ],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:50'],
            'enrollment_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:100'],
            'photo_url' => ['nullable', 'string', 'max:255'],
        ];
    }
}

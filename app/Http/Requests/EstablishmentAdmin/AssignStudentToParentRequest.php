<?php

namespace App\Http\Requests\EstablishmentAdmin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class AssignStudentToParentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator): void {
                $studentId = $this->integer('student_id');
                $establishmentId = $this->user()?->establishment_id;

                if ($studentId === 0 || $establishmentId === null) {
                    return;
                }

                $isValidStudent = User::query()
                    ->whereKey($studentId)
                    ->where('establishment_id', $establishmentId)
                    ->whereHas('roles', fn ($query) => $query->where('name', 'student'))
                    ->exists();

                if (! $isValidStudent) {
                    $validator->errors()->add('student_id', 'Selected student is invalid for this establishment.');
                }
            },
        ];
    }
}

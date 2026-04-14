<?php

namespace App\Http\Requests\EstablishmentAdmin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreParentRequest extends FormRequest
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
            'student_ids' => ['nullable', 'array'],
            'student_ids.*' => ['integer', 'exists:users,id'],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator): void {
                $establishmentId = $this->user()?->establishment_id;
                $studentIds = $this->input('student_ids', []);

                if ($studentIds === []) {
                    return;
                }

                $validStudentCount = User::query()
                    ->whereIn('id', $studentIds)
                    ->where('establishment_id', $establishmentId)
                    ->whereHas('roles', fn ($query) => $query->where('name', 'student'))
                    ->count();

                if ($validStudentCount !== count($studentIds)) {
                    $validator->errors()->add('student_ids', 'Selected students are invalid for this establishment.');
                }
            },
        ];
    }
}

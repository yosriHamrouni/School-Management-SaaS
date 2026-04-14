<?php

namespace App\Http\Requests\EstablishmentAdmin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeacherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var User $teacher */
        $teacher = $this->route('teacher');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($teacher->id),
            ],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'assignments' => ['nullable', 'array'],
            'assignments.*' => ['string', 'regex:/^\d+:\d+$/'],
        ];
    }
}

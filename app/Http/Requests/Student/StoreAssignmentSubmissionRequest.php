<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssignmentSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('student') ?? false;
    }

    public function rules(): array
    {
        return [
            'submission_text' => ['nullable', 'string'],
            'attachment' => [
                'required',
                'file',
                'max:10240',
                'mimes:pdf,doc,docx,png,jpg,jpeg,zip,txt',
            ],
        ];
    }
}

<?php

namespace App\Http\Requests\Messaging;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'receiver_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(
                    fn ($query) => $query->where('establishment_id', $this->user()?->establishment_id),
                ),
            ],
            'content' => ['required', 'string', 'max:5000'],
        ];
    }
}

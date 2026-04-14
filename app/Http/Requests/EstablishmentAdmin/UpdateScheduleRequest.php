<?php

namespace App\Http\Requests\EstablishmentAdmin;

use App\Http\Requests\EstablishmentAdmin\Concerns\InteractsWithScheduleValidation;
use Illuminate\Foundation\Http\FormRequest;

class UpdateScheduleRequest extends FormRequest
{
    use InteractsWithScheduleValidation;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return $this->scheduleRules();
    }
}

<?php

namespace App\Http\Requests\Reports;

use App\Services\AcademicReportExportService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

class ExportAcademicReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null
            && ($this->user()->hasRole('establishment_admin') || $this->user()->hasRole('admin'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function messages(): array
    {
        return [
            'end_date.after_or_equal' => 'La date de fin doit etre posterieure ou egale a la date de debut.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validationData(): array
    {
        $data = parent::validationData();

        if ($this->user() === null) {
            return $data;
        }

        $defaults = app(AcademicReportExportService::class)->defaultRangeFor($this->user());

        return [
            ...$data,
            'start_date' => $data['start_date'] ?? $defaults['start_date'],
            'end_date' => $data['end_date'] ?? $defaults['end_date'],
        ];
    }

    public function startDate(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->validated('start_date'))->startOfDay();
    }

    public function endDate(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->validated('end_date'))->endOfDay();
    }
}

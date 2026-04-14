<?php

namespace App\Exports\Support;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ArraySheetExport implements FromArray, ShouldAutoSize, WithStyles, WithTitle
{
    /**
     * @param  array<int, string>  $headers
     * @param  array<int, array<int, string|int|float>>  $rows
     */
    public function __construct(
        private readonly string $title,
        private readonly array $headers,
        private readonly array $rows,
    ) {
    }

    /**
     * @return array<int, array<int, string|int|float>>
     */
    public function array(): array
    {
        return [
            $this->headers,
            ...$this->rows,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true],
            ],
        ];
    }

    public function title(): string
    {
        return $this->title;
    }
}

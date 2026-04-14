<?php

namespace App\Exports;

use App\Exports\Support\ArraySheetExport;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class AcademicReportExport implements WithMultipleSheets
{
    /**
     * @param  array<string, mixed>  $report
     */
    public function __construct(
        private readonly array $report,
    ) {
    }

    public function sheets(): array
    {
        $meta = $this->report['meta'];
        $stats = $this->report['stats'];

        return [
            new ArraySheetExport(
                'Overview',
                ['Metric', 'Value'],
                [
                    ['Establishment', $meta['establishmentName']],
                    ['Period', $meta['period']['label']],
                    ['Generated at', $meta['generatedAt']],
                    ['Total classes', $stats['totalClasses']],
                    ['Total students', $stats['totalStudents']],
                    ['Total subjects', $stats['totalSubjects']],
                    ['Total teachers', $stats['totalTeachers']],
                    ['Global average', $stats['globalAverage']],
                    ['Success rate', $stats['successRate']],
                    ['Grades used', $stats['gradesCount']],
                ],
            ),
            new ArraySheetExport(
                'Classes',
                ['Class', 'Average', 'Grades count'],
                array_map(
                    fn (array $row) => [
                        $row['className'],
                        $row['average'],
                        $row['gradesCount'],
                    ],
                    $this->report['classAverages'],
                ),
            ),
            new ArraySheetExport(
                'Subjects',
                ['Subject', 'Average', 'Grades count'],
                array_map(
                    fn (array $row) => [
                        $row['name'],
                        $row['average'],
                        $row['gradesCount'],
                    ],
                    $this->report['subjectAverages'],
                ),
            ),
            new ArraySheetExport(
                'Teachers',
                ['Teacher', 'Classes count', 'Subjects count', 'Average', 'Success rate', 'Grades count'],
                array_map(
                    fn (array $row) => [
                        $row['name'],
                        $row['classesCount'],
                        $row['subjectsCount'],
                        $row['average'],
                        $row['successRate'],
                        $row['gradesCount'],
                    ],
                    $this->report['teacherPerformance'],
                ),
            ),
        ];
    }
}

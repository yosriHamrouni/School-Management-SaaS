<?php

namespace App\Http\Controllers;

use App\Exports\AcademicReportExport;
use App\Http\Requests\Reports\ExportAcademicReportRequest;
use App\Services\AcademicReportExportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AcademicReportExportController extends Controller
{
    public function __construct(
        private readonly AcademicReportExportService $reportService,
    ) {
    }

    public function index(ExportAcademicReportRequest $request): Response
    {
        $report = $this->reportService->buildFor(
            $request->user(),
            $request->startDate(),
            $request->endDate(),
        );

        return Inertia::render('Reports/Export', [
            'filters' => [
                'startDate' => $request->validated('start_date'),
                'endDate' => $request->validated('end_date'),
            ],
            'report' => $report,
        ]);
    }

    public function pdf(ExportAcademicReportRequest $request): HttpResponse|RedirectResponse
    {
        $report = $this->reportService->buildFor(
            $request->user(),
            $request->startDate(),
            $request->endDate(),
        );

        if (! $report['meta']['hasAcademicData']) {
            return $this->redirectBackWithNoData($request);
        }

        $pdf = Pdf::loadView('reports.exports.academic-report', [
            'report' => $report,
        ])->setPaper('a4');

        return $pdf->download(
            $this->reportService->fileName($request->startDate(), $request->endDate(), 'pdf'),
        );
    }

    public function excel(ExportAcademicReportRequest $request): BinaryFileResponse|RedirectResponse
    {
        $report = $this->reportService->buildFor(
            $request->user(),
            $request->startDate(),
            $request->endDate(),
        );

        if (! $report['meta']['hasAcademicData']) {
            return $this->redirectBackWithNoData($request);
        }

        return Excel::download(
            new AcademicReportExport($report),
            $this->reportService->fileName($request->startDate(), $request->endDate(), 'xlsx'),
        );
    }

    private function redirectBackWithNoData(ExportAcademicReportRequest $request): RedirectResponse
    {
        return redirect()
            ->route('reports.exports.index', [
                'start_date' => $request->validated('start_date'),
                'end_date' => $request->validated('end_date'),
            ])
            ->with('error', "Aucune donnee academique n'est disponible pour la periode selectionnee.");
    }
}

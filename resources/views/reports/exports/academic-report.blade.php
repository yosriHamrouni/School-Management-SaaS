<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Academic Report</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #1f2937;
            margin: 28px;
        }
        h1, h2, h3, p {
            margin: 0;
        }
        .header {
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid #d1d5db;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 6px;
        }
        .meta {
            color: #4b5563;
            line-height: 1.5;
        }
        .section {
            margin-top: 22px;
        }
        .section h2 {
            font-size: 16px;
            margin-bottom: 10px;
        }
        .stats-grid {
            width: 100%;
            border-collapse: collapse;
        }
        .stats-grid td {
            border: 1px solid #e5e7eb;
            padding: 10px 12px;
        }
        .stats-label {
            width: 38%;
            color: #4b5563;
        }
        table.report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        .report-table th,
        .report-table td {
            border: 1px solid #e5e7eb;
            padding: 8px 10px;
            text-align: left;
        }
        .report-table th {
            background: #f3f4f6;
            font-weight: bold;
        }
        .report-table td.numeric,
        .report-table th.numeric {
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Rapport academique exporte</div>
        <p class="meta">Etablissement : {{ $report['meta']['establishmentName'] }}</p>
        <p class="meta">Periode : {{ $report['meta']['period']['label'] }}</p>
        <p class="meta">Genere le : {{ $report['meta']['generatedAt'] }}</p>
    </div>

    <div class="section">
        <h2>Statistiques principales</h2>
        <table class="stats-grid">
            <tbody>
                <tr>
                    <td class="stats-label">Classes</td>
                    <td>{{ $report['stats']['totalClasses'] }}</td>
                    <td class="stats-label">Eleves</td>
                    <td>{{ $report['stats']['totalStudents'] }}</td>
                </tr>
                <tr>
                    <td class="stats-label">Matieres</td>
                    <td>{{ $report['stats']['totalSubjects'] }}</td>
                    <td class="stats-label">Enseignants</td>
                    <td>{{ $report['stats']['totalTeachers'] }}</td>
                </tr>
                <tr>
                    <td class="stats-label">Moyenne globale</td>
                    <td>{{ number_format($report['stats']['globalAverage'], 2) }}/20</td>
                    <td class="stats-label">Taux de reussite</td>
                    <td>{{ number_format($report['stats']['successRate'], 1) }}%</td>
                </tr>
                <tr>
                    <td class="stats-label">Notes utilisees</td>
                    <td>{{ $report['stats']['gradesCount'] }}</td>
                    <td class="stats-label">Seuil de validation</td>
                    <td>{{ number_format($report['stats']['passingThreshold'], 0) }}/20</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Moyennes par classe</h2>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Classe</th>
                    <th class="numeric">Moyenne</th>
                    <th class="numeric">Nombre de notes</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($report['classAverages'] as $row)
                    <tr>
                        <td>{{ $row['className'] }}</td>
                        <td class="numeric">{{ number_format($row['average'], 2) }}/20</td>
                        <td class="numeric">{{ $row['gradesCount'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Moyennes par matiere</h2>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Matiere</th>
                    <th class="numeric">Moyenne</th>
                    <th class="numeric">Nombre de notes</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($report['subjectAverages'] as $row)
                    <tr>
                        <td>{{ $row['name'] }}</td>
                        <td class="numeric">{{ number_format($row['average'], 2) }}/20</td>
                        <td class="numeric">{{ $row['gradesCount'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Indicateurs enseignant</h2>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Enseignant</th>
                    <th class="numeric">Classes</th>
                    <th class="numeric">Matieres</th>
                    <th class="numeric">Moyenne</th>
                    <th class="numeric">Taux de reussite</th>
                    <th class="numeric">Nombre de notes</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($report['teacherPerformance'] as $row)
                    <tr>
                        <td>{{ $row['name'] }}</td>
                        <td class="numeric">{{ $row['classesCount'] }}</td>
                        <td class="numeric">{{ $row['subjectsCount'] }}</td>
                        <td class="numeric">{{ number_format($row['average'], 2) }}/20</td>
                        <td class="numeric">{{ number_format($row['successRate'], 1) }}%</td>
                        <td class="numeric">{{ $row['gradesCount'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</body>
</html>

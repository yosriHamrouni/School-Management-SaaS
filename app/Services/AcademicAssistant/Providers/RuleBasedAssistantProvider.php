<?php

namespace App\Services\AcademicAssistant\Providers;

use Illuminate\Support\Str;

class RuleBasedAssistantProvider implements AssistantProviderInterface
{
    public function generate(string $question, array $context): ?string
    {
        $q = Str::ascii(Str::lower($question));

        if ($this->containsAny($q, ['moyenne', 'note', 'notes'])) {
            return $this->gradesAnswer($context);
        }

        if ($this->containsAny($q, ['absence', 'absences'])) {
            return $this->attendanceAnswer($context, 'absences');
        }

        if ($this->containsAny($q, ['retard', 'retards'])) {
            return $this->attendanceAnswer($context, 'retards');
        }

        if ($this->containsAny($q, ['risque', 'eleve a risque', 'eleves a risque'])) {
            return $this->riskAnswer($context);
        }

        if ($this->containsAny($q, ['resume', 'statistique', 'statistiques', 'bilan', 'synthese'])) {
            return $this->summaryAnswer($context);
        }

        if ($this->containsAny($q, ['classe', 'classes', 'eleve', 'eleves'])) {
            return $this->classesAndStudentsAnswer($context);
        }

        return "Bonjour. Je peux vous aider sur les notes, les moyennes, les absences, les retards, les classes et les eleves a risque, uniquement avec les donnees auxquelles vous avez acces.";
    }

    private function gradesAnswer(array $context): string
    {
        $grades = $context['grades'] ?? [];
        $available = (bool) ($grades['available'] ?? false);
        $count = (int) ($grades['count'] ?? 0);
        $average = $grades['average'] ?? null;

        if (! $available || $count === 0 || $average === null) {
            return "Je n'ai pas trouve de notes accessibles dans votre perimetre. Les reponses restent limitees aux donnees autorisees de votre etablissement.";
        }

        return sprintf(
            'Dans votre perimetre autorise, %d note(s) sont disponibles. La moyenne generale est de %.2f/20.',
            $count,
            (float) $average,
        );
    }

    private function attendanceAnswer(array $context, string $focus): string
    {
        $attendance = $context['attendance'] ?? [];
        $absences = (int) ($attendance['absences'] ?? 0);
        $late = (int) ($attendance['late'] ?? 0);
        $records = (int) ($attendance['records'] ?? ($absences + $late));

        if ($focus === 'absences') {
            return sprintf(
                'Dans votre perimetre autorise, je compte %d absence(s), sur %d enregistrement(s) d assiduite.',
                $absences,
                $records,
            );
        }

        return sprintf(
            'Dans votre perimetre autorise, je compte %d retard(s), sur %d enregistrement(s) d assiduite.',
            $late,
            $records,
        );
    }

    private function riskAnswer(array $context): string
    {
        $risk = $context['risk'] ?? [];
        $available = (bool) ($risk['available'] ?? (($risk['high'] ?? 0) > 0 || ($risk['medium'] ?? 0) > 0));

        if (! $available) {
            return "Le module de detection des eleves a risque ne contient pas encore d'informations accessibles dans votre perimetre.";
        }

        return sprintf(
            'Le module de risque signale %d eleve(s) a risque eleve et %d eleve(s) a risque moyen dans votre perimetre autorise.',
            (int) ($risk['high'] ?? 0),
            (int) ($risk['medium'] ?? 0),
        );
    }

    private function summaryAnswer(array $context): string
    {
        $classes = (int) ($context['classes']['count'] ?? 0);
        $students = (int) ($context['students']['count'] ?? 0);
        $grades = $context['grades'] ?? [];
        $attendance = $context['attendance'] ?? [];
        $risk = $context['risk'] ?? [];

        $average = ($grades['available'] ?? false) && ($grades['average'] ?? null) !== null
            ? sprintf('%.2f/20', (float) $grades['average'])
            : 'non disponible';

        return sprintf(
            'Resume academique dans votre perimetre autorise : %d classe(s), %d eleve(s), %d note(s), moyenne %s, %d absence(s), %d retard(s), %d risque(s) eleve(s) et %d risque(s) moyen(s).',
            $classes,
            $students,
            (int) ($grades['count'] ?? 0),
            $average,
            (int) ($attendance['absences'] ?? 0),
            (int) ($attendance['late'] ?? 0),
            (int) ($risk['high'] ?? 0),
            (int) ($risk['medium'] ?? 0),
        );
    }

    private function classesAndStudentsAnswer(array $context): string
    {
        return sprintf(
            'Votre perimetre autorise contient %d classe(s) et %d eleve(s). Vous pouvez aussi me demander un resume des notes, absences, retards ou eleves a risque.',
            (int) ($context['classes']['count'] ?? 0),
            (int) ($context['students']['count'] ?? 0),
        );
    }

    private function containsAny(string $question, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (str_contains($question, Str::ascii(Str::lower($needle)))) {
                return true;
            }
        }

        return false;
    }
}

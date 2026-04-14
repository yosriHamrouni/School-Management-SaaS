<?php

use App\Events\MessageSent;
use App\Models\AcademicYear;
use App\Models\ClassSubject;
use App\Models\Establishment;
use App\Models\Level;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\User;
use App\Notifications\AcademicEventNotification;
use App\Notifications\InternalMessageNotification;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;

test('teacher can send a message to a student in an assigned class and create a notification', function () {
    $context = messagingContext();
    Event::fake([MessageSent::class]);

    $this
        ->actingAs($context['teacher'])
        ->post(route('messaging.store'), [
            'receiver_id' => $context['student']->id,
            'content' => 'Bonjour, pensez a reviser le chapitre 3.',
        ])
        ->assertRedirect(route('messaging.show', ['participant' => $context['student']->id]))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('messages', [
        'establishment_id' => $context['establishment']->id,
        'sender_id' => $context['teacher']->id,
        'receiver_id' => $context['student']->id,
        'content' => 'Bonjour, pensez a reviser le chapitre 3.',
    ]);

    $this->assertDatabaseHas('notifications', [
        'notifiable_type' => User::class,
        'notifiable_id' => $context['student']->id,
        'type' => InternalMessageNotification::class,
    ]);

    Event::assertDispatched(MessageSent::class);
});

test('teacher cannot send a message to a student outside the authorized perimeter', function () {
    $context = messagingContext();
    $unauthorizedStudent = createMessagingStudent($context['establishment'], null, 'MSG-OUT');

    $this
        ->actingAs($context['teacher'])
        ->post(route('messaging.store'), [
            'receiver_id' => $unauthorizedStudent->id,
            'content' => 'Ce message doit etre refuse.',
        ])
        ->assertForbidden();

    $this->assertDatabaseCount('messages', 0);
});

test('conversation messages and notifications can be marked as read by the recipient only', function () {
    $context = messagingContext();
    $conversationKey = app(\App\Services\MessagingService::class)
        ->buildConversationKey($context['teacher']->id, $context['student']->id);

    $message = $context['teacher']->sentMessages()->create([
        'establishment_id' => $context['establishment']->id,
        'receiver_id' => $context['student']->id,
        'conversation_key' => $conversationKey,
        'content' => 'Merci de confirmer la reception.',
    ])->load('sender:id,name');

    $context['student']->notify(new InternalMessageNotification($message));
    $notification = $context['student']->notifications()->firstOrFail();

    $this
        ->actingAs($context['student'])
        ->get(route('messaging.show', ['participant' => $context['teacher']->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Messaging/Index')
            ->where('selectedConversation.participant.id', $context['teacher']->id)
            ->where('selectedConversation.messages.0.read_at', null),
        );

    $this
        ->actingAs($context['student'])
        ->patch(route('messaging.read', ['participant' => $context['teacher']->id]))
        ->assertRedirect(route('messaging.show', ['participant' => $context['teacher']->id]));

    expect($message->fresh()->read_at)->not->toBeNull()
        ->and($notification->fresh()->read_at)->not->toBeNull();

    $this
        ->actingAs($context['teacher'])
        ->patch(route('notifications.update', $notification))
        ->assertForbidden();
});

test('notifications page only exposes the authenticated user notifications and unread count', function () {
    $context = messagingContext();
    $otherContext = messagingContext('secondary');

    $message = $context['teacher']->sentMessages()->create([
        'establishment_id' => $context['establishment']->id,
        'receiver_id' => $context['student']->id,
        'conversation_key' => app(\App\Services\MessagingService::class)
            ->buildConversationKey($context['teacher']->id, $context['student']->id),
        'content' => 'Notification visible uniquement pour le bon utilisateur.',
    ])->load('sender:id,name');
    $context['student']->notify(new InternalMessageNotification($message));

    $otherMessage = $otherContext['teacher']->sentMessages()->create([
        'establishment_id' => $otherContext['establishment']->id,
        'receiver_id' => $otherContext['student']->id,
        'conversation_key' => app(\App\Services\MessagingService::class)
            ->buildConversationKey($otherContext['teacher']->id, $otherContext['student']->id),
        'content' => 'Autre notification.',
    ])->load('sender:id,name');
    $otherContext['student']->notify(new InternalMessageNotification($otherMessage));

    $this
        ->actingAs($context['student'])
        ->get(route('notifications.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Notifications/Index')
            ->where('unreadCount', 1)
            ->has('notifications.data', 1)
            ->where('notifications.data.0.category', 'message'),
        );
});

test('notification listings are isolated to the authenticated user establishment metadata', function () {
    $context = messagingContext();

    $context['student']->notify(new AcademicEventNotification(
        title: 'Nouvelle note disponible',
        body: 'Votre nouvelle note est disponible.',
        category: 'grade',
        actionUrl: route('notifications.index'),
        metadata: [
            'establishment_id' => $context['establishment']->id,
        ],
    ));

    $context['student']->notify(new AcademicEventNotification(
        title: 'Notification hors etablissement',
        body: 'Cette notification ne doit pas apparaitre.',
        category: 'grade',
        actionUrl: route('notifications.index'),
        metadata: [
            'establishment_id' => $context['establishment']->id + 999,
        ],
    ));

    $this
        ->actingAs($context['student'])
        ->get(route('notifications.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Notifications/Index')
            ->where('unreadCount', 1)
            ->has('notifications.data', 1)
            ->where('notifications.data.0.title', 'Nouvelle note disponible'),
        );
});

function messagingContext(string $suffix = 'default'): array
{
    $establishment = Establishment::create([
        'name' => "Messaging {$suffix}",
        'code' => "MSG-{$suffix}",
        'type' => 'School',
        'email' => "{$suffix}-messaging@school.test",
    ]);

    $teacher = createMessagingUserWithRole($establishment, 'teacher');
    $studentClass = createMessagingSchoolClass($establishment);
    $subject = Subject::create([
        'establishment_id' => $establishment->id,
        'name' => "French {$suffix}",
    ]);

    ClassSubject::create([
        'class_id' => $studentClass->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
    ]);

    $student = createMessagingStudent($establishment, $studentClass, "MSG-{$suffix}");

    return compact('establishment', 'teacher', 'student', 'studentClass', 'subject');
}

function createMessagingUserWithRole(Establishment $establishment, string $roleName): User
{
    $user = User::factory()->create([
        'establishment_id' => $establishment->id,
    ]);

    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);

    return $user;
}

function createMessagingSchoolClass(Establishment $establishment): SchoolClass
{
    $academicYear = AcademicYear::firstOrCreate([
        'establishment_id' => $establishment->id,
        'name' => '2025-2026',
    ], [
        'start_date' => '2025-09-01',
        'end_date' => '2026-06-30',
        'status' => 'active',
        'is_current' => true,
    ]);

    $level = Level::create([
        'establishment_id' => $establishment->id,
        'name' => fake()->unique()->word(),
    ]);

    return SchoolClass::create([
        'establishment_id' => $establishment->id,
        'level_id' => $level->id,
        'academic_year_id' => $academicYear->id,
        'name' => fake()->unique()->bothify('MSG-CLASS-##??'),
    ]);
}

function createMessagingStudent(
    Establishment $establishment,
    ?SchoolClass $class,
    string $studentNumberPrefix,
): User {
    $student = createMessagingUserWithRole($establishment, 'student');

    StudentProfile::create([
        'user_id' => $student->id,
        'establishment_id' => $establishment->id,
        'class_id' => $class?->id,
        'student_number' => fake()->unique()->bothify("{$studentNumberPrefix}-###"),
    ]);

    return $student;
}

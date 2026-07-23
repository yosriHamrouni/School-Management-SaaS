import { Link, router } from '@inertiajs/react';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Avatar, Box, Button, Card, CardActionArea, CardContent, Chip, Divider, List, ListItem, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/stat-card';

type Child = { id: number; name: string; class_name?: string | null; photo_url?: string | null };
type Assignment = { id: number; title: string; subject?: string | null; due_date?: string | null; status: 'pending' | 'submitted' };
type Incident = { id: number; status: 'absent' | 'late'; recorded_at?: string | null };
export type ParentDashboardData = {
    parent: { name: string; email: string; establishment_name?: string | null; children_count: number };
    children: Child[];
    selected_student_id?: number | null;
    student?: { name: string; class_name?: string | null; assignments: Assignment[]; summary: { average?: number | null; present_count: number; absence_count: number; late_count: number; assignments_due_count: number; risk_level?: string | null }; attendance_incidents: Incident[] } | null;
    notifications: { unread_count: number; recent: unknown[] };
    messages: { unread_count: number; recent: unknown[] };
};

const copy = {
    fr: { space: 'Espace parent', intro: 'Voici le suivi scolaire de votre enfant.', children: 'Mes enfants', noChildren: "Aucun enfant n’est encore associé à votre compte.", summary: 'Résumé scolaire', average: 'Moyenne générale', absences: 'Absences', late: 'Retards', due: 'Devoirs à rendre', assignments: 'Devoirs récents / à rendre', noAssignments: 'Aucun devoir à rendre pour le moment.', deadline: 'Date limite', submitted: 'Rendu', pending: 'À rendre', attendance: 'Assiduité', attendanceHint: 'Un aperçu simple des présences et incidents récents.', present: 'Présences', noIncidents: 'Aucune absence ou retard enregistré.', quick: 'Actions rapides', schoolFollowup: 'Suivi scolaire', notifications: 'Notifications', messages: 'Messagerie', assistant: 'Assistant académique', account: 'Résumé de mon espace parent', role: 'Rôle', parent: 'Parent', establishment: 'Établissement', linkedChildren: 'Enfants associés', settings: 'Mon profil', risk: 'Risque', noData: 'Non disponible' },
    en: { space: 'Parent space', intro: "Here is your child's school progress.", children: 'My children', noChildren: 'No child is associated with your account yet.', summary: 'School summary', average: 'Overall average', absences: 'Absences', late: 'Late arrivals', due: 'Assignments due', assignments: 'Recent / upcoming assignments', noAssignments: 'No assignments due at the moment.', deadline: 'Due date', submitted: 'Submitted', pending: 'Due', attendance: 'Attendance', attendanceHint: 'A simple overview of attendance and recent incidents.', present: 'Present', noIncidents: 'No absence or late arrival recorded.', quick: 'Quick actions', schoolFollowup: 'School progress', notifications: 'Notifications', messages: 'Messaging', assistant: 'Academic assistant', account: 'My parent space summary', role: 'Role', parent: 'Parent', establishment: 'Establishment', linkedChildren: 'Linked children', settings: 'My profile', risk: 'Risk', noData: 'Not available' },
    ar: { space: 'مساحة الولي', intro: 'إليك ملخص متابعة المسار الدراسي لابنك.', children: 'أبنائي', noChildren: 'لا يوجد أي ابن مرتبط بحسابك حالياً.', summary: 'الملخص الدراسي', average: 'المعدل العام', absences: 'الغيابات', late: 'التأخير', due: 'الواجبات المطلوبة', assignments: 'الواجبات الأخيرة والمطلوبة', noAssignments: 'لا توجد واجبات مطلوبة حالياً.', deadline: 'آخر أجل', submitted: 'تم التسليم', pending: 'مطلوب', attendance: 'المواظبة', attendanceHint: 'ملخص بسيط للحضور وآخر الغيابات أو التأخير.', present: 'الحضور', noIncidents: 'لا توجد غيابات أو حالات تأخير مسجلة.', quick: 'إجراءات سريعة', schoolFollowup: 'المتابعة الدراسية', notifications: 'الإشعارات', messages: 'المراسلة', assistant: 'المساعد الأكاديمي', account: 'ملخص فضاء الولي', role: 'الدور', parent: 'ولي', establishment: 'المؤسسة', linkedChildren: 'الأبناء المرتبطون', settings: 'ملفي الشخصي', risk: 'مستوى الخطر', noData: 'غير متوفر' },
};

export default function ParentDashboard({ data, locale }: { data: ParentDashboardData; locale: string }) {
    const c = copy[locale as keyof typeof copy] ?? copy.fr;
    const student = data.student;
    const establishment = data.parent.establishment_name ?? c.noData;
    const formatDate = (date?: string | null) => date ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-TN' : locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date)) : c.noData;
    const actions = [[c.schoolFollowup, '/parent/reports', <InsightsRoundedIcon />], [c.assignments, '/parent/reports', <AssignmentRoundedIcon />], [c.notifications, '/notifications', <NotificationsActiveRoundedIcon />], [c.messages, '/messaging', <ForumRoundedIcon />], [c.assistant, '/academic-assistant', <AutoStoriesRoundedIcon />]] as const;

    return <Stack spacing={3} sx={{ minWidth: 0 }}>
        <PageHeader eyebrow={c.space} title={`Bienvenue, ${data.parent.name}`} description={c.intro} actions={<Button component={Link} href="/settings/profile" variant="outlined" startIcon={<SettingsRoundedIcon />}>{c.settings}</Button>} />
        <Card sx={{ border: '1px solid', borderColor: 'divider', background: 'linear-gradient(135deg, rgba(25,118,210,.12), rgba(124,77,255,.07) 55%, rgba(46,125,50,.08))' }}><CardContent><Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}><Box><Typography variant="h5" fontWeight={800}>{c.intro}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{establishment}</Typography></Box><Chip icon={<SchoolRoundedIcon />} label={establishment} color="primary" variant="outlined" /></Stack></CardContent></Card>
        <Card><CardContent><Typography variant="h5" fontWeight={750}>{c.children}</Typography>
            {data.children.length === 0 ? <Box sx={{ mt: 2, p: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}><Typography color="text.secondary">{c.noChildren}</Typography></Box> :
                <Box sx={{ mt: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', lg: 'repeat(3,minmax(0,1fr))' } }}>{data.children.map((child) => {
 const selected = child.id === data.selected_student_id;

 return <Card key={child.id} variant="outlined" sx={{ borderColor: selected ? 'primary.main' : 'divider' }}><CardActionArea onClick={() => router.get('/dashboard', { student: child.id }, { preserveScroll: true, preserveState: true })}><CardContent><Stack direction="row" spacing={2} alignItems="center"><Avatar src={child.photo_url ?? undefined}>{child.name?.charAt(0)}</Avatar><Box flex={1} minWidth={0}><Typography fontWeight={700} noWrap>{child.name}</Typography><Typography variant="body2" color="text.secondary">{child.class_name ?? c.noData}</Typography></Box>{selected && <CheckCircleRoundedIcon color="primary" />}</Stack></CardContent></CardActionArea></Card>; 
})}</Box>}
        </CardContent></Card>
        {student && <>
            <Box><Typography variant="h5" fontWeight={750}>{c.summary} · {student.name}</Typography><Typography variant="body2" color="text.secondary">{student.class_name ?? c.noData}</Typography></Box>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', xl: 'repeat(4,minmax(0,1fr))' } }}>
                <StatCard label={c.average} value={student.summary.average == null ? '--' : `${student.summary.average}/20`} caption={student.summary.risk_level ? `${c.risk}: ${student.summary.risk_level}` : c.noData} icon={<InsightsRoundedIcon />} color="primary" />
                <StatCard label={c.absences} value={String(student.summary.absence_count)} caption={c.attendance} icon={<WarningAmberRoundedIcon />} color="error" />
                <StatCard label={c.late} value={String(student.summary.late_count)} caption={c.attendance} icon={<ScheduleRoundedIcon />} color="warning" />
                <StatCard label={c.due} value={String(student.summary.assignments_due_count)} caption={c.assignments} icon={<AssignmentRoundedIcon />} color="secondary" />
            </Box>
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1.2fr .8fr' }, alignItems: 'start' }}>
                <Card><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h5" fontWeight={750}>{c.assignments}</Typography><Button component={Link} href="/parent/reports" size="small">{c.schoolFollowup}</Button></Stack><Stack spacing={1.5} sx={{ mt: 2 }}>{student.assignments.length === 0 ? <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>{c.noAssignments}</Typography> : student.assignments.map((item) => <Card key={item.id} variant="outlined"><CardContent sx={{ py: 1.5 }}><Stack direction="row" justifyContent="space-between" gap={2}><Box><Typography fontWeight={700}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.subject ?? c.noData} · {c.deadline}: {formatDate(item.due_date)}</Typography></Box><Chip size="small" color={item.status === 'submitted' ? 'success' : 'warning'} label={item.status === 'submitted' ? c.submitted : c.pending} /></Stack></CardContent></Card>)}</Stack></CardContent></Card>
                <Card><CardContent><Typography variant="h5" fontWeight={750}>{c.attendance}</Typography><Typography variant="body2" color="text.secondary">{c.attendanceHint}</Typography><Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ my: 2 }}><Chip label={`${c.present}: ${student.summary.present_count}`} color="success" variant="outlined" /><Chip label={`${c.absences}: ${student.summary.absence_count}`} color="error" variant="outlined" /><Chip label={`${c.late}: ${student.summary.late_count}`} color="warning" variant="outlined" /></Stack>{student.attendance_incidents.length === 0 ? <Typography color="text.secondary" sx={{ py: 2 }}>{c.noIncidents}</Typography> : <List disablePadding>{student.attendance_incidents.map((item) => <ListItem key={item.id} disableGutters><ListItemIcon sx={{ minWidth: 36 }}>{item.status === 'absent' ? <WarningAmberRoundedIcon color="error" /> : <ScheduleRoundedIcon color="warning" />}</ListItemIcon><ListItemText primary={item.status === 'absent' ? c.absences : c.late} secondary={formatDate(item.recorded_at)} /></ListItem>)}</List>}</CardContent></Card>
            </Box>
        </>}
        <Card><CardContent><Typography variant="h5" fontWeight={750}>{c.quick}</Typography><Box sx={{ mt: 2, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', xl: 'repeat(5,minmax(0,1fr))' } }}>{actions.map(([title, href, icon]) => <Card key={title} variant="outlined"><CardActionArea component={Link} href={href}><CardContent><Stack spacing={1} alignItems="flex-start"><Box color="primary.main">{icon}</Box><Typography fontWeight={700}>{title}</Typography></Stack></CardContent></CardActionArea></Card>)}</Box></CardContent></Card>
        <Card><CardContent><Typography variant="h5" fontWeight={750}>{c.account}</Typography><List sx={{ mt: 1 }}>{[[<PersonRoundedIcon color="primary" />, data.parent.name], [<MailOutlineRoundedIcon color="primary" />, data.parent.email], [<SchoolRoundedIcon color="primary" />, establishment], [<InsightsRoundedIcon color="primary" />, `${c.role}: ${c.parent}`], [<PersonRoundedIcon color="primary" />, `${c.linkedChildren}: ${data.parent.children_count}`]].map(([icon, value], index) => <Box key={index}><ListItem disableGutters><ListItemIcon sx={{ minWidth: 38 }}>{icon}</ListItemIcon><ListItemText primary={value} /></ListItem>{index < 4 && <Divider />}</Box>)}</List></CardContent></Card>
    </Stack>;
}

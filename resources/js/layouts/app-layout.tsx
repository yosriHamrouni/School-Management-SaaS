import AdminShell from '@/components/navigation/admin-shell';
import type { AppLayoutProps } from '@/types';

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AdminShell breadcrumbs={breadcrumbs} {...props}>
        {children}
    </AdminShell>
);

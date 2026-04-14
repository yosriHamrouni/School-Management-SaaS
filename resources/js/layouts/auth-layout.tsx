import AuthShell from '@/components/navigation/auth-shell';

export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <AuthShell title={title} description={description} {...props}>
            {children}
        </AuthShell>
    );
}

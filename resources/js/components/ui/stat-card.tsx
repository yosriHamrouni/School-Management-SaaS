import { Avatar, Card, CardContent, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export type StatCardProps = {
    label: string;
    value: string;
    caption?: string;
    icon: ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
};

export default function StatCard({
    label,
    value,
    caption,
    icon,
    color = 'primary',
}: StatCardProps) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                    <div>
                        <Typography variant="body2" color="text.secondary">
                            {label}
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                            {value}
                        </Typography>
                        {caption ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                {caption}
                            </Typography>
                        ) : null}
                    </div>
                    <Avatar
                        sx={{
                            bgcolor: `${color}.main`,
                            color: `${color}.contrastText`,
                            width: 52,
                            height: 52,
                        }}
                    >
                        {icon}
                    </Avatar>
                </Stack>
            </CardContent>
        </Card>
    );
}

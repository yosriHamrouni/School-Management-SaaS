import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type PageHeaderProps = {
    title: string;
    description?: string;
    eyebrow?: string;
    actions?: ReactNode;
};

export default function PageHeader({
    title,
    description,
    eyebrow,
    actions,
}: PageHeaderProps) {
    return (
        <Card>
            <CardContent
                sx={{
                    p: { xs: 3, md: 4 },
                    '&:last-child': { pb: { xs: 3, md: 4 } },
                }}
            >
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    spacing={3}
                >
                    <Box>
                        {eyebrow ? (
                            <Typography
                                variant="overline"
                                color="primary.main"
                                sx={{ fontWeight: 700 }}
                            >
                                {eyebrow}
                            </Typography>
                        ) : null}
                        <Typography variant="h4" sx={{ mt: eyebrow ? 0.5 : 0 }}>
                            {title}
                        </Typography>
                        {description ? (
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, maxWidth: 720 }}
                            >
                                {description}
                            </Typography>
                        ) : null}
                    </Box>

                    {actions ? (
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1.5}
                            width={{ xs: '100%', md: 'auto' }}
                        >
                            {actions}
                        </Stack>
                    ) : null}
                </Stack>
            </CardContent>
        </Card>
    );
}

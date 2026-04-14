import { Box, Stack, Typography } from '@mui/material';

type Props = {
    labels: string[];
    values: number[];
    emptyMessage: string;
};

const COLORS = ['#2e7d32', '#ef6c00', '#6b7280', '#1565c0'];

export default function AcademicDonutChart({
    labels,
    values,
    emptyMessage,
}: Props) {
    const total = values.reduce((sum, value) => sum + value, 0);

    if (total <= 0) {
        return (
            <Box
                sx={{
                    minHeight: 260,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    textAlign: 'center',
                }}
            >
                <Typography variant="body2">{emptyMessage}</Typography>
            </Box>
        );
    }

    let cumulative = 0;
    const segments = values.map((value, index) => {
        const percentage = value / total;
        const start = cumulative;
        cumulative += percentage;

        return {
            label: labels[index] ?? `Serie ${index + 1}`,
            value,
            color: COLORS[index % COLORS.length],
            start,
            end: cumulative,
        };
    });

    const gradient = segments
        .map(
            (segment) =>
                `${segment.color} ${segment.start * 100}% ${segment.end * 100}%`,
        )
        .join(', ');

    return (
        <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            alignItems={{ xs: 'flex-start', md: 'center' }}
        >
            <Box
                sx={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: `conic-gradient(${gradient})`,
                    position: 'relative',
                    flexShrink: 0,
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 32,
                        borderRadius: '50%',
                        bgcolor: 'background.paper',
                    },
                }}
            />

            <Stack spacing={1.25} sx={{ width: '100%' }}>
                {segments.map((segment) => (
                    <Stack
                        key={segment.label}
                        direction="row"
                        justifyContent="space-between"
                        spacing={2}
                        alignItems="center"
                    >
                        <Stack direction="row" spacing={1.25} alignItems="center">
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor: segment.color,
                                    flexShrink: 0,
                                }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {segment.label}
                            </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                            {segment.value}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </Stack>
    );
}

import { Box, Stack, Typography } from '@mui/material';

type Series = {
    name: string;
    values: number[];
};

type Props = {
    labels: string[];
    series: Series[];
    emptyMessage: string;
    maxValue?: number;
};

const COLORS = ['#1565c0', '#2e7d32', '#ef6c00', '#6b7280', '#8e24aa'];

export default function GroupedBarChart({
    labels,
    series,
    emptyMessage,
    maxValue = 20,
}: Props) {
    if (labels.length === 0 || series.length === 0) {
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

    return (
        <Stack spacing={3}>
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                {series.map((item, index) => (
                    <Stack
                        key={item.name}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >
                        <Box
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: COLORS[index % COLORS.length],
                            }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {item.name}
                        </Typography>
                    </Stack>
                ))}
            </Stack>

            <Box
                sx={{
                    display: 'grid',
                    gap: 2.5,
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: `repeat(${Math.min(labels.length, 3)}, minmax(0, 1fr))`,
                    },
                }}
            >
                {labels.map((label, labelIndex) => (
                    <Box key={label}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                            {label}
                        </Typography>
                        <Stack direction="row" spacing={1.25} alignItems="end">
                            {series.map((item, seriesIndex) => {
                                const value = item.values[labelIndex] ?? 0;
                                const height = Math.max((value / maxValue) * 180, 6);

                                return (
                                    <Stack
                                        key={`${label}-${item.name}`}
                                        spacing={0.75}
                                        alignItems="center"
                                        sx={{ flex: 1 }}
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {value.toFixed(1)}
                                        </Typography>
                                        <Box
                                            sx={{
                                                width: '100%',
                                                maxWidth: 42,
                                                height,
                                                borderRadius: '12px 12px 0 0',
                                                bgcolor: COLORS[seriesIndex % COLORS.length],
                                            }}
                                        />
                                    </Stack>
                                );
                            })}
                        </Stack>
                    </Box>
                ))}
            </Box>
        </Stack>
    );
}

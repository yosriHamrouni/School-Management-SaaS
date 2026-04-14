import { Box, Stack, Typography } from '@mui/material';

type BarChartDatum = {
    label: string;
    value: number;
};

type Props = {
    data: BarChartDatum[];
    maxValue?: number;
    emptyMessage: string;
};

export default function AcademicBarChart({
    data,
    maxValue = 20,
    emptyMessage,
}: Props) {
    if (data.length === 0) {
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
        <Stack spacing={2}>
            {data.map((item) => {
                const width = Math.min((item.value / maxValue) * 100, 100);

                return (
                    <Stack key={item.label} spacing={0.75}>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            spacing={2}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {item.value.toFixed(2)}/20
                            </Typography>
                        </Stack>

                        <Box
                            sx={{
                                height: 14,
                                borderRadius: 999,
                                bgcolor: 'action.hover',
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                sx={{
                                    width: `${width}%`,
                                    height: '100%',
                                    borderRadius: 999,
                                    background:
                                        'linear-gradient(90deg, #1565c0 0%, #42a5f5 100%)',
                                }}
                            />
                        </Box>
                    </Stack>
                );
            })}
        </Stack>
    );
}

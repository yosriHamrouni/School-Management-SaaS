import { Box, Chip, Stack, Typography } from '@mui/material';

type Props = {
    reasons: string[] | null | undefined;
    emptyLabel?: string;
    limit?: number;
    variant?: 'chips' | 'list';
};

export default function RiskReasonsList({
    reasons,
    emptyLabel = 'Aucune cause detaillee disponible.',
    limit,
    variant = 'list',
}: Props) {
    const items = (reasons ?? []).filter(Boolean);
    const visibleItems = typeof limit === 'number' ? items.slice(0, limit) : items;

    if (visibleItems.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                {emptyLabel}
            </Typography>
        );
    }

    if (variant === 'chips') {
        return (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {visibleItems.map((reason) => (
                    <Chip key={reason} label={reason} size="small" variant="outlined" />
                ))}
            </Stack>
        );
    }

    return (
        <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
            {visibleItems.map((reason) => (
                <Typography
                    key={reason}
                    component="li"
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                >
                    {reason}
                </Typography>
            ))}
        </Box>
    );
}

import { Card, CardContent, Stack, Typography } from '@mui/material';
import { getFeatureCards } from '@/utils/risk';

type Props = {
    features: Record<string, number | null> | null | undefined;
};

export default function RiskFeaturesPanel({ features }: Props) {
    const cards = getFeatureCards(features);

    return (
        <Stack
            display="grid"
            gap={2}
            gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }}
        >
            {cards.map((item) => (
                <Card key={item.key} variant="outlined">
                    <CardContent>
                        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>
                            {item.label}
                        </Typography>
                        <Typography variant="h5" sx={{ mt: 1 }}>
                            {item.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {item.description}
                        </Typography>
                    </CardContent>
                </Card>
            ))}
        </Stack>
    );
}

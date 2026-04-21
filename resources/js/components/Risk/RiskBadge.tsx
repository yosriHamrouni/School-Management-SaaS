import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Chip } from '@mui/material';
import { getRiskBadgeColor, getRiskLevelLabel } from '@/utils/risk';

type Props = {
    level: string | null | undefined;
};

export default function RiskBadge({ level }: Props) {
    return (
        <Chip
            icon={<WarningAmberRoundedIcon />}
            label={getRiskLevelLabel(level)}
            color={getRiskBadgeColor(level)}
            variant="filled"
            sx={{ fontWeight: 700 }}
        />
    );
}

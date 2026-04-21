import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
    Button,
    Card,
    CardContent,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from '@mui/material';
import type { FormEvent } from 'react';
import type { RiskFilters, RiskOption } from '@/utils/risk';
import { perPageOptions, riskLevelOptions } from '@/utils/risk';

type Props = {
    values: RiskFilters;
    classes: RiskOption[];
    schoolYears: RiskOption[];
    loading: boolean;
    onChange: (field: keyof RiskFilters, value: string) => void;
    onSubmit: () => void;
    onReset: () => void;
};

export default function RiskFilters({
    values,
    classes,
    schoolYears,
    loading,
    onChange,
    onSubmit,
    onReset,
}: Props) {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit();
    };

    return (
        <Card>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        useFlexGap
                        flexWrap="wrap"
                    >
                        <TextField
                            label="Rechercher un eleve"
                            placeholder="Nom ou matricule"
                            value={values.search}
                            onChange={(event) => onChange('search', event.target.value)}
                            size="small"
                            sx={{ minWidth: { xs: '100%', md: 260 }, flex: 1 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRoundedIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                            <InputLabel id="risk-school-year-label">Annee scolaire</InputLabel>
                            <Select
                                labelId="risk-school-year-label"
                                label="Annee scolaire"
                                value={values.school_year_id}
                                onChange={(event) => onChange('school_year_id', event.target.value)}
                            >
                                {schoolYears.map((schoolYear) => (
                                    <MenuItem key={schoolYear.id} value={String(schoolYear.id)}>
                                        {schoolYear.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                            <InputLabel id="risk-class-label">Classe</InputLabel>
                            <Select
                                labelId="risk-class-label"
                                label="Classe"
                                value={values.class_id}
                                onChange={(event) => onChange('class_id', event.target.value)}
                            >
                                <MenuItem value="">Toutes</MenuItem>
                                {classes.map((schoolClass) => (
                                    <MenuItem key={schoolClass.id} value={String(schoolClass.id)}>
                                        {schoolClass.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                            <InputLabel id="risk-level-label">Niveau de risque</InputLabel>
                            <Select
                                labelId="risk-level-label"
                                label="Niveau de risque"
                                value={values.risk_level}
                                onChange={(event) => onChange('risk_level', event.target.value)}
                            >
                                {riskLevelOptions.map((option) => (
                                    <MenuItem key={option.value || 'all'} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                            <InputLabel id="risk-per-page-label">Pagination</InputLabel>
                            <Select
                                labelId="risk-per-page-label"
                                label="Pagination"
                                value={values.per_page}
                                onChange={(event) => onChange('per_page', event.target.value)}
                            >
                                {perPageOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Stack direction="row" spacing={1.5} sx={{ ml: 'auto' }}>
                            <Button
                                type="button"
                                variant="outlined"
                                color="inherit"
                                startIcon={<RefreshRoundedIcon />}
                                onClick={onReset}
                                disabled={loading}
                            >
                                Reinitialiser
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<FilterListRoundedIcon />}
                                disabled={loading}
                            >
                                Appliquer
                            </Button>
                        </Stack>
                    </Stack>
                </form>
            </CardContent>
        </Card>
    );
}

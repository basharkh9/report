// components/DynamicFilterForm.tsx
import React, { useState } from 'react';
import { Box, TextField, MenuItem, Button } from '@mui/material';

export interface FilterField {
  name: string;
  type: 'Date' | 'String' | 'Enum';
  label: string;
  options?: string[]; // Only for Enum filters
}

export interface DynamicFilterFormProps {
  filters: FilterField[];
  onApply: (values: Record<string, any>) => void;
}

const DynamicFilterForm: React.FC<DynamicFilterFormProps> = ({ filters, onApply }) => {
  // Group filters by type.
  const dateFilters = filters.filter((f) => f.type === 'Date');
  const stringFilters = filters.filter((f) => f.type === 'String');
  const enumFilters = filters.filter((f) => f.type === 'Enum');

  // State to hold filter values.
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const handleChange = (fieldName: string, value: any) => {
    setFilterValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  // Disable "Apply Filters" if both fromDate and toDate are required but one is missing.
  const disableApply =
    (filters.some((f) => f.name === 'fromDate' && f.type === 'Date') && !filterValues['fromDate']) ||
    (filters.some((f) => f.name === 'toDate' && f.type === 'Date') && !filterValues['toDate']);

  const handleApply = () => {
    onApply(filterValues);
  };

  return (
    <Box component="form" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Date filters */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {dateFilters.map((field) => (
            <TextField
              key={field.name}
              label={field.label}
              type="date"
              value={filterValues[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          ))}
        </Box>
        {/* String filters */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {stringFilters.map((field) => (
            <TextField
              key={field.name}
              label={field.label}
              value={filterValues[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              fullWidth
            />
          ))}
        </Box>
        {/* Enum filters */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {enumFilters.map((field) => (
            <TextField
              key={field.name}
              select
              label={field.label}
              value={filterValues[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              fullWidth
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          ))}
        </Box>
      </Box>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleApply} disabled={disableApply}>
          Apply Filters
        </Button>
      </Box>
    </Box>
  );
};

export default DynamicFilterForm;

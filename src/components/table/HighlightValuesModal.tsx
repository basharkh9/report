// components/HighlightValuesModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Divider,
} from '@mui/material';

export interface Column {
  id: string;
  label: string;
}

export interface HighlightMapping {
  groupMapping?: Record<string, string>;
  rangeMapping?: { min: number; max: number; color: string };
}

export interface HighlightValuesModalProps {
  open: boolean;
  column: Column;
  data: Record<string, any>[];
  onClose: () => void;
  onApply: (mapping: HighlightMapping) => void;
}

const predefinedColors = [
  { label: 'Red', value: '#f44336' },
  { label: 'Green', value: '#4caf50' },
  { label: 'Blue', value: '#2196f3' },
  { label: 'Orange', value: '#ff9800' },
  { label: 'Purple', value: '#9c27b0' },
];

const HighlightValuesModal: React.FC<HighlightValuesModalProps> = ({
  open,
  column,
  data,
  onClose,
  onApply,
}) => {
  // Section 1: Compute distinct values for categorical highlight.
  const distinctValues = useMemo(() => {
    const set = new Set<string>();
    data.forEach((row) => {
      const cellVal = row[column.id];
      if (cellVal !== null && cellVal !== undefined) {
        set.add(cellVal.toString());
      }
    });
    return Array.from(set);
  }, [data, column.id]);

  // Local state for group mapping.
  const [groupMapping, setGroupMapping] = useState<Record<string, string>>({});
  useEffect(() => {
    const init: Record<string, string> = {};
    distinctValues.forEach((val) => {
      init[val] = ''; // No color by default.
    });
    setGroupMapping(init);
  }, [distinctValues]);

  // Local state for numerical range mapping.
  const [rangeMin, setRangeMin] = useState<string>('');
  const [rangeMax, setRangeMax] = useState<string>('');
  const [rangeColor, setRangeColor] = useState<string>('');

  const handleGroupColorChange = (value: string, selectedColor: string) => {
    setGroupMapping((prev) => ({
      ...prev,
      [value]: selectedColor,
    }));
  };

  const handleApply = () => {
    const mapping: HighlightMapping = {};
    // Only include group mapping if at least one value has a non-empty color.
    const hasGroupMapping = Object.values(groupMapping).some((color) => color);
    if (hasGroupMapping) {
      mapping.groupMapping = groupMapping;
    }
    // If valid range numbers and a color are set, include range mapping.
    const min = parseFloat(rangeMin);
    const max = parseFloat(rangeMax);
    if (!isNaN(min) && !isNaN(max) && rangeColor) {
      mapping.rangeMapping = { min, max, color: rangeColor };
    }
    onApply(mapping);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Highlight Values: {column.label}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Section 1: Categorical highlighting */}
        <Typography variant="h6">Categorical Highlight</Typography>
        {distinctValues.map((value) => (
          <Box key={value} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" sx={{ flex: 1 }}>
              {value}
            </Typography>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id={`color-select-label-${value}`}>Color</InputLabel>
              <Select
                labelId={`color-select-label-${value}`}
                value={groupMapping[value] || ''}
                label="Color"
                onChange={(e) => handleGroupColorChange(value, e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {predefinedColors.map((colorOption) => (
                  <MenuItem key={colorOption.value} value={colorOption.value}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: colorOption.value,
                        display: 'inline-block',
                        mr: 1,
                      }}
                    />
                    {colorOption.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ))}
        <Divider />
        {/* Section 2: Numerical Range highlighting */}
        <Typography variant="h6">Numerical Range Highlight</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="Min"
            value={rangeMin}
            onChange={(e) => setRangeMin(e.target.value)}
            variant="outlined"
            size="small"
            type="number"
          />
          <TextField
            label="Max"
            value={rangeMax}
            onChange={(e) => setRangeMax(e.target.value)}
            variant="outlined"
            size="small"
            type="number"
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="range-color-select-label">Color</InputLabel>
            <Select
              labelId="range-color-select-label"
              value={rangeColor}
              label="Color"
              onChange={(e) => setRangeColor(e.target.value)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {predefinedColors.map((colorOption) => (
                <MenuItem key={colorOption.value} value={colorOption.value}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: colorOption.value,
                      display: 'inline-block',
                      mr: 1,
                    }}
                  />
                  {colorOption.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleApply} variant="contained" color="primary">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HighlightValuesModal;

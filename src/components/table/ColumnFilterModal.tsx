import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

export interface FilterOption {
  value: string;
  selected: boolean;
}

export interface FilterModalProps {
  open: boolean;
  columnLabel: string;
  filterSearchQuery: string;
  setFilterSearchQuery: (value: string) => void;
  displayedOptions: FilterOption[];
  onOptionChange: (index: number, checked: boolean) => void;
  onSelectAllChange: (checked: boolean) => void;
  onApply: () => void;
  onCancel: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  open,
  columnLabel,
  filterSearchQuery,
  setFilterSearchQuery,
  displayedOptions,
  onOptionChange,
  onSelectAllChange,
  onApply,
  onCancel,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Filter {columnLabel}</DialogTitle>
      <DialogContent
        dividers
        style={{ maxHeight: 300, display: 'flex', flexDirection: 'column' }}
      >
        <TextField
          label="Search"
          variant="outlined"
          value={filterSearchQuery}
          onChange={(e) => setFilterSearchQuery(e.target.value)}
          fullWidth
          style={{ marginBottom: 16 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={
                displayedOptions.length > 0 &&
                displayedOptions.every((opt) => opt.selected)
              }
              onChange={(e) => onSelectAllChange(e.target.checked)}
            />
          }
          label="Select All"
        />
        {displayedOptions.map((option, index) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                checked={option.selected}
                onChange={(e) => onOptionChange(index, e.target.checked)}
              />
            }
            label={option.value}
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onApply} variant="contained" color="primary">
          Apply
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterModal;

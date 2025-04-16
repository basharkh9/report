// components/FilterModalWrapper.tsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import DynamicFilterForm, { FilterField } from './DynamicFilterForm';

export interface FilterModalWrapperProps {
  open: boolean;
  title: string;
  filters: FilterField[];
  onApply: (values: Record<string, any>) => void;
  onClose: () => void;
}

const FilterModalWrapper: React.FC<FilterModalWrapperProps> = ({
  open,
  title,
  filters,
  onApply,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <DynamicFilterForm filters={filters} onApply={onApply} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterModalWrapper;

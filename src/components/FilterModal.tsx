// components/FilterModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface FilterModalProps {
  open: boolean;
  handleClose: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ open, handleClose }) => {
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const handleApply = () => {
    // Apply your filter logic here using fromDate and toDate
    console.log('Filter applied:', { fromDate, toDate });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Filter Search</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={(newValue: Date | null) => setFromDate(newValue)}
              slots={{ textField: TextField }}
              slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
            />
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={(newValue: Date | null) => setToDate(newValue)}
              slots={{ textField: TextField }}
              slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleApply} variant="contained" color="primary">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterModal;

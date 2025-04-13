import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterSettings } from '../store/filterSettings'; // New import
import { loadBugs } from '../store/bugs';

interface FilterModalProps {
  open: boolean;
  handleClose: () => void;
}

interface SearchField {
  id: string;
  label: string;
}

// Define your search fields – add or remove fields as needed.
const searchFields: SearchField[] = [
  { id: 'keyword', label: 'Keyword' },
  { id: 'status', label: 'Status' },
];

export interface EntityFilter {
  id: number;
  name: string;
  filterFields: FilterField[];
}

export interface FilterField {
  id: string;
  label: string;
}

const FilterModal: React.FC<FilterModalProps> = ({ open, handleClose }) => {
  // Date range states.
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Advanced search fields state.
  const [searchValues, setSearchValues] = useState<{ [key: string]: string }>({});

  const entities: EntityFilter[] = useSelector(
    (state: any) => state.entities.availableEntities.list || []
  );
  const [selectedEntity, setSelectedEntity] = useState<number | string>('');
  const dispatch = useDispatch();

  console.log('Entities:', entities);

  const handleSearchValueChange = (key: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchValues((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleApply = () => {
    // Dispatch filter settings with input fields and date range.
    dispatch(setFilterSettings({
      fromDate: fromDate ? fromDate.toISOString() : null,
      toDate: toDate ? toDate.toISOString() : null,
      searchValues,
    }));
    dispatch((loadBugs() as unknown) as any);
    console.log('Apply Filter: ', { fromDate, toDate, searchValues });
    handleClose();
  };

  const selectedEntityObj = entities.find(
    (entity) => entity.id === selectedEntity
  );
  // Use entity-specific filter fields if an entity is selected; otherwise, use the default search fields.
  const advancedSearchFields = selectedEntityObj
    ? selectedEntityObj.filterFields
    : searchFields;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Filter Search</DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        <>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="entity-select-label">Entities</InputLabel>
              <Select
                labelId="entity-select-label"
                label="Entities"
                value={selectedEntity}
                onChange={(e) => {
                  setSelectedEntity(e.target.value);
                  // Optionally, reset filter values when selecting a new entity.
                  setSearchValues({});
                }}
              >
                {entities.map((entity) => (
                  <MenuItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              minHeight: 200,
            }}
          >
            {/* Left Panel: Date Range */}
            <Box sx={{ flex: 1 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ mb: 2 }}>
                  <DatePicker
                    label="From Date"
                    value={fromDate}
                    onChange={(newValue: Date | null) => setFromDate(newValue)}
                    slots={{ textField: TextField }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal',
                        variant: 'outlined',
                      },
                    }}
                  />
                </Box>
                <Box>
                  <DatePicker
                    label="To Date"
                    value={toDate}
                    onChange={(newValue: Date | null) => setToDate(newValue)}
                    slots={{ textField: TextField }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal',
                        variant: 'outlined',
                      },
                    }}
                  />
                </Box>
              </LocalizationProvider>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Right Panel: Advanced Search Fields */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Advanced Search
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  flexGrow: 1,
                  overflow: 'auto',
                  p: 2,
                }}
              >
                {advancedSearchFields.length > 0 ? (
                  advancedSearchFields.map((field) => (
                    <TextField
                      key={field.id}
                      label={field.label}
                      value={searchValues[field.id] || ''}
                      onChange={handleSearchValueChange(field.id)}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No filters available
                  </Typography>
                )}
              </Paper>
            </Box>
          </Box>
        </>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          disabled={fromDate === null || toDate === null}
          onClick={handleApply}
          variant="contained"
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterModal;
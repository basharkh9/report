// components/FilterComponent.tsx
import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Box } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import DynamicFilterForm, { FilterField } from './DynamicFilterForm';
import FilterModalWrapper from './FilterModalWrapper';

// Example reports configuration.
const reportConfigs = [
  {
    id: "callWorkDailyReport",
    label: "Call Work Daily Report",
    filters: [
      { name: "fromDate", type: "Date", label: "From Date" },
      { name: "toDate", type: "Date", label: "To Date" },
      { name: "callId", type: "String", label: "Call Id" },
      { name: "numberCalledFrom", type: "String", label: "Number Called From" },
      { name: "numberCalledTo", type: "String", label: "Number Called To" },
      { name: "languageSelected", type: "String", label: "Language Selected" },
      { name: "ivrAppName", type: "String", label: "IVR App Name" },
      { name: "wrapUp", type: "String", label: "Wrap Up" },
      { name: "queueId", type: "String", label: "Queue Id" },
      {
        name: "direction",
        type: "Enum",
        label: "Direction",
        options: [ "OUTBOUND", "INBOUND" ]
      },
      { name: "mediaType", type: "String", label: "Media Type" }
    ]
  },
  // You can add additional report configurations here.
];

const FilterComponent: React.FC = () => {
  // Initially, no report is selected.
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

  // Find the selected report configuration (if any).
  const selectedReport = reportConfigs.find((report) => report.id === selectedReportId);

  const handleApplyFilters = (values: Record<string, any>) => {
    console.log("Filters applied for", selectedReport?.label, values);
    // Dispatch actions or update state as needed.
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FilterListIcon />}
        onClick={() => setOpen(true)}
      >
        Advanced Search
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Advanced Search</DialogTitle>
        <DialogContent dividers>
          {/* Report drop-down. */}
          <TextField
            select
            label="Select Report"
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            <MenuItem value="">
              <em>Select Report</em>
            </MenuItem>
            {reportConfigs.map((report) => (
              <MenuItem key={report.id} value={report.id}>
                {report.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Render dynamic filter form only if a report has been selected. */}
          {selectedReport ? (
            <DynamicFilterForm
              filters={selectedReport.filters as FilterField[]}
              onApply={handleApplyFilters}
            />
          ) : (
            <Box sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
              Please select a report to view filters.
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FilterComponent;

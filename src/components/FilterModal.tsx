import React, { useState } from 'react';
import {
  Button,
} from '@mui/material';
import { useSelector } from 'react-redux';
import FilterModalWrapper from './FilterModalWrapper';
import { FilterField } from './DynamicFilterForm';

export interface FilterModalProps {
  open: boolean;
  handleClose: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ open, handleClose }) => {
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Suppose your Redux store has the following filter configuration
  const reportConfig = [{
    "id": "callWorkDailyReport",
    "label": "Call Work Daily Report",
    "filters": [
      { "name": "fromDate", "type": "Date", "label": "From Date" },
      { "name": "toDate", "type": "Date", "label": "To Date" },
      { "name": "callId", "type": "String", "label": "Call Id" },
      { "name": "numberCalledFrom", "type": "String", "label": "Number Called From" },
      { "name": "numberCalledTo", "type": "String", "label": "Number Called To" },
      { "name": "languageSelected", "type": "String", "label": "Language Selected" },
      { "name": "ivrAppName", "type": "String", "label": "IVR App Name" },
      { "name": "wrapUp", "type": "String", "label": "Wrap Up" },
      { "name": "queueId", "type": "String", "label": "Queue Id" },
      {
        "name": "direction",
        "type": "Enum",
        "label": "Direction",
        "options": [ "OUTBOUND", "INBOUND" ]
      },
      { "name": "mediaType", "type": "String", "label": "Media Type" }
    ]
  }];
  

  const handleApplyFilters = (values: Record<string, any>) => {
    console.log("Filters applied:", values);
    // dispatch an action or update state, etc.
    setFilterModalOpen(false);
  };

  return (
    <div>
      {reportConfig && reportConfig.length > 0 && (
        <FilterModalWrapper
          open={filterModalOpen}
          title={reportConfig[0].label}
          filters={reportConfig[0].filters as FilterField[]}
          onApply={handleApplyFilters}
          onClose={() => setFilterModalOpen(false)}
        />
      )}
    </div>
  );
};

export default FilterModal;
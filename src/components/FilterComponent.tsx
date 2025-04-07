// components/FilterComponent.tsx
import React from 'react';
import { Button } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

interface FilterComponentProps {
  onOpenFilter: () => void;
}

const FilterComponent: React.FC<FilterComponentProps> = ({ onOpenFilter }) => {
  return (
    <Button
      variant="outlined"
      startIcon={<FilterListIcon />}
      onClick={onOpenFilter}
    >
      Advanced Search
    </Button>
  );
};

export default FilterComponent;

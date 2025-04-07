// App.tsx
import React, { useState } from 'react';
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  GlobalStyles,
  Box,
  Button,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import FilterModal from './components/FilterModal';
import FilterComponent from './components/FilterComponent';
import TableComponent from './components/TableComponent';
import TopBar from './components/TopBar';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#f48fb1' },
  },
});

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  const openFilter = () => setIsFilterOpen(true);
  const closeFilter = () => setIsFilterOpen(false);

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <GlobalStyles styles={{ body: { transition: 'background-color 0.5s ease, color 0.5s ease' } }} />
      <TopBar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <Box sx={{ p: 2 }}>
        {/* Theme toggler */}
        <Button
          variant="contained"
          onClick={toggleTheme}
          startIcon={isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        >
          Switch to {isDarkMode ? 'Light' : 'Dark'} Mode
        </Button>

        {/* Filter component and modal */}
        <Box sx={{ mt: 2 }}>
          <FilterComponent onOpenFilter={openFilter} />
          <FilterModal open={isFilterOpen} handleClose={closeFilter} />
        </Box>

        {/* Table component */}
        <TableComponent />
      </Box>
    </ThemeProvider>
  );
};

export default App;

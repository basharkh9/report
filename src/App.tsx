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
import TableComponent from './components/table/DynamicTable';
import TopBar from './components/TopBar';
import { Provider } from 'react-redux';
import configureStore from './store/configureStore';
import ReportsFilters from './components/ReportsFilters';

const store = configureStore();


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

interface Row {
  id: number;
  name: string;
  age: number;
}

// Sample data
const rowsData: Row[] = [
  { id: 1, name: 'John Doe', age: 28 },
  { id: 2, name: 'Jane Smith', age: 34 },
  { id: 3, name: 'Alice Johnson', age: 45 },
  { id: 4, name: 'Bob Brown', age: 23 },
  { id: 5, name: 'Carol White', age: 38 },
  { id: 6, name: 'Dan Black', age: 50 },
  { id: 7, name: 'Eve Green', age: 29 },
];

interface Column {
  id: keyof Row;
  label: string;
}

// const columns: Column[] = [
//   { id: 'id', label: 'ID' },
//   { id: 'name', label: 'Name' },
//   { id: 'age', label: 'Age' },
// ];

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  const openFilter = () => setIsFilterOpen(true);
  const closeFilter = () => setIsFilterOpen(false);

  return (
    <Provider store={store}>

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

          {/* Table component */}
          <TableComponent  />
        </Box>
      </ThemeProvider>
    </Provider>
  );
};

export default App;

// components/TopBar.tsx
import React from 'react';
import { AppBar, Toolbar, Box, Typography, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import FilterComponent from './FilterComponent';
import FilterModal from './FilterModal';

interface TopBarProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ isDarkMode, toggleTheme }) => {
    // Update the logo paths as needed (these files should be placed in public/assets/)
    const logo = isDarkMode ? '/assets/dark-logo.png' : '/assets/light-logo.png';

    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    const openFilter = () => setIsFilterOpen(true);
    const closeFilter = () => setIsFilterOpen(false);

    return (
        <AppBar
            position="static"
            color="default"
            sx={{ borderBottom: 1, borderColor: 'divider', transition: 'background-color 0.5s ease, color 0.5s ease' }}
        >
            <Toolbar sx={{ position: 'relative' }}>
                {/* Left Section: Logo and Title */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        component="img"
                        src={logo}
                        alt="Company Logo"
                        sx={{ height: 40, mr: 2 }}
                    />
                    <Typography variant="h6" component="div">
                        Insights Reports
                    </Typography>
                </Box>

                {/* Center Section: Filters with Advanced Search */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    {/* Center Section: Filters with Advanced Search Label */}
                    <Box
                        sx={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >

                        <FilterComponent onOpenFilter={openFilter} />
                        <FilterModal open={isFilterOpen} handleClose={closeFilter} />
                    </Box>

                </Box>


                {/* Right Section: Theme Toggle (icon only) */}
                <Box sx={{ ml: 'auto' }}>
                    <IconButton onClick={toggleTheme}>
                        {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default TopBar;

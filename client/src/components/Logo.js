import React from 'react';
import { Box, Typography } from '@mui/material';

const Logo = ({ width = 180, height = 'auto', variant = 'full', ...props }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        ...props?.sx 
      }}
    >
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 'bold', 
          color: '#333',
          fontSize: variant === 'small' ? '1.2rem' : '1.5rem'
        }}
      >
        BiTrix
      </Typography>
      <Typography 
        variant="subtitle1" 
        sx={{ 
          ml: 1, 
          color: '#4db6ac',
          fontSize: variant === 'small' ? '0.9rem' : '1.1rem'
        }}
      >
        IT Support
      </Typography>
    </Box>
  );
};

export default Logo; 
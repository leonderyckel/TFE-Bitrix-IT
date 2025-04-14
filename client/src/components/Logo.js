import React from 'react';
import { Box, Typography } from '@mui/material';

const Logo = ({ width = 180, height = 'auto', variant = 'default', ...props }) => {
  // Définir les couleurs en fonction du contexte (sidebar ou page normale)
  const primaryColor = variant === 'sidebar' ? '#ffffff' : '#333333'; // Blanc pour sidebar, noir pour autres
  const secondaryColor = '#4db6ac'; // Turquoise comme dans le logo officiel
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'row',
        alignItems: 'center',
        width: width,
        ...props?.sx 
      }}
    >
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700, 
          color: primaryColor,
          fontSize: variant === 'small' ? '1.2rem' : '1.5rem',
          letterSpacing: '0.5px'
        }}
      >
        BiTrix
      </Typography>
      <Typography 
        variant="subtitle1" 
        sx={{ 
          ml: 1,
          color: secondaryColor,
          fontSize: variant === 'small' ? '0.9rem' : '1.1rem',
          fontWeight: 500
        }}
      >
        IT Support
      </Typography>
    </Box>
  );
};

export default Logo; 
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, Typography, Box } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

const PrinterNode = ({ data }) => {
  return (
    <Card 
        variant="outlined" 
        sx={{ 
            minWidth: 120, 
            maxWidth: 180, 
            border: '1px solid #777', 
            borderRadius: '8px', 
            backgroundColor: 'white', 
            textAlign: 'center' 
        }}
    >
      <CardContent sx={{ padding: '8px !important' }}> {/* Reduce padding */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
           <PrintIcon fontSize="medium" sx={{ mb: 0.5 }} /> {/* Smaller margin */}
           <Typography variant="caption" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
             {data?.label || 'Printer'}
           </Typography>
        </Box>
      </CardContent>
      {/* Handles pour les connexions (un en haut, un en bas) */}
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </Card>
  );
};

export default memo(PrinterNode); // Utilise memo pour optimiser les re-renders 
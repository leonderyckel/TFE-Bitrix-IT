import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, Typography, Box } from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer'; // Icône pour ordinateur

const ComputerNode = ({ data }) => {
  return (
    <Card 
        variant="outlined" 
        sx={{ 
            minWidth: 120, 
            maxWidth: 180, 
            border: '1px solid #999', 
            borderRadius: '8px', 
            backgroundColor: 'white', 
            textAlign: 'center' 
        }}
    >
      <CardContent sx={{ padding: '8px !important' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
           <ComputerIcon fontSize="medium" sx={{ mb: 0.5 }} />
           <Typography variant="caption" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
             {data?.label || 'Computer'}
           </Typography>
        </Box>
      </CardContent>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </Card>
  );
};

export default memo(ComputerNode); 
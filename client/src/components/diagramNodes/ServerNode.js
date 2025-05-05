import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, Typography, Box } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage'; // Icône pour serveur

const ServerNode = ({ data }) => {
  return (
    <Card 
        variant="outlined" 
        sx={{ 
            minWidth: 120, 
            maxWidth: 180, 
            border: '1px solid #555', 
            borderRadius: '8px', 
            backgroundColor: '#f0f4f8', // Légèrement différent pour distinction
            textAlign: 'center' 
        }}
    >
      <CardContent sx={{ padding: '8px !important' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
           <StorageIcon fontSize="medium" sx={{ mb: 0.5 }} />
           <Typography variant="caption" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
             {data?.label || 'Server'}
           </Typography>
        </Box>
      </CardContent>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </Card>
  );
};

export default memo(ServerNode); 
import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, Typography, Box, TextField, IconButton } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const SwitchNode = ({ data, id }) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingIP, setIsEditingIP] = useState(false);
  const [tempLabel, setTempLabel] = useState(data?.label || 'Switch');
  const [tempIP, setTempIP] = useState(data?.ip || '');

  const handleLabelSave = () => {
    if (data?.onNodeUpdate) {
      data.onNodeUpdate(id, { ...data, label: tempLabel });
    }
    setIsEditingLabel(false);
  };

  const handleIPSave = () => {
    if (data?.onNodeUpdate) {
      data.onNodeUpdate(id, { ...data, ip: tempIP });
    }
    setIsEditingIP(false);
  };

  const handleLabelCancel = () => {
    setTempLabel(data?.label || 'Switch');
    setIsEditingLabel(false);
  };

  const handleIPCancel = () => {
    setTempIP(data?.ip || '');
    setIsEditingIP(false);
  };

  return (
    <Card 
        variant="outlined" 
        sx={{ 
            minWidth: 140, 
            maxWidth: 200, 
            border: '2px solid #4caf50', 
            borderRadius: '8px', 
            backgroundColor: '#e8f5e8', 
            textAlign: 'center',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)'
            }
        }}
    >
      <CardContent sx={{ padding: '8px !important' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AccountTreeIcon fontSize="medium" sx={{ mb: 0.5, color: '#4caf50' }} />
          
          {/* Label editing */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            {isEditingLabel ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TextField
                  value={tempLabel}
                  onChange={(e) => setTempLabel(e.target.value)}
                  size="small"
                  variant="outlined"
                  sx={{ width: '100px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLabelSave();
                    if (e.key === 'Escape') handleLabelCancel();
                  }}
                />
                <IconButton size="small" onClick={handleLabelSave}>
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleLabelCancel}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                  {data?.label || 'Switch'}
                </Typography>
                <IconButton size="small" onClick={() => setIsEditingLabel(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>

          {/* IP editing */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isEditingIP ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TextField
                  value={tempIP}
                  onChange={(e) => setTempIP(e.target.value)}
                  size="small"
                  variant="outlined"
                  placeholder="IP Address"
                  sx={{ width: '120px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleIPSave();
                    if (e.key === 'Escape') handleIPCancel();
                  }}
                />
                <IconButton size="small" onClick={handleIPSave}>
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleIPCancel}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                  {data?.ip || 'No IP'}
                </Typography>
                <IconButton size="small" onClick={() => setIsEditingIP(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
      <Handle type="target" position={Position.Top} style={{ background: '#4caf50' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#4caf50' }} />
      <Handle type="target" position={Position.Left} style={{ background: '#4caf50' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#4caf50' }} />
    </Card>
  );
};

export default memo(SwitchNode); 
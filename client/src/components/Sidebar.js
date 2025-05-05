import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import StorageIcon from '@mui/icons-material/Storage';
import ComputerIcon from '@mui/icons-material/Computer';

// Les types de nœuds disponibles
const nodeTypes = [
    { type: 'printer', label: 'Printer', icon: <PrintIcon /> },
    { type: 'server', label: 'Server', icon: <StorageIcon /> },
    { type: 'computer', label: 'Computer', icon: <ComputerIcon /> },
    // Ajouter d'autres types ici (Switch, Router, Firewall...)
];

const Sidebar = () => {

  // Fonction appelée quand on commence à glisser un élément de la sidebar
  const onDragStart = (event, nodeType) => {
    // Stocke le type de nœud dans les données de transfert
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    console.log(`[Sidebar] Drag Start: ${nodeType}`);
  };

  return (
    <Paper 
        elevation={3} 
        sx={{ 
            width: 200, // Largeur fixe
            padding: 2, 
            height: '100%', // Prend toute la hauteur disponible
            overflowY: 'auto' // Scroll si nécessaire
        }}
    >
      <Typography variant="h6" gutterBottom>Nodes</Typography>
      {nodeTypes.map((node) => (
        <Box
          key={node.type}
          onDragStart={(event) => onDragStart(event, node.type)}
          draggable // Rend l'élément glissable
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            marginBottom: 1,
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'grab',
            backgroundColor: 'white',
            '&:hover': {
              backgroundColor: '#f0f0f0'
            }
          }}
        >
          <Box sx={{ mr: 1.5 }}>{node.icon}</Box>
          <Typography variant="body2">{node.label}</Typography>
        </Box>
      ))}
    </Paper>
  );
};

export default Sidebar; 
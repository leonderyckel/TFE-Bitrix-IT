import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Container } from '@mui/material';

function TicketDetails() {
  const { id } = useParams();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h4" gutterBottom>
          Ticket Details
        </Typography>
        <Typography variant="body1">
          Viewing ticket ID: {id}
        </Typography>
      </Paper>
    </Container>
  );
}

export default TicketDetails; 
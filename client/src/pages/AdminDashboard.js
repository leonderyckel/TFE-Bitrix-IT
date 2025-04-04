import React from 'react';
import { Box, Typography, Container, Grid, Paper } from '@mui/material';
import { useSelector } from 'react-redux';

function AdminDashboard() {
  const { user } = useSelector((state) => state.auth);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1">
              Welcome to the admin dashboard, {user?.firstName}. Here you can manage users, tickets, and system settings.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AdminDashboard; 
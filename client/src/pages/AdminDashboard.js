import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Grid, Paper, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TablePagination, Chip, IconButton, Tabs, Tab
} from '@mui/material';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_URL from '../config/api';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

function AdminDashboard() {
  const { user, token } = useSelector((state) => state.auth);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/admin/tickets`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTickets(response.data);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [token]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewTicket = (ticketId) => {
    navigate(`/admin/tickets/${ticketId}`);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'open':
        return <Chip label="Open" color="error" icon={<WarningIcon />} />;
      case 'in-progress':
        return <Chip label="In Progress" color="warning" icon={<PendingIcon />} />;
      case 'resolved':
        return <Chip label="Resolved" color="success" icon={<CheckCircleIcon />} />;
      case 'closed':
        return <Chip label="Closed" color="default" />;
      default:
        return <Chip label={status} />;
    }
  };

  const getPriorityChip = (priority) => {
    switch (priority) {
      case 'low':
        return <Chip label="Low" color="success" />;
      case 'medium':
        return <Chip label="Medium" color="info" />;
      case 'high':
        return <Chip label="High" color="warning" icon={<PriorityHighIcon />} />;
      case 'critical':
        return <Chip label="Critical" color="error" icon={<PriorityHighIcon />} />;
      default:
        return <Chip label={priority} />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (tabValue === 0) return true; // All tickets
    if (tabValue === 1) return ticket.status === 'open'; // Open tickets
    if (tabValue === 2) return ticket.status === 'in-progress'; // In progress tickets
    if (tabValue === 3) return ['resolved', 'closed'].includes(ticket.status); // Resolved tickets
    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" gutterBottom>
                Admin Dashboard
              </Typography>
              <Button variant="contained" color="primary" onClick={() => navigate('/admin/settings')}>
                System Settings
              </Button>
            </Box>
            <Typography variant="body1" sx={{ mb: 4 }}>
              Welcome to the admin dashboard, {user?.firstName}. Here you can manage users, tickets, and system settings.
            </Typography>

            <Typography variant="h5" gutterBottom>
              Ticket Management
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={tabValue} onChange={handleChangeTab}>
                <Tab label="All Tickets" />
                <Tab label="Open" />
                <Tab label="In Progress" />
                <Tab label="Resolved/Closed" />
              </Tabs>
            </Box>

            {loading ? (
              <Typography>Loading tickets...</Typography>
            ) : (
              <>
                <TableContainer>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTickets
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((ticket) => (
                          <TableRow key={ticket._id} hover>
                            <TableCell>{ticket.title}</TableCell>
                            <TableCell>
                              {ticket.client ? `${ticket.client.firstName} ${ticket.client.lastName}` : 'N/A'}
                            </TableCell>
                            <TableCell>{getStatusChip(ticket.status)}</TableCell>
                            <TableCell>{getPriorityChip(ticket.priority)}</TableCell>
                            <TableCell>{ticket.category}</TableCell>
                            <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <IconButton 
                                color="primary" 
                                onClick={() => handleViewTicket(ticket._id)}
                                title="View Ticket"
                              >
                                <VisibilityIcon />
                              </IconButton>
                              <IconButton 
                                color="primary" 
                                onClick={() => navigate(`/admin/tickets/${ticket._id}/edit`)}
                                title="Edit Ticket"
                              >
                                <EditIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredTickets.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AdminDashboard; 
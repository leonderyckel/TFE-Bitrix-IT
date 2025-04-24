import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, Typography, Container, Grid, Paper, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TablePagination, Chip, IconButton, Tabs, Tab,
  FormControl, InputLabel, Select, MenuItem
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
import CancelIcon from '@mui/icons-material/Cancel';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import io from 'socket.io-client';

// Socket instance
let socket;

function AdminDashboard() {
  const { user, token } = useSelector((state) => state.auth);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnicianFilter, setSelectedTechnicianFilter] = useState('all');
  const navigate = useNavigate();
  const socketRef = useRef();

  // Wrap fetchTickets in useCallback to avoid recreating it on every render
  const fetchTickets = useCallback(async () => {
    try {
      // Don't set loading to true here if we are just refreshing
      // setLoading(true); 
      const response = await axios.get(`${API_URL}/admin/tickets`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      // Ensure loading is set to false after fetch, even if it was just a refresh
      setLoading(false);
    }
  }, [token]); // Dependency: token

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/admins`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const techUsers = response.data.filter(admin => admin.role === 'technician');
        setTechnicians(techUsers);
      } catch (error) {
        console.error('Error fetching technicians:', error);
      }
    };

    setLoading(true); // Set loading true for initial fetch
    fetchTickets(); // Initial fetch
    fetchTechnicians();

    // --- Socket.IO Setup ---
    const serverBaseUrl = API_URL.substring(0, API_URL.indexOf('/api')) || API_URL;
    socketRef.current = io(serverBaseUrl);
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[AdminDashboard] Socket connected:', socket.id);
      // Join the admin room
      socket.emit('joinAdminRoom');
      console.log('[AdminDashboard] Emitted joinAdminRoom');
    });

    socket.on('disconnect', () => {
      console.log('[AdminDashboard] Socket disconnected');
    });

    // Listen for new tickets
    socket.on('admin:newTicket', ({ ticketId }) => {
      console.log('[AdminDashboard] Received admin:newTicket', ticketId);
      // Re-fetch the entire list when a new ticket is created
      // Could potentially just add the new ticket to the state for optimization
      fetchTickets(); 
    });

    // Listen for updates to existing tickets (status, comments, technician etc.)
    socket.on('ticket:updated', (updatedTicket) => {
      console.log('[AdminDashboard] Received ticket:updated', updatedTicket);
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket._id === updatedTicket._id ? updatedTicket : ticket
        )
      );
    });

    // Cleanup
    return () => {
      console.log('[AdminDashboard] Disconnecting socket...');
      socket.emit('leaveAdminRoom');
      socket.disconnect();
    };

  }, [fetchTickets, token]); // Include fetchTickets and token

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleTechnicianFilterChange = (event) => {
    setSelectedTechnicianFilter(event.target.value);
    setPage(0);
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
        return <Chip label="Done" color="default" />;
      case 'cancelled':
        return <Chip label="Cancelled" color="secondary" icon={<CancelIcon />} />;
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
    let statusMatch = false;
    if (tabValue === 0) statusMatch = true;
    else if (tabValue === 1) statusMatch = ticket.status === 'open';
    else if (tabValue === 2) statusMatch = ticket.status === 'in-progress';
    else if (tabValue === 3) statusMatch = ['resolved', 'closed'].includes(ticket.status);
    else if (tabValue === 4) statusMatch = ticket.status === 'cancelled';
    else statusMatch = true;

    let technicianMatch = false;
    if (!selectedTechnicianFilter || selectedTechnicianFilter === 'all') {
        technicianMatch = true;
    } else if (selectedTechnicianFilter === 'unassigned') {
        technicianMatch = !ticket.technician;
    } else {
        technicianMatch = ticket.technician && ticket.technician._id === selectedTechnicianFilter;
    }

    return statusMatch && technicianMatch;
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
              <Box>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddCircleOutlineIcon />} 
                  onClick={() => navigate('/admin/create-ticket')}
                  sx={{ mr: 1 }}
                >
                  Create Ticket for Client
                </Button>
                <Button variant="contained" color="secondary" onClick={() => navigate('/admin/settings')}>
                  System Settings
                </Button>
              </Box>
            </Box>
            <Typography variant="body1" sx={{ mb: 4 }}>
              Welcome to the admin dashboard, {user?.firstName}. Here you can manage users, tickets, and system settings.
            </Typography>

            <Typography variant="h5" gutterBottom>
              Ticket Management
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', mb: 2, flexWrap: 'wrap' }}
            >
              <Tabs value={tabValue} onChange={handleChangeTab} variant="scrollable" scrollButtons="auto" sx={{ flexGrow: 1 }}>
                <Tab label="All Statuses" />
                <Tab label="Open" />
                <Tab label="In Progress" />
                <Tab label="Resolved/Done" />
                <Tab label="Cancelled" />
              </Tabs>

              <FormControl size="small" sx={{ minWidth: 200, ml: 2, mb: 1 }}>
                <InputLabel id="technician-filter-label">Assigned To</InputLabel>
                <Select
                  labelId="technician-filter-label"
                  id="technician-filter-select"
                  value={selectedTechnicianFilter}
                  label="Assigned To"
                  onChange={handleTechnicianFilterChange}
                >
                  <MenuItem value="all">
                    <em>All Technicians</em>
                  </MenuItem>
                  <MenuItem value="unassigned">
                    <em>Unassigned</em>
                  </MenuItem>
                  {technicians.map((tech) => (
                    <MenuItem key={tech._id} value={tech._id}>
                      {tech.firstName} {tech.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                        <TableCell>Assigned To</TableCell>
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
                              {ticket.technician ? `${ticket.technician.firstName} ${ticket.technician.lastName}` : 'Unassigned'}
                            </TableCell>
                            <TableCell>
                              <IconButton 
                                color="primary" 
                                onClick={() => handleViewTicket(ticket._id)}
                                title="View Ticket"
                              >
                                <VisibilityIcon />
                              </IconButton>
                              <IconButton 
                                color="secondary"
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
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Paper, Grid, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Dialog, DialogActions, DialogContent,
  DialogTitle, TextField, FormControl, InputLabel, Select,
  MenuItem, Chip, Alert, CircularProgress
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

function AdminSettings() {
  const { user, token } = useSelector((state) => state.auth);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'technician',
    isActive: true,
    permissions: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Only super admins should access this page
    if (user?.role !== 'admin') {
      navigate('/admin');
      return;
    }

    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/admin/admins`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setAdmins(response.data);
      } catch (error) {
        console.error('Error fetching admins:', error);
        setError('Failed to load admin users. ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, [token, user, navigate]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    // Reset form
    setNewAdmin({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'technician',
      isActive: true,
      permissions: []
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/admin/admins`,
        newAdmin,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Add new admin to list
      setAdmins(prev => [...prev, response.data]);
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating admin user:', error);
      setError('Failed to create admin user. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getRoleChip = (role) => {
    switch (role) {
      case 'admin':
        return <Chip label="Admin" color="error" />;
      case 'technician':
        return <Chip label="Technician" color="primary" />;
      default:
        return <Chip label={role} />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Admin Settings
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/admin')}
          >
            Back to Dashboard
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  Admin Users & Technicians
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<PersonAddIcon />}
                  onClick={handleOpenDialog}
                >
                  Add New User
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Login</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin._id} hover>
                          <TableCell>{admin.firstName} {admin.lastName}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>{getRoleChip(admin.role)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={admin.isActive ? "Active" : "Inactive"} 
                              color={admin.isActive ? "success" : "default"} 
                            />
                          </TableCell>
                          <TableCell>
                            {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            <IconButton color="primary" title="Edit User">
                              <EditIcon />
                            </IconButton>
                            {admin._id !== user?._id && (
                              <IconButton color="error" title="Delete User">
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* Add more settings sections as needed */}
        </Grid>
      </Paper>

      {/* Dialog for adding new admin */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Admin/Technician</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={newAdmin.firstName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={newAdmin.lastName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={newAdmin.email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={newAdmin.password}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={newAdmin.role}
                  onChange={handleChange}
                  label="Role"
                >
                  <MenuItem value="technician">Technician</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="isActive"
                  value={newAdmin.isActive}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!newAdmin.firstName || !newAdmin.lastName || !newAdmin.email || !newAdmin.password}
          >
            Add User
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminSettings; 
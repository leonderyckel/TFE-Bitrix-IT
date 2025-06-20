import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Paper, Grid, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Dialog, DialogActions, DialogContent,
  DialogTitle, TextField, FormControl, InputLabel, Select,
  MenuItem, Chip, Alert, CircularProgress, Divider, Card, CardContent
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RefreshIcon from '@mui/icons-material/Refresh';
import * as yup from 'yup';
import { useFormik } from 'formik';
import { emailValidationTest } from '../utils/emailValidation';

const adminValidationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().test('email', 'Enter a valid email', emailValidationTest).required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters long')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  role: yup.string().required('Role is required')
});

function AdminSettings() {
  const { user, token } = useSelector((state) => state.auth);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countersLoading, setCountersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditStatusDialog, setOpenEditStatusDialog] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [adminToEdit, setAdminToEdit] = useState(null);
  const [counters, setCounters] = useState({
    invoiceCounter: 0,
    quoteCounter: 0
  });
  const navigate = useNavigate();

  // Formik pour la création d'admin
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'technician',
      isActive: true
    },
    validationSchema: adminValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        
        const response = await axios.post(
          `${API_URL}/admin/admins`,
          values,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        setAdmins(prev => [...prev, response.data]);
        setSuccess('Admin user created successfully!');
        
        handleCloseDialog();
        resetForm();
      } catch (error) {
        console.error('Error creating admin user:', error);
        setError('Failed to create admin user. ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    }
  });

  useEffect(() => {
    // Only admins and technicians should access this page
    if (!['admin', 'technician'].includes(user?.role)) {
      navigate('/admin');
      return;
    }

    fetchAdmins();
    fetchCounters();
  }, [token, user, navigate]);

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

  const fetchCounters = async () => {
    try {
      setCountersLoading(true);
      const response = await axios.get(`${API_URL}/admin/counters`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCounters(response.data);
    } catch (error) {
      console.error('Error fetching counters:', error);
      setError('Failed to load counters. ' + (error.response?.data?.message || error.message));
    } finally {
      setCountersLoading(false);
    }
  };

  const handleCounterAction = async (type, action, value = null) => {
    try {
      setCountersLoading(true);
      const response = await axios.put(
        `${API_URL}/admin/counters/${type}`,
        { action, value },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setSuccess(response.data.message);
      fetchCounters(); // Refresh counters
    } catch (error) {
      console.error('Error updating counter:', error);
      setError('Failed to update counter. ' + (error.response?.data?.message || error.message));
    } finally {
      setCountersLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError(null);
    setSuccess(null);
    formik.resetForm();
  };

  const handleDeleteAdmin = (admin) => {
    setAdminToDelete(admin);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/admin/admins/${adminToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAdmins(prev => prev.filter(admin => admin._id !== adminToDelete._id));
      setSuccess('Admin user deleted successfully!');
      setOpenDeleteDialog(false);
      setAdminToDelete(null);
    } catch (error) {
      console.error('Error deleting admin user:', error);
      setError('Failed to delete admin user. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    formik.resetForm();
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setAdminToDelete(null);
  };

  const handleEditStatus = (admin) => {
    setAdminToEdit(admin);
    setOpenEditStatusDialog(true);
  };

  const handleCloseEditStatusDialog = () => {
    setOpenEditStatusDialog(false);
    setAdminToEdit(null);
  };

  const handleStatusToggle = async () => {
    if (!adminToEdit) return;
    
    try {
      setLoading(true);
      const newStatus = !adminToEdit.isActive;
      
      const response = await axios.put(
        `${API_URL}/admin/admins/${adminToEdit._id}`,
        {
          firstName: adminToEdit.firstName,
          lastName: adminToEdit.lastName,
          email: adminToEdit.email,
          role: adminToEdit.role,
          isActive: newStatus,
          permissions: adminToEdit.permissions || []
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setAdmins(prev => prev.map(admin => 
        admin._id === adminToEdit._id 
          ? { ...admin, isActive: newStatus }
          : admin
      ));
      
      setSuccess(`Admin user ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      setOpenEditStatusDialog(false);
      setAdminToEdit(null);
    } catch (error) {
      console.error('Error updating admin status:', error);
      setError('Failed to update admin status. ' + (error.response?.data?.message || error.message));
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

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
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
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearMessages}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={clearMessages}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Admin Users Management Section */}
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
                            {admin._id !== user?._id && (
                              <>
                                <IconButton color="error" title="Delete User" onClick={() => handleDeleteAdmin(admin)}>
                                  <DeleteIcon />
                                </IconButton>
                                <IconButton color="primary" title="Edit Status" onClick={() => handleEditStatus(admin)}>
                                  <EditIcon />
                                </IconButton>
                              </>
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

          {/* Counter Management Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceIcon sx={{ mr: 1 }} />
                <Typography variant="h5">
                  Invoice & Quote Counters
                </Typography>
                <IconButton onClick={fetchCounters} disabled={countersLoading} sx={{ ml: 1 }}>
                  <RefreshIcon />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Invoice Counter
                      </Typography>
                      <Typography variant="h4" color="primary" gutterBottom>
                        {counters.invoiceCounter}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleCounterAction('invoices', 'increment')}
                          disabled={countersLoading}
                        >
                          +1
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() => {
                            const value = prompt('Enter new value for invoice counter:');
                            if (value && !isNaN(value)) {
                              handleCounterAction('invoices', 'set', parseInt(value));
                            }
                          }}
                          disabled={countersLoading}
                        >
                          Set Value
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleCounterAction('invoices', 'reset', 1)}
                          disabled={countersLoading}
                        >
                          Reset to 1
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Quote Counter
                      </Typography>
                      <Typography variant="h4" color="secondary" gutterBottom>
                        {counters.quoteCounter}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleCounterAction('quotes', 'increment')}
                          disabled={countersLoading}
                        >
                          +1
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() => {
                            const value = prompt('Enter new value for quote counter:');
                            if (value && !isNaN(value)) {
                              handleCounterAction('quotes', 'set', parseInt(value));
                            }
                          }}
                          disabled={countersLoading}
                        >
                          Set Value
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleCounterAction('quotes', 'reset', 1)}
                          disabled={countersLoading}
                        >
                          Reset to 1
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Dialog for adding new admin */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>Add New Admin/Technician</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                  helperText={formik.touched.firstName && formik.errors.firstName}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                  helperText={formik.touched.lastName && formik.errors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                    label="Role"
                    error={formik.touched.role && Boolean(formik.errors.role)}
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
                    value={formik.values.isActive}
                    onChange={formik.handleChange}
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
            <Button onClick={handleCloseDialog} disabled={formik.isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="contained" 
              color="primary"
              disabled={formik.isSubmitting || !formik.isValid}
            >
              {formik.isSubmitting ? <CircularProgress size={24} /> : 'Add User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog for deleting admin */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this admin user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteAdmin} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for editing admin status */}
      <Dialog open={openEditStatusDialog} onClose={handleCloseEditStatusDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Admin Status</DialogTitle>
        <DialogContent>
          {adminToEdit && (
            <>
              <Typography variant="h6" gutterBottom>
                {adminToEdit.firstName} {adminToEdit.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {adminToEdit.email}
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
                Current Status: 
                <Chip 
                  label={adminToEdit.isActive ? "Active" : "Inactive"} 
                  color={adminToEdit.isActive ? "success" : "default"} 
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography>
                Are you sure you want to {adminToEdit.isActive ? 'deactivate' : 'activate'} this admin user?
                {!adminToEdit.isActive && (
                  <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                    ⚠️ Activating this user will allow them to log in again.
                  </Typography>
                )}
                {adminToEdit.isActive && (
                  <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                    ⚠️ Deactivating this user will prevent them from logging in.
                  </Typography>
                )}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditStatusDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleStatusToggle} 
            color={adminToEdit?.isActive ? "error" : "success"} 
            variant="contained"
            autoFocus
          >
            {adminToEdit?.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminSettings; 
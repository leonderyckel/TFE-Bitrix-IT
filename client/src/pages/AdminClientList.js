import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, IconButton, Tooltip,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import API_URL from '../config/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { useFormik } from 'formik';

const clientValidationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  company: yup.string(),
  password: yup.string().when('isEditing', {
      is: false,
      then: schema => schema.required('Password is required for new clients'),
      otherwise: schema => schema.notRequired()
  })
});

function AdminClientList() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiActionError, setApiActionError] = useState(null);
  const { token, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [nameSearch, setNameSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setApiActionError(null);
      const response = await axios.get(`${API_URL}/admin/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(response.data);
      setFilteredClients(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load client list. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchClients();
    }
  }, [token, fetchClients]);

  useEffect(() => {
    let result = clients;

    if (companyFilter) {
      result = result.filter(client => client.company === companyFilter);
    }

    if (nameSearch) {
      const lowerCaseSearch = nameSearch.toLowerCase();
      result = result.filter(client => 
        client.firstName.toLowerCase().includes(lowerCaseSearch) ||
        client.lastName.toLowerCase().includes(lowerCaseSearch)
      );
    }

    setFilteredClients(result);

  }, [clients, nameSearch, companyFilter]);

  const companyOptions = [
      { value: '', label: 'All Companies' },
      ...[...new Set(clients.map(client => client.company))]
        .filter(Boolean)
        .sort()
        .map(company => ({ value: company, label: company }))
  ];

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      address: '',
      isCompanyBoss: false,
      password: '',
      isEditing: false
    },
    validationSchema: clientValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      setFormSubmitting(true);
      setApiActionError(null);
      const clientData = { ...values };
      delete clientData.isEditing;

      if (isEditing) {
        delete clientData.password;
      } else {
        delete clientData.isCompanyBoss;
      }

      try {
        if (isEditing && selectedClient) {
          await axios.put(`${API_URL}/admin/clients/${selectedClient._id}`, clientData, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          await axios.post(`${API_URL}/admin/clients`, clientData, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        handleCloseFormDialog();
        resetForm();
        fetchClients();
      } catch (err) {
        console.error('Error saving client:', err);
        setApiActionError(err.response?.data?.message || 'Failed to save client.');
      } finally {
        setFormSubmitting(false);
      }
    },
  });

  const handleClickOpenFormDialog = (client = null) => {
    setApiActionError(null);
    if (client) {
      setSelectedClient(client);
      setIsEditing(true);
      formik.setValues({
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          email: client.email || '',
          company: client.company || '',
          address: client.address || '',
          isCompanyBoss: client.isCompanyBoss || false,
          password: '',
          isEditing: true
      });
    } else {
      setSelectedClient(null);
      setIsEditing(false);
      formik.resetForm({
          values: {
              firstName: '', lastName: '', email: '', company: '', address: '',
              isCompanyBoss: false, password: '', isEditing: false
          }
      });
    }
    setOpenFormDialog(true);
  };

  const handleCloseFormDialog = () => {
    setOpenFormDialog(false);
    setSelectedClient(null);
    formik.resetForm();
  };

  const handleClickOpenDeleteDialog = (client) => {
    setApiActionError(null);
    setSelectedClient(client);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedClient(null);
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    setFormSubmitting(true);
    setApiActionError(null);
    try {
      await axios.delete(`${API_URL}/admin/clients/${selectedClient._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseDeleteDialog();
      fetchClients();
    } catch (err) {
      console.error('Error deleting client:', err);
      setApiActionError(err.response?.data?.message || 'Failed to delete client.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
       {/* Header Section with Blue Banner */}
       <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          p: 2, // Added padding
          backgroundColor: 'primary.main', // Added blue background
          color: 'white', // Added white text color for title
          borderRadius: 1 // Optional: add slight rounding
        }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', pl: 1 }}> {/* Adjusted variant slightly AND added bold/padding */}
            Client List
          </Typography>
          <Box>
             <Button
                variant="contained"
                color="secondary" // Use secondary color for contrast
                startIcon={<AddIcon />}
                onClick={() => handleClickOpenFormDialog()}
                sx={{ mr: 1 }}
             >
                Add Client
             </Button>
             <Button
                variant="outlined"
                onClick={() => navigate('/admin')}
                sx={{
                    color: 'white', // White text for outlined button
                    borderColor: 'white', // White border for outlined button
                    '&:hover': { // Optional: enhance hover state
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'white'
                    }
                 }}
             >
                Back to Dashboard
             </Button>
          </Box>
      </Box>

      {/* --- Filter/Search Controls --- */}
      <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                  <TextField
                      fullWidth
                      label="Search by Name"
                      variant="outlined"
                      value={nameSearch}
                      onChange={(e) => setNameSearch(e.target.value)}
                      size="small"
                  />
              </Grid>
              <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                      <InputLabel>Filter by Company</InputLabel>
                      <Select
                          value={companyFilter}
                          label="Filter by Company"
                          onChange={(e) => setCompanyFilter(e.target.value)}
                      >
                          {companyOptions.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                              </MenuItem>
                          ))}
                      </Select>
                  </FormControl>
              </Grid>
          </Grid>
      </Paper>
      {/* --- End Filter/Search Controls --- */}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {apiActionError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{apiActionError}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table sx={{ minWidth: 650 }} aria-label="client list table">
            <TableHead sx={{ backgroundColor: 'grey.100' }}><TableRow><TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell><TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell><TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell><TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow
                    key={client._id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {client.firstName} {client.lastName}
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.company || '-'}</TableCell>
                     <TableCell align="right">
                         <Tooltip title="Edit Client">
                             <IconButton color="primary" size="small" onClick={() => handleClickOpenFormDialog(client)}>
                                 <EditIcon fontSize="small" />
                             </IconButton>
                         </Tooltip>
                         <Tooltip title="Delete Client">
                             <IconButton color="error" size="small" onClick={() => handleClickOpenDeleteDialog(client)}>
                                 <DeleteIcon fontSize="small" />
                             </IconButton>
                         </Tooltip>
                     </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No clients found{ (nameSearch || companyFilter) ? ' matching your filters.' : '.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openFormDialog} onClose={handleCloseFormDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
             {apiActionError && <Alert severity="error" sx={{ mb: 2 }}>{apiActionError}</Alert>}
             <TextField
                autoFocus={!isEditing}
                margin="dense"
                id="firstName"
                name="firstName"
                label="First Name"
                type="text"
                fullWidth
                variant="outlined"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
             />
             <TextField
                margin="dense"
                id="lastName"
                name="lastName"
                label="Last Name"
                type="text"
                fullWidth
                variant="outlined"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
             />
             <TextField
                margin="dense"
                id="email"
                name="email"
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
             />
             <TextField
                margin="dense"
                id="company"
                name="company"
                label="Company (Optional)"
                type="text"
                fullWidth
                variant="outlined"
                value={formik.values.company}
                onChange={formik.handleChange}
                error={formik.touched.company && Boolean(formik.errors.company)}
                helperText={formik.touched.company && formik.errors.company}
             />
             <TextField
                margin="dense"
                id="address"
                name="address"
                label="Address (Optional)"
                type="text"
                fullWidth
                variant="outlined"
                value={formik.values.address || ''}
                onChange={formik.handleChange}
             />
             {/* --- Boss Status Switch --- */}
             {isEditing && (
                <Tooltip title={!formik.values.company ? "Cannot set as boss without a company name" : ( !['admin', 'technician'].includes(user?.role) ? "Only admins or technicians can change status" : "") }>
                  {/* Wrap FormControlLabel in a span for Tooltip when disabled */}
                  <span>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formik.values.isCompanyBoss}
                          onChange={(e) => formik.setFieldValue('isCompanyBoss', e.target.checked)}
                          name="isCompanyBoss"
                          color="primary"
                          // Disable if not admin/tech OR if company field is empty
                          disabled={!['admin', 'technician'].includes(user?.role) || !formik.values.company}
                        />
                      }
                      label="Set as Company Boss"
                      // Apply disabled style visually even if wrapped in span for tooltip
                      sx={{ 
                          mt: 1, 
                          display: 'block',
                          color: (!['admin', 'technician'].includes(user?.role) || !formik.values.company) ? 'text.disabled' : 'inherit' 
                      }}
                    />
                  </span>
                </Tooltip>
             )}
             {/* --- End Boss Status Switch --- */}
             {!isEditing && (
                 <TextField
                    margin="dense"
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    fullWidth
                    variant="outlined"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                 />
             )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseFormDialog} disabled={formSubmitting}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formSubmitting || !formik.isValid}>
                {formSubmitting ? <CircularProgress size={24} /> : (isEditing ? 'Save Changes' : 'Create Client')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the client "{selectedClient?.firstName} {selectedClient?.lastName}"? This action cannot be undone.
             {apiActionError && <Alert severity="error" sx={{ mt: 2 }}>{apiActionError}</Alert>}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={formSubmitting}>Cancel</Button>
          <Button onClick={handleDeleteClient} color="error" variant="contained" disabled={formSubmitting} autoFocus>
             {formSubmitting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}

export default AdminClientList; 
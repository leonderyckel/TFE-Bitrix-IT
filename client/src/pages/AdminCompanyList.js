import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Container, Typography, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, IconButton, Tooltip,
  Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText,
  TextField, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import { useNavigate, Link } from 'react-router-dom';
import * as yup from 'yup';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import API_URL from '../config/api';

const companyValidationSchema = yup.object({
  companyName: yup.string().required('Company name is required').trim(),
});

const AdminCompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiActionError, setApiActionError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    setApiActionError(null);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const { data } = await axios.get(`${API_URL}/admin/companies-with-data`, config);
      console.log('Companies data received:', data);
      setCompanies(data);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err.response?.data?.message || 'Failed to fetch companies');
      enqueueSnackbar(`Error fetching companies: ${err.response?.data?.message || err.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleViewDataClick = (company) => {
    console.log('Viewing data for:', company);
    const sensitiveDataToShow = company.sensitiveData && company.sensitiveData.length > 0
        ? company.sensitiveData[0] 
        : null;
    setSelectedCompany({ name: company.name, sensitiveData: sensitiveDataToShow });
    setIsDataModalOpen(true);
  };

  const handleCloseDataModal = () => {
    setIsDataModalOpen(false);
    setSelectedCompany(null);
  };

  const formik = useFormik({
    initialValues: {
      companyName: '',
    },
    validationSchema: companyValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      console.log('[Submit] Attempting to add company:', values);
      setFormSubmitting(true);
      setApiActionError(null);
      try {
        const token = localStorage.getItem('token');
        console.log(`[Submit] Sending POST to ${API_URL}/admin/companies with token.`);
        const response = await axios.post(`${API_URL}/admin/companies`, values, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('[Submit] POST request successful:', response.data);
        enqueueSnackbar(`Company '${values.companyName}' added successfully!`, { variant: 'success' });
        resetForm();
        setIsAddModalOpen(false);
        console.log('[Submit] Fetching updated companies list...');
        fetchCompanies();
      } catch (err) {
        console.error('[Submit] Error adding company:', err);
        if (err.response) {
            console.error('[Submit] Error response data:', err.response.data);
            console.error('[Submit] Error response status:', err.response.status);
            console.error('[Submit] Error response headers:', err.response.headers);
        } else if (err.request) {
            console.error('[Submit] Error request data:', err.request);
        } else {
            console.error('[Submit] Error message:', err.message);
        }
        const errorMessage = err.response?.data?.message || 'Failed to add company.';
        setApiActionError(errorMessage);
        enqueueSnackbar(`Error: ${errorMessage}`, { variant: 'error' });
      } finally {
        console.log('[Submit] Setting formSubmitting to false.');
        setFormSubmitting(false);
      }
    },
  });

  const handleOpenAddModal = () => {
    setApiActionError(null);
    formik.resetForm();
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        p: 2,
        backgroundColor: 'primary.main',
        color: 'white',
        borderRadius: 1
      }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', pl: 1 }}>
          Company List
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
            sx={{ mr: 1 }}
          >
            Add Company
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/admin')}
            sx={{
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search by Company Name"
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      {loading && <CircularProgress />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="companies table">
            <TableHead>
              <TableRow>
                <TableCell>Company Name</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center">No companies added yet.</TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.name}>
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {company.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {company.sensitiveData && company.sensitiveData.length > 0 && 
                        company.sensitiveData.some(d => d.diagramData || d.credentials?.length > 0 || d.notes) ? (
                        <Tooltip title="Sensitive data exists"> 
                          <span><IconButton size="small" disabled style={{ opacity: 0.3, cursor: 'default' }}><span style={{fontSize: '0.8em'}}>✓</span></IconButton></span>
                        </Tooltip>
                      ) : null}

                      <Tooltip title="Stored Passwords">
                        <IconButton 
                          component={Link}
                          to={`/admin/companies/${encodeURIComponent(company.name)}`} 
                          size="small"
                          color="secondary"
                        >
                          <VpnKeyIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Remote Access">
                        <IconButton 
                          component={Link}
                          to={`/admin/companies/${encodeURIComponent(company.name)}/remote`} 
                          size="small"
                          color="info"
                          sx={{ ml: 1 }}
                        >
                          <SettingsRemoteIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Network Diagram">
                        <IconButton 
                          component={Link}
                          to={`/admin/companies/${encodeURIComponent(company.name)}/diagram`} 
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        >
                          <AccountTreeIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={isAddModalOpen} onClose={handleCloseAddModal} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Company</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Enter the name of the new company. Associated data can be added later.
            </DialogContentText>
            {apiActionError && <Alert severity="error" sx={{ mb: 2 }}>{apiActionError}</Alert>}
            <TextField
              autoFocus
              margin="dense"
              id="companyName"
              name="companyName"
              label="Company Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formik.values.companyName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.companyName && Boolean(formik.errors.companyName)}
              helperText={formik.touched.companyName && formik.errors.companyName}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddModal} disabled={formSubmitting}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formSubmitting}>
              {formSubmitting ? <CircularProgress size={24} /> : 'Add Company'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

    </Container>
  );
};

export default AdminCompanyList; 
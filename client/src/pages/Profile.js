import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Paper, Grid, TextField,
  Button, Alert, CircularProgress, Avatar, Divider
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { useFormik } from 'formik';
import * as yup from 'yup';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const validationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  company: yup.string(),
  vat: yup.string(),
  address: yup.string(),
  currentPassword: yup.string().when('newPassword', {
    is: (value) => value && value.length > 0,
    then: (schema) => schema.required('Current password is required to change password'),
    otherwise: (schema) => schema.notRequired()
  }),
  newPassword: yup.string()
    .min(8, 'Password must be at least 8 characters long')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: yup.string().when('newPassword', {
    is: (value) => value && value.length > 0,
    then: (schema) => schema.oneOf([yup.ref('newPassword')], 'Passwords must match').required('Please confirm your new password'),
    otherwise: (schema) => schema.notRequired()
  })
});

function Profile() {
  const { user, token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'technician';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? '/admin/profile' : '/users/me';
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProfileData(response.data);
      formik.setValues({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        email: response.data.email || '',
        company: response.data.company || '',
        vat: response.data.vat || '',
        address: response.data.address || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      vat: '',
      address: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        const updateData = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email
        };

        // Add client-specific fields
        if (!isAdmin) {
          updateData.company = values.company;
          updateData.vat = values.vat;
          updateData.address = values.address;
        }

        // Add password change if provided
        if (values.newPassword) {
          updateData.currentPassword = values.currentPassword;
          updateData.newPassword = values.newPassword;
        }

        const endpoint = isAdmin ? '/admin/profile' : '/users/profile';
        const response = await axios.put(`${API_URL}${endpoint}`, updateData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setProfileData(response.data);
        setSuccess('Profile updated successfully!');
        setEditing(false);
        
        // Clear password fields
        formik.setFieldValue('currentPassword', '');
        formik.setFieldValue('newPassword', '');
        formik.setFieldValue('confirmPassword', '');

      } catch (error) {
        console.error('Error updating profile:', error);
        setError('Failed to update profile. ' + (error.response?.data?.message || error.message));
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleEditToggle = () => {
    if (editing) {
      // Cancel editing - reset form
      formik.resetForm();
      fetchProfile();
    }
    setEditing(!editing);
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
              My Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your personal information and account settings
            </Typography>
          </Box>
          <Button
            variant={editing ? "outlined" : "contained"}
            startIcon={editing ? <CancelIcon /> : <EditIcon />}
            onClick={handleEditToggle}
            color={editing ? "secondary" : "primary"}
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
                disabled={!editing}
                variant={editing ? "outlined" : "filled"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
                disabled={!editing}
                variant={editing ? "outlined" : "filled"}
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
                disabled={!editing}
                variant={editing ? "outlined" : "filled"}
              />
            </Grid>

            {!isAdmin && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company"
                    name="company"
                    value={formik.values.company}
                    onChange={formik.handleChange}
                    disabled={!editing}
                    variant={editing ? "outlined" : "filled"}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="VAT Number"
                    name="vat"
                    value={formik.values.vat}
                    onChange={formik.handleChange}
                    disabled={!editing}
                    variant={editing ? "outlined" : "filled"}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    multiline
                    rows={2}
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    disabled={!editing}
                    variant={editing ? "outlined" : "filled"}
                  />
                </Grid>
              </>
            )}

            {editing && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Change Password (Optional)
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={formik.values.currentPassword}
                    onChange={formik.handleChange}
                    error={formik.touched.currentPassword && Boolean(formik.errors.currentPassword)}
                    helperText={formik.touched.currentPassword && formik.errors.currentPassword}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={formik.values.newPassword}
                    onChange={formik.handleChange}
                    error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
                    helperText={formik.touched.newPassword && formik.errors.newPassword}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                  />
                </Grid>
              </>
            )}

            {editing && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleEditToggle}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default Profile; 
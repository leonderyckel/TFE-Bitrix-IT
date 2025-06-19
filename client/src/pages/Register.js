import React, { useEffect, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Paper,
  MenuItem
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { register, loginSuccess } from '../store/slices/authSlice';
import { emailValidationTest } from '../utils/emailValidation';

const validationSchema = yup.object({
  email: yup
    .string()
    .test('email', 'Please enter a valid email address', emailValidationTest)
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  firstName: yup
    .string()
    .min(2, 'First name must be at least 2 characters long')
    .required('First name is required'),
  lastName: yup
    .string()
    .min(2, 'Last name must be at least 2 characters long')
    .required('Last name is required'),
  role: yup
    .string()
    .required('Role is required'),
  company: yup
    .string()
    .when('role', {
      is: 'client',
      then: (schema) => schema.min(2, 'Company name must be at least 2 characters long').required('Company is required for clients'),
      otherwise: (schema) => schema.notRequired(),
    }),
  vat: yup.string(),
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, registrationSuccess } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/tickets');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (registrationSuccess) {
      // Rediriger vers la page de connexion avec un paramètre de succès
      navigate('/login?registered=true');
    }
  }, [registrationSuccess, navigate]);

  const getServerErrorMessage = (error) => {
    if (typeof error === 'string') {
      // Check for specific error types and provide clear guidance
      if (error.toLowerCase().includes('user already exists') || error.toLowerCase().includes('already')) {
        return 'An account with this email already exists. Please try logging in or use a different email address.';
      }
      if (error.toLowerCase().includes('email') && error.toLowerCase().includes('invalid')) {
        return 'Please enter a valid email address.';
      }
      if (error.toLowerCase().includes('password')) {
        if (error.includes('shorter than the minimum')) {
          return 'Password is too short. Please use at least 8 characters.';
        }
        if (error.includes('validation failed')) {
          return 'Password does not meet security requirements. Please ensure it contains at least 8 characters, including uppercase, lowercase, numbers, and special characters.';
        }
        return 'Password does not meet the required criteria. Please check the password requirements below.';
      }
      if (error.toLowerCase().includes('company') || error.toLowerCase().includes('required')) {
        return 'Please fill in all required fields correctly.';
      }
      return error;
    }
    return 'An error occurred during registration. Please check your information and try again.';
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'client',
      company: '',
      address: '',
      vat: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      console.log('Register attempt with:', values);
      const resultAction = await dispatch(register(values));

      if (register.fulfilled.match(resultAction)) {
        console.log('Registration successful, state updated, redirecting...');
      } else {
        console.error('Registration failed:', resultAction.payload || 'Unknown error');
      }
    }
  });

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {getServerErrorMessage(error)}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ mt: 3, width: '100%' }}
          >
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              margin="normal"
            />
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              margin="normal"
            />
            <TextField
              fullWidth
              id="firstName"
              name="firstName"
              label="First Name"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              error={formik.touched.firstName && Boolean(formik.errors.firstName)}
              helperText={formik.touched.firstName && formik.errors.firstName}
              margin="normal"
            />
            <TextField
              fullWidth
              id="lastName"
              name="lastName"
              label="Last Name"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              error={formik.touched.lastName && Boolean(formik.errors.lastName)}
              helperText={formik.touched.lastName && formik.errors.lastName}
              margin="normal"
            />
            <TextField
              fullWidth
              id="company"
              name="company"
              label="Company"
              value={formik.values.company}
              onChange={formik.handleChange}
              error={formik.touched.company && Boolean(formik.errors.company)}
              helperText={formik.touched.company && formik.errors.company}
              margin="normal"
            />
            <TextField
              fullWidth
              id="address"
              name="address"
              label="Address (Optional)"
              value={formik.values.address}
              onChange={formik.handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              id="vat"
              name="vat"
              label="VAT Number (Optional)"
              value={formik.values.vat}
              onChange={formik.handleChange}
              margin="normal"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign up'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 
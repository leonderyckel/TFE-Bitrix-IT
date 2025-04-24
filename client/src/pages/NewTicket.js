import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Alert,
  CircularProgress,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel
} from '@mui/material';
import { createTicket } from '../store/slices/ticketSlice';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

const NewTicket = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.tickets);

  const [formData, setFormData] = useState({
    description: '',
    priority: '',
    category: ''
  });
  const [suggestedDate, setSuggestedDate] = useState(null);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Generate title from description
    const words = formData.description.trim().split(/\s+/); // Split by whitespace
    const generatedTitle = words.slice(0, 3).join(' ');

    // Ensure there's a title even if description is short or empty (though validation prevents empty)
    const finalTitle = generatedTitle || 'New Ticket'; 

    const ticketData = {
      ...formData,
      title: finalTitle
    };

    // Add suggestedDate if selected and valid
    if (suggestedDate && dayjs(suggestedDate).isValid()) {
      ticketData.suggestedDate = dayjs(suggestedDate).toISOString();
    }

    try {
      await dispatch(createTicket(ticketData)).unwrap(); // Send combined data
      navigate('/tickets');
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || 'Failed to create ticket. Please try again.',
      }));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create New Ticket
          </Typography>
          
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl component="fieldset" required error={!!errors.category}>
                  <FormLabel component="legend">Category</FormLabel>
                  <RadioGroup
                    row
                    aria-label="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <FormControlLabel value="hardware" control={<Radio />} label="Hardware" />
                    <FormControlLabel value="software" control={<Radio />} label="Software" />
                    <FormControlLabel value="network" control={<Radio />} label="Network" />
                    <FormControlLabel value="security" control={<Radio />} label="Security" />
                    <FormControlLabel value="other" control={<Radio />} label="Other" />
                  </RadioGroup>
                  {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl component="fieldset" required error={!!errors.priority}>
                  <FormLabel component="legend">Priority</FormLabel>
                  <RadioGroup
                    row
                    aria-label="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <FormControlLabel value="low" control={<Radio sx={{color: 'success.main', '&.Mui-checked': { color: 'success.dark' }}} />} label="Low" />
                    <FormControlLabel value="medium" control={<Radio sx={{color: 'info.main', '&.Mui-checked': { color: 'info.dark' }}} />} label="Medium" />
                    <FormControlLabel value="high" control={<Radio sx={{color: 'warning.main', '&.Mui-checked': { color: 'warning.dark' }}} />} label="High" />
                    <FormControlLabel value="critical" control={<Radio sx={{color: 'error.main', '&.Mui-checked': { color: 'error.dark' }}} />} label="Critical" />
                  </RadioGroup>
                  {errors.priority && <FormHelperText>{errors.priority}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={6}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  error={!!errors.description}
                  helperText={errors.description || "Please provide detailed information about your issue"}
                />
              </Grid>

              <Grid item xs={12}>
                <DateTimePicker
                  label="Suggested Appointment Time (Optional)"
                  ampm={false}
                  value={suggestedDate}
                  onChange={(newValue) => {
                    setSuggestedDate(newValue);
                  }}
                  renderInput={(params) => 
                    <TextField {...params} fullWidth />
                  }
                />
              </Grid>
              
              <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/tickets')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  Submit Ticket
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default NewTicket; 
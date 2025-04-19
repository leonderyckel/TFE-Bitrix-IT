import React, { useState, useEffect } from 'react';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Container, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import API_URL from '../config/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Setup the localizer by providing the moment (or dayjs) library
const localizer = dayjsLocalizer(dayjs);

function AdminCalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/admin/calendar-tickets`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Map the response data to the format required by react-big-calendar
        const formattedEvents = response.data.map(eventData => ({
          id: eventData.id,
          title: eventData.title,       // Title format: "Client Name - Ticket Title"
          start: dayjs(eventData.start).toDate(), // Convert ISO string/Date to Date object
          end: dayjs(eventData.start).add(1, 'hour').toDate(), // Assume 1 hour duration for display
          resource: eventData.resource, // Store original ticket data if needed
          description: eventData.description
        }));

        setEvents(formattedEvents);
      } catch (err) {
        console.error('Error fetching calendar events:', err);
        setError('Failed to load calendar events. ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCalendarEvents();
    }
  }, [token]);

  const handleSelectEvent = (event) => {
    // Navigate to the ticket details page when an event is clicked
    if (event.id) {
      navigate(`/admin/tickets/${event.id}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Scheduled Tickets Calendar
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ height: '70vh' }}> {/* Set a height for the calendar container */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent} // Handle event click
              tooltipAccessor={(event) => event.description} // Show description on hover
              views={['month', 'week', 'day']} // Available views
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default AdminCalendarView; 
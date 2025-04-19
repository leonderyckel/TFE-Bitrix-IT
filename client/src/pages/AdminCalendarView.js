import React, { useState, useEffect } from 'react';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Container, Paper, Typography, CircularProgress, Alert, Avatar, useTheme, GlobalStyles, alpha } from '@mui/material';
import axios from 'axios';
import API_URL from '../config/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Setup the localizer by providing the moment (or dayjs) library
const localizer = dayjsLocalizer(dayjs);

// Custom Event Component
const CustomEvent = ({ event }) => {
  const theme = useTheme();
  const startTime = dayjs(event.start).format('HH:mm');

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      overflow: 'hidden',
      height: '100%',
      p: '2px 4px',
      bgcolor: alpha(theme.palette.primary.main, 0.85),
      color: theme.palette.primary.contrastText,
      borderRadius: '4px',
      fontSize: '0.75rem',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        bgcolor: alpha(theme.palette.primary.main, 1),
        boxShadow: theme.shadows[2]
      }
    }}>
      <Avatar 
        sx={{ 
          width: 20, 
          height: 20, 
          fontSize: '0.7rem', 
          bgcolor: theme.palette.primary.dark,
          color: theme.palette.primary.contrastText,
          flexShrink: 0,
          mr: 0.5
        }}
      >
        {event.clientName ? event.clientName[0].toUpperCase() : '?'}
      </Avatar>
      <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.2, color: 'inherit' }}>
          {event.clientName}
        </Typography>
        <Typography variant="caption" component="div" sx={{ lineHeight: 1.1, color: 'inherit', opacity: 0.9 }}>
          {startTime} - {event.ticketTitle}
        </Typography>
      </Box>
    </Box>
  );
};

// Global styles for react-big-calendar integration
const calendarGlobalStyles = (
  <GlobalStyles styles={(theme) => ({
    '.rbc-toolbar button': {
      color: theme.palette.primary.main,
      border: `1px solid ${alpha(theme.palette.primary.light, 0.5)}`,
      padding: '5px 10px',
      borderRadius: theme.shape.borderRadius,
      backgroundColor: 'transparent',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
        borderColor: theme.palette.primary.main,
      },
      '&:active': {
        backgroundColor: theme.palette.action.selected,
      },
      '&.rbc-active': {
         backgroundColor: theme.palette.primary.main,
         color: theme.palette.primary.contrastText,
         borderColor: theme.palette.primary.main,
         '&:hover': {
           backgroundColor: theme.palette.primary.dark,
         }
      },
      textAlign: 'center'
    },
    '.rbc-toolbar': {
      marginBottom: theme.spacing(2),
      alignItems: 'center',
      fontSize: '1rem'
    },
    '.rbc-toolbar .rbc-toolbar-label': {
      fontSize: '1.5em', 
      fontWeight: 'bold',
      color: theme.palette.text.primary
    },
    '.rbc-header': {
      padding: '10px 5px',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: '0.9em',
      borderBottom: `1px solid ${theme.palette.divider}`,
      borderLeft: `1px solid ${theme.palette.divider}`,
      backgroundColor: alpha(theme.palette.grey[500], 0.05),
      color: theme.palette.text.secondary
    },
    '.rbc-event': {
      padding: '0px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    '.rbc-day-bg.rbc-today': {
      backgroundColor: alpha(theme.palette.primary.light, 0.15),
      border: `1px solid ${theme.palette.primary.light}`
    },
    '.rbc-day-bg:not(.rbc-off-range-bg):hover': {
      backgroundColor: alpha(theme.palette.action.hover, 0.5)
    },
    '.rbc-month-view, .rbc-time-view, .rbc-agenda-view': {
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        overflow: 'hidden'
    }
  })} />
);

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
          title: eventData.title,       // Original combined title for tooltip/accessibility
          clientName: eventData.clientName, // Pass clientName
          ticketTitle: eventData.ticketTitle, // Pass ticketTitle
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
      {calendarGlobalStyles} {/* Inject global styles */}
      <Paper sx={{ p: 3, overflow: 'hidden' }}> {/* Add overflow hidden */}
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
              tooltipAccessor={(event) => `${event.clientName} - ${event.ticketTitle}\n${event.description}`} // Show client/title and description
              views={['month', 'week', 'day']} // Available views
              components={{  // Add this prop to use the custom component
                event: CustomEvent,
              }}
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default AdminCalendarView; 
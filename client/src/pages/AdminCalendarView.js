import React, { useState, useEffect } from 'react';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Container, Paper, Typography, CircularProgress, Alert, Avatar, useTheme, GlobalStyles, alpha } from '@mui/material';
import axios from 'axios';
import API_URL from '../config/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';

// Setup the localizer by providing the moment (or dayjs) library
const localizer = dayjsLocalizer(dayjs);

// Custom Event Component - Back to Google Calendar style
const CustomEvent = ({ event }) => {
  const theme = useTheme();
  const startTime = dayjs(event.start).format('HH:mm');

  return (
    <Box sx={{
      height: '100%',
      p: '1px 4px',
      bgcolor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderRadius: '4px',
      fontSize: '0.7rem',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      lineHeight: 1.3
    }}>
      <Typography variant="caption" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'inherit' }}>
        {startTime} {event.ticketTitle}
      </Typography>
    </Box>
  );
};

// Global styles - Ultra Minimalist + Button Fix
const calendarGlobalStyles = (
  <GlobalStyles styles={(theme) => ({
    '.rbc-calendar': { 
      backgroundColor: theme.palette.background.paper,
      fontFamily: theme.typography.fontFamily,
      borderRadius: theme.shape.borderRadius,
      overflow: 'visible',
      border: `1px solid ${theme.palette.divider}`,
      height: '100%'
    },
    '.rbc-toolbar': {
      marginBottom: theme.spacing(1.5),
      padding: theme.spacing(1, 1.5),
      backgroundColor: theme.palette.primary.main,
      borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
      display: 'flex',
      alignItems: 'center'
    },
    '.rbc-toolbar button': {
      border: 'none',
      padding: '6px 16px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontWeight: 'bold',
      textTransform: 'none',
      margin: '0 4px',
      fontSize: '0.875rem',
      minWidth: 'auto',
      borderRadius: theme.shape.borderRadius,
      transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
      lineHeight: 1.75,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.1)
      },
    },
    '.rbc-btn-group > button': { 
      border: `1px solid ${alpha(theme.palette.primary.contrastText, 0.5)}`,
      color: theme.palette.primary.contrastText,
      backgroundColor: 'transparent',
      padding: '5px 15px',
      '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.08),
        borderColor: alpha(theme.palette.primary.contrastText, 0.8),
      },
      borderRadius: theme.shape.borderRadius, 
      '&:not(:first-of-type)': {
        marginLeft: '-1px'
      },
    },
    '.rbc-btn-group > button.rbc-active': { 
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.primary.contrastText,
      borderColor: theme.palette.primary.dark,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        borderColor: theme.palette.primary.dark,
      },
    },
    '.rbc-toolbar button:not(.rbc-btn-group > button)': {
      backgroundColor: 'transparent',
      border: 'none',
      padding: '6px 12px',
      '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.1)
      },
      '&:active': {
        backgroundColor: alpha(theme.palette.common.white, 0.2),
        boxShadow: 'none'
      }
    },
    '.rbc-toolbar .rbc-toolbar-label': {
      fontSize: '1.3em', 
      fontWeight: 'bold',
      color: theme.palette.primary.contrastText,
      textAlign: 'center',
      flexGrow: 1
    },
    '.rbc-header': {
      padding: '8px 3px',
      textAlign: 'center',
      fontWeight: 500,
      fontSize: '0.7em',
      borderBottom: 'none',
      borderLeft: 'none',
      backgroundColor: 'transparent',
      color: alpha(theme.palette.text.secondary, 0.8),
      textTransform: 'uppercase'
    },
    '.rbc-month-view': {
      border: 'none'
    },
    '.rbc-month-row': {
      borderBottom: 'none'
    },
    '.rbc-day-bg': {
      borderLeft: 'none'
    },
    '.rbc-off-range-bg': {
        backgroundColor: alpha(theme.palette.grey[500], 0.05)
    },
    '.rbc-date-cell': {
      textAlign: 'right',
      padding: '4px 6px',
      fontSize: '0.8rem',
      color: theme.palette.text.secondary,
      fontWeight: 'bold',
      position: 'relative',
      zIndex: 1
    },
    '.rbc-date-cell.rbc-now': {
      fontWeight: 'bold'
    },
    '.rbc-day-bg.rbc-today': {
      backgroundColor: alpha(theme.palette.primary.light, 0.08)
    },
    '.rbc-time-view .rbc-header': {
       borderBottom: `1px solid ${theme.palette.divider}`,
       textAlign: 'center',
       padding: theme.spacing(0.5, 0)
    },
    '.rbc-time-header-content .rbc-header > a': {
       display: 'block',
       fontSize: '1.5em',
       fontWeight: 400,
       color: theme.palette.text.primary,
       textDecoration: 'none'
    },
    '.rbc-time-header-content .rbc-header > span': {
       fontSize: '0.7em',
       textTransform: 'uppercase',
       color: theme.palette.text.secondary
    },
     '.rbc-time-header-cell.rbc-current > a': {
         color: theme.palette.primary.contrastText + ' !important',
         backgroundColor: theme.palette.primary.main + ' !important',
         borderRadius: '50%',
         width: '32px',
         height: '32px',
         lineHeight: '32px'
     },
     '.rbc-time-content': {
         borderTop: 'none',
         backgroundColor: theme.palette.background.paper
     },
     '.rbc-time-slot': {
         borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`
     },
     '.rbc-time-content > * > * > .rbc-day-slot': {
         borderLeft: 'none'
     },
     '.rbc-time-gutter': {
         fontSize: '0.7em',
         color: alpha(theme.palette.text.secondary, 0.8),
         borderRight: 'none',
         backgroundColor: 'transparent'
     },
     '.rbc-current-time-indicator': {
         backgroundColor: theme.palette.error.main,
         height: '2px'
     },
    '.rbc-date-cell.rbc-current > a': {
        color: theme.palette.primary.contrastText + ' !important',
        backgroundColor: theme.palette.primary.main + ' !important',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        lineHeight: '24px',
        position: 'relative', 
        zIndex: 2 
    },
    '.rbc-day-bg:not(.rbc-off-range-bg):hover': {
      backgroundColor: theme.palette.action.hover,
      transition: 'background-color 0.15s ease-out'
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
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {calendarGlobalStyles}
      <Box sx={{ p: 0, overflow: 'hidden' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ height: '80vh' }} className="rbc-calendar">
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
              onSelectEvent={handleSelectEvent}
              tooltipAccessor={(event) => `${event.clientName} - ${event.ticketTitle}\n${event.description}`}
              views={['month', 'week', 'day']}
              components={{
                event: CustomEvent,
              }}
            />
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default AdminCalendarView; 
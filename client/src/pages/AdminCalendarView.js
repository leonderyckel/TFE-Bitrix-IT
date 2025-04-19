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
      borderBottom: `1px solid ${theme.palette.divider}`,
      backgroundColor: 'transparent'
    },
    '.rbc-toolbar button': { // Base style for all toolbar buttons
      border: 'none',
      padding: '6px 16px', // MUI default button padding
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontWeight: 'bold',
      textTransform: 'none', // Match example button
      margin: '0 4px',
      fontSize: '0.875rem', // MUI default button font size
      minWidth: 'auto',
      borderRadius: theme.shape.borderRadius, // Standard MUI rounding
      transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease', // Smooth transitions
      lineHeight: 1.75, // MUI default
      '&:hover': {
         backgroundColor: 'transparent' // Reset generic hover
      },
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
       '&:hover': {
           backgroundColor: theme.palette.primary.dark,
       }
    },
    // Override for View Buttons (Month, Week, Day) - Outlined style by default
    '.rbc-btn-group > button': { 
         border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
         color: theme.palette.primary.main,
         backgroundColor: 'transparent', // Reset to transparent for outlined
         padding: '5px 15px', // Adjust padding for outlined
         '&:hover': {
             backgroundColor: alpha(theme.palette.primary.main, 0.04), // MUI outlined hover
             borderColor: theme.palette.primary.main,
         },
          // Remove specific :first-of-type/:last-of-type radius, apply to all
          borderRadius: theme.shape.borderRadius, 
           '&:not(:first-of-type)': {
              marginLeft: '-1px' // Overlap borders like ButtonGroup
          },
          // Override :active state to prevent default grey flash
          '&:active': {
           // Remove specific :active override for default outlined state
          }
    },
    // Style for ACTIVE View Button - Contained style
    '.rbc-btn-group > button.rbc-active': { 
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        borderColor: theme.palette.primary.main,
        '&:hover': {
           backgroundColor: theme.palette.primary.dark,
           borderColor: theme.palette.primary.dark,
        },
        // Ensure active state doesn't get overridden by general :active
        '&:active': {
           // Keep active style on click
            backgroundColor: theme.palette.primary.main,
            borderColor: theme.palette.primary.main
        }
    },
    // Force non-active view buttons to stay transparent during click
    '.rbc-btn-group > button:not(.rbc-active):active': {
        backgroundColor: 'transparent !important', // Force transparent background
        boxShadow: 'none !important' // Remove any click shadow
    },
    // Override default button styles (like Today/Back/Next) that should be contained
    // Use specific classes if possible instead of :not([class*="rbc-active"])
    '.rbc-toolbar button:not(.rbc-btn-group > button)': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        border: 'none', // Ensure no border
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
        },
        '&:active': {
           backgroundColor: theme.palette.primary.dark, // Keep dark on click
           boxShadow: 'none'
        }
    },
    // Re-apply specific style for Today, Back, Next (Contained) - More robust if classes exist
    // Placeholder selectors, replace with actual classes if possible
    '.rbc-toolbar .rbc-toolbar-label': {
      fontSize: '1.3em', 
      fontWeight: 'bold', // Bold title
      color: theme.palette.text.primary,
      textAlign: 'center'
    },
    '.rbc-header': {
      padding: '8px 3px',
      textAlign: 'center',
      fontWeight: 500,
      fontSize: '0.7em', // Even smaller header text
      borderBottom: 'none', // No border below headers
      borderLeft: 'none',
      backgroundColor: 'transparent',
      color: alpha(theme.palette.text.secondary, 0.8), // Lighter grey text
      textTransform: 'uppercase'
    },
    '.rbc-month-view': {
      border: 'none'
    },
    '.rbc-month-row': {
      borderBottom: 'none' // No border between weeks
    },
    '.rbc-day-bg': {
      borderLeft: 'none' // No vertical divider
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
    // --- Week/Day View Specific Styles ---
    '.rbc-time-view .rbc-header': { // Header in Time view (Day names + numbers)
       borderBottom: `1px solid ${theme.palette.divider}`, // Keep border below header
       textAlign: 'center',
       padding: theme.spacing(0.5, 0)
    },
    '.rbc-time-header-content .rbc-header > a': { // Day number link in header
       display: 'block',
       fontSize: '1.5em', // Larger day number
       fontWeight: 400,
       color: theme.palette.text.primary,
       textDecoration: 'none'
    },
    '.rbc-time-header-content .rbc-header > span': { // Day name (MON, TUE...) in header
       fontSize: '0.7em',
       textTransform: 'uppercase',
       color: theme.palette.text.secondary
    },
     '.rbc-time-header-cell.rbc-current > a': { // Today's number in Week/Day header
         color: theme.palette.primary.contrastText + ' !important',
         backgroundColor: theme.palette.primary.main + ' !important',
         borderRadius: '50%',
         width: '32px', // Slightly larger circle
         height: '32px',
         lineHeight: '32px'
     },
     '.rbc-time-content': { // Main content area with time slots
         borderTop: 'none', // No top border needed
         backgroundColor: theme.palette.background.paper // Ensure white background
     },
     '.rbc-time-slot': { // Individual time slot row
         borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` // Keep faint horizontal lines
     },
     '.rbc-time-content > * > * > .rbc-day-slot': { // Day columns within time view
         borderLeft: 'none' // Ensure no vertical lines
     },
     '.rbc-time-gutter': { // Time labels on the left
         fontSize: '0.7em', // Smaller time labels
         color: alpha(theme.palette.text.secondary, 0.8), // Lighter time labels
         borderRight: 'none', // No border for gutter
         backgroundColor: 'transparent' // No background for gutter
     },
     '.rbc-current-time-indicator': {
         backgroundColor: theme.palette.error.main,
         height: '2px' // Make line slightly thicker
     },
    // --- End Week/Day View Styles ---
    '.rbc-date-cell.rbc-current > a': { // Target the anchor inside today's date cell (Month View)
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
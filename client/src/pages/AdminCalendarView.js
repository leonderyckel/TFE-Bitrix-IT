import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Box, Container, Typography, CircularProgress, Alert, useTheme,
  GlobalStyles, alpha,
  FormControl, FormGroup, FormControlLabel, Checkbox,
  List, ListItem, ListSubheader
} from '@mui/material';
import axios from 'axios';
import API_URL from '../config/api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';

// Setup the localizer by providing the moment (or dayjs) library
const localizer = dayjsLocalizer(dayjs);

// Palette de couleurs
const technicianColors = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#17becf', '#bcbd22', '#7f7f7f'
];
const defaultColor = '#cccccc'; // Gris clair pour non assigné

// Custom Event Component - Let eventPropGetter control background
const CustomEvent = ({ event, style }) => {
  const theme = useTheme();
  const startTime = dayjs(event.start).format('HH:mm');
  // Use background color from style prop IF PROVIDED, otherwise default (should always be provided now)
  const backgroundColor = style?.backgroundColor || defaultColor; 
  const textColor = theme.palette.getContrastText(backgroundColor);

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%',
      p: '1px 4px',
      // bgcolor: backgroundColor, // REMOVED - Let the container style (from eventPropGetter) handle this
      color: textColor, 
      borderRadius: '4px', 
      fontSize: '0.7rem',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      lineHeight: 1.2, 
      boxSizing: 'border-box'
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
  const [technicians, setTechnicians] = useState([]);
  const [technicianFilters, setTechnicianFilters] = useState({});
  const [techColorMap, setTechColorMap] = useState({});
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        setError(null);
        const response = await axios.get(`${API_URL}/admin/calendar-tickets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const formattedEvents = response.data.map(eventData => ({
          id: eventData.id,
          title: eventData.title,
          clientName: eventData.clientName,
          ticketTitle: eventData.ticketTitle,
          start: dayjs(eventData.start).toDate(),
          end: dayjs(eventData.start).add(1, 'hour').toDate(),
          resource: eventData.resource,
          description: eventData.description,
          technicianId: eventData.technicianId
        }));
        setEvents(formattedEvents);
      } catch (err) {
        console.error('Error fetching calendar events:', err);
        setError('Failed to load calendar events. ' + (err.response?.data?.message || err.message));
      }
    };

    const fetchTechniciansAndMapColors = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/admins`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const techUsers = response.data.filter(admin => admin.role === 'technician');
        setTechnicians(techUsers);

        const colorMap = {};
        const initialFilters = { all: true, unassigned: false };
        techUsers.forEach((tech, index) => {
          colorMap[tech._id] = technicianColors[index % technicianColors.length];
          initialFilters[tech._id] = false;
        });
        setTechColorMap(colorMap);
        setTechnicianFilters(initialFilters);
      } catch (error) {
        console.error('Error fetching technicians:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      setLoading(true);
      fetchCalendarEvents().then(fetchTechniciansAndMapColors);
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleSelectEvent = (event) => {
    if (event.id) {
      navigate(`/admin/tickets/${event.id}`);
    }
  };

  const handleTechnicianCheckboxChange = (event) => {
    const { name, checked } = event.target;

    setTechnicianFilters(prevFilters => {
      let newFilters = { ...prevFilters };

      if (name === 'all') {
        Object.keys(newFilters).forEach(key => {
          newFilters[key] = false;
        });
        newFilters.all = true;
      } else {
        newFilters.all = false;
        newFilters[name] = checked;

        const anySpecificFilterChecked = Object.keys(newFilters).some(key => key !== 'all' && newFilters[key]);

        if (!anySpecificFilterChecked) {
          newFilters.all = true;
        }
      }
      return newFilters;
    });
  };

  const eventStyleGetter = useCallback((event, start, end, isSelected) => {
    const backgroundColor = techColorMap[event.technicianId] || defaultColor;
    const style = {
      backgroundColor,
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      width: '100%',
      height: '100%'
    };
    return {
      style: style
    };
  }, [techColorMap]);

  const filteredEvents = events.filter(event => {
    if (technicianFilters.all) {
      return true;
    }
    if (technicianFilters.unassigned && !event.technicianId) {
      return true;
    }
    if (event.technicianId && technicianFilters[event.technicianId]) {
      return true;
    }
    return false;
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {calendarGlobalStyles}
      <Box sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ mb: 2, px: 1, borderBottom: 1, borderColor: 'divider', pb:1 }}>
           <Typography variant="overline">Filter by Technician:</Typography>
           <FormGroup sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
              <FormControlLabel
                 control={
                   <Checkbox
                     checked={technicianFilters.all || false}
                     onChange={handleTechnicianCheckboxChange}
                     name="all"
                     size="small"
                   />
                 }
                 label="All"
                 sx={{ mr: 2 }}
              />
              <FormControlLabel
                 control={
                   <Checkbox
                     checked={technicianFilters.unassigned || false}
                     onChange={handleTechnicianCheckboxChange}
                     name="unassigned"
                     size="small"
                     icon={<RadioButtonUncheckedIcon sx={{ color: defaultColor }} />}
                     checkedIcon={<RadioButtonCheckedIcon sx={{ color: defaultColor }} />}
                   />
                 }
                 label="Unassigned"
                 sx={{ mr: 2, color: defaultColor }}
              />
              {technicians.map((tech) => {
                  const techColor = techColorMap[tech._id] || defaultColor;
                  return (
                      <FormControlLabel
                         key={tech._id}
                         control={
                           <Checkbox
                             checked={technicianFilters[tech._id] || false}
                             onChange={handleTechnicianCheckboxChange}
                             name={tech._id}
                             size="small"
                             icon={<RadioButtonUncheckedIcon sx={{ color: techColor }} />}
                             checkedIcon={<RadioButtonCheckedIcon sx={{ color: techColor }} />}
                           />
                         }
                         label={`${tech.firstName} ${tech.lastName}`}
                         sx={{ mr: 2, color: techColor }}
                       />
                  );
              })}
           </FormGroup>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ height: '80vh' }} className="rbc-calendar">
          {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
               <CircularProgress />
             </Box>
          ) : (
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              tooltipAccessor={(event) => `${event.clientName} - ${event.ticketTitle}\n${event.description}`}
              views={['month', 'week', 'day']}
              eventPropGetter={eventStyleGetter}
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
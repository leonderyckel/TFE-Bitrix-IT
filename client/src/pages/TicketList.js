import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  useTheme,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UpdateIcon from '@mui/icons-material/Update';
import { fetchTickets, updateTicketInList } from '../store/slices/ticketSlice';
import io from 'socket.io-client';
import API_URL from '../config/api';

// Socket instance (outside component)
let socket;

const TicketList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myTickets, companyTickets, loading, error } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const socketRef = useRef();
  const joinedRoomsRef = useRef(new Set()); // Keep track of joined rooms

  useEffect(() => {
    // Initial fetch
    dispatch(fetchTickets());

    // --- Socket.IO Connection ---
    const serverBaseUrl = API_URL.substring(0, API_URL.indexOf('/api')) || API_URL;
    socketRef.current = io(serverBaseUrl);
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[TicketList] Socket connected:', socket.id);
      // Initial room join logic will be handled by the next effect
    });

    socket.on('disconnect', () => {
      console.log('[TicketList] Socket disconnected');
      joinedRoomsRef.current.clear(); // Clear joined rooms on disconnect
    });

    // Listen for updates
    socket.on('ticket:updated', (updatedTicket) => {
      console.log('[TicketList] Received ticket:updated', updatedTicket);
      // Dispatch action to update the ticket in the Redux store lists
      dispatch(updateTicketInList(updatedTicket)); 
    });

    // Cleanup
    return () => {
      console.log('[TicketList] Disconnecting socket...');
      socket.disconnect();
      joinedRoomsRef.current.clear();
    };
    // Run only on mount/unmount
  }, [dispatch]); 

  // --- Effect to Manage Room Subscriptions based on tickets --- 
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return; // Ensure socket is connected

    // Combine all visible ticket IDs
    const currentTicketIds = new Set([
      ...(myTickets || []).map(t => t._id),
      ...(companyTickets || []).map(t => t._id)
    ]);
    const previouslyJoined = joinedRoomsRef.current;

    // Leave rooms for tickets no longer visible
    previouslyJoined.forEach(ticketId => {
      if (!currentTicketIds.has(ticketId)) {
        socket.emit('leaveTicketRoom', ticketId); // NOTE: Need backend handler for leaveTicketRoom
        console.log(`[TicketList] Emitted leaveTicketRoom for ${ticketId}`);
        previouslyJoined.delete(ticketId);
      }
    });

    // Join rooms for new tickets
    currentTicketIds.forEach(ticketId => {
      if (!previouslyJoined.has(ticketId)) {
        socket.emit('joinTicketRoom', ticketId);
        console.log(`[TicketList] Emitted joinTicketRoom for ${ticketId}`);
        previouslyJoined.add(ticketId);
      }
    });

    // Update the ref with the current set
    joinedRoomsRef.current = previouslyJoined; 

  // Re-run whenever the ticket lists change
  }, [myTickets, companyTickets]); 

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'in-progress':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // eslint-disable-next-line no-unused-vars
  const progressSteps = ['Logged', 'Assigned', 'In Progress', 'Completed'];

  // Fonction pour obtenir les étapes de progression terminées
  const getCompletedSteps = (ticket) => {
    if (!ticket || !ticket.progress || !ticket.progress.length) {
      return ['Logged'];
    }
    
    // Récupérer les étapes complétées (en ordre d'ajout)
    const completedSteps = ticket.progress.map(p => {
      const statusMap = {
        'logged': 'Logged',
        'assigned': 'Assigned',
        'quote-sent': 'Quote Sent',
        'hardware-ordered': 'Hardware Ordered',
        'scheduled': 'Scheduled', 
        'closed': 'Closed'
      };
      return statusMap[p.status] || p.status;
    });
    
    // Ne pas ajouter "In Progress" si le ticket est fermé
    const isCompleted = ticket.status === 'closed';
    
    // Ajouter "In Progress" uniquement si le ticket n'est pas completé
    return isCompleted ? completedSteps : [...completedSteps, 'In Progress'];
  };

  // Fonction pour obtenir l'index de l'étape active
  const getActiveStepIndex = (ticket) => {
    if (!ticket || !ticket.progress || !ticket.progress.length) {
      return 0;
    }
    
    // Si le ticket est terminé, l'étape active est la dernière étape
    if (ticket.status === 'resolved' || ticket.status === 'closed' || 
        (ticket.progress.length > 0 && ticket.progress[ticket.progress.length - 1].status === 'completed')) {
      return getCompletedSteps(ticket).length - 1;
    }
    
    // Sinon, l'étape active est "In Progress" (dernière étape dans le tableau)
    return getCompletedSteps(ticket).length - 1;
  };

  // Helper to render a ticket row (to avoid repetition)
  const renderTicketRow = (ticket) => (
    <TableRow 
      key={ticket._id} 
      hover
      onClick={() => navigate(`/tickets/${ticket._id}`)} // Make row clickable
      sx={{ 
        '&:hover': { 
          backgroundColor: theme.palette.action.hover, 
          cursor: 'pointer'
        },
        '& > * ': { // Apply padding to all cells in the row
           padding: '12px 16px' // Adjust padding as needed
         }
      }}
    >
      <TableCell>{ticket._id.substring(0, 8)}</TableCell>
      <TableCell sx={{ fontWeight: 'medium' }}>{ticket.title}</TableCell>
      <TableCell>
        <Chip
          label={ticket.status}
          color={getStatusColor(ticket.status)}
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      </TableCell>
      <TableCell>
        <Chip
          label={ticket.priority}
          color={getPriorityColor(ticket.priority)}
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      </TableCell>
      <TableCell>{ticket.category}</TableCell>
      <TableCell>
        {new Date(ticket.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell sx={{ verticalAlign: 'top' }}>
        <Box sx={{ width: '100%', minWidth: 200 }}>
          <Stepper 
            activeStep={getActiveStepIndex(ticket)} 
            alternativeLabel 
            size="small"
            sx={{
              '& .MuiStepConnector-root': {
                '& .MuiStepConnector-line': {
                  borderColor: 'primary.main',
                  borderTopWidth: '2px'
                },
                '&.Mui-active .MuiStepConnector-line': {
                  borderColor: 'primary.main'
                },
                '&.Mui-completed .MuiStepConnector-line': {
                  borderColor: 'primary.main'
                }
              }
            }}
          >
            {getCompletedSteps(ticket).map((label, index) => {
              const isInProgress = label === 'In Progress';
              const isClosed = label === 'Closed';
              
              let textColor = {};
              if (isInProgress) {
                textColor = { color: 'warning.main', fontWeight: 'bold' };
              } else if (isClosed) {
                textColor = { color: 'success.main', fontWeight: 'bold' };
              }
              
              return (
                <Step 
                  key={index} 
                  completed={index < getActiveStepIndex(ticket)}
                  sx={{
                    '& .MuiStepIcon-root': {
                      color: isClosed ? 'success.main' : (isInProgress ? 'warning.main' : 'primary.main'),
                      '&.Mui-completed': {
                        color: 'primary.main'
                      },
                      '&.Mui-active': {
                        color: isClosed ? 'success.main' : 'warning.main'
                      },
                      '& text': {
                        fill: 'transparent' // Hide the numbers inside the circle
                      }
                    }
                  }}
                >
                  <StepLabel 
                    sx={{
                      '& .MuiStepLabel-label': textColor
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>
      </TableCell>
      <TableCell>
        <Button
          startIcon={<UpdateIcon />}
          size="small"
          variant="outlined"
          color="primary"
          onClick={() => navigate(`/tickets/${ticket._id}`)}
          sx={{
            borderRadius: '20px',
            '&:hover': {
              backgroundColor: theme.palette.primary.light,
              color: 'white'
            }
          }}
        >
          Details
        </Button>
      </TableCell>
    </TableRow>
  );

  // Helper to render the company ticket row (with creator)
  const renderCompanyTicketRow = (ticket) => (
    <TableRow 
      key={ticket._id} 
      hover
      onClick={() => navigate(`/tickets/${ticket._id}`)} // Make row clickable
      sx={{ 
        '&:hover': { 
          backgroundColor: theme.palette.action.hover, 
          cursor: 'pointer'
        },
         '& > * ': { padding: '12px 16px' }
      }}
    >
      <TableCell>{ticket._id.substring(0, 8)}</TableCell>
      <TableCell sx={{ fontWeight: 'medium' }}>{ticket.title}</TableCell>
      <TableCell>{ticket.client ? `${ticket.client.firstName} ${ticket.client.lastName}` : 'N/A'}</TableCell>
      <TableCell>
        <Chip label={ticket.status} color={getStatusColor(ticket.status)} size="small" sx={{ fontWeight: 'bold' }} />
      </TableCell>
      <TableCell>
        <Chip label={ticket.priority} color={getPriorityColor(ticket.priority)} size="small" sx={{ fontWeight: 'bold' }} />
      </TableCell>
      <TableCell>{ticket.category}</TableCell>
      <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
      <TableCell align="right">
        <Button
          startIcon={<UpdateIcon />}
          size="small"
          variant="outlined"
          color="primary"
          onClick={() => navigate(`/tickets/${ticket._id}`)}
          sx={{
            borderRadius: '20px',
            '&:hover': {
              backgroundColor: theme.palette.primary.light,
              color: 'white'
            }
          }}
        >
          Details
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ position: 'relative', pb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        backgroundColor: theme.palette.primary.main,
        borderRadius: '8px',
        color: 'white',
        p: 2
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', pl: 1 }}>
          Your Tickets
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/tickets/new')}
          sx={{ 
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            fontWeight: 'bold',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
            },
            transition: 'all 0.2s ease'
          }}
        >
          New Ticket
        </Button>
      </Box>
      
      <Card elevation={3}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: theme.palette.grey[100] }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '8%' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Creation Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '22%', minWidth: 200 }}>Progress</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%', textAlign: 'right' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : myTickets && myTickets.length > 0 ? (
                  myTickets.map(renderTicketRow)
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      You have no tickets.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* --- Company Tickets Section --- */}
      {companyTickets && companyTickets.length > 0 && (
        <Box sx={{ mt: 4 }}> {/* Add margin top */}
          {/* Apply blue banner style to the title */}
          <Box sx={{
            // Copy styles from the "Your Tickets" header box
            display: 'flex',
            justifyContent: 'space-between', // Keep or remove if no button on the right
            alignItems: 'center',
            mb: 3, // Add margin bottom like the first header
            backgroundColor: theme.palette.primary.main,
            borderRadius: '8px',
            color: 'white',
            p: 2
          }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', pl: 1 }}>
              Company Tickets
            </Typography>
            {/* Add any buttons here if needed */}
          </Box>
          
          <Card elevation={3}>
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: theme.palette.grey[100] }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '8%' }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '22%' }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Created By</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Creation Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '10%', textAlign: 'right' }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companyTickets.map(renderCompanyTicketRow)}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>Error loading tickets: {error}</Typography>
      )}
    </Box>
  );
};

export default TicketList; 
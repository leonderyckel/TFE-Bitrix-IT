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
  CircularProgress,
  useMediaQuery,
  IconButton,
  Collapse,
  Stack,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UpdateIcon from '@mui/icons-material/Update';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSnackbar } from 'notistack';
import { fetchTickets, updateTicketInList, addNewTicketToList } from '../store/slices/ticketSlice';
import { addNotification } from '../store/slices/notificationSlice';
import io from 'socket.io-client';
import API_URL from '../config/api';
import WS_URL from '../config/ws';
import { useSocket } from '../components/SocketContext';

// Socket instance (outside component)
let socket;

const TicketList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myTickets, companyTickets, loading, error } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const socketRef = useRef();
  const joinedRoomsRef = useRef(new Set());
  const { enqueueSnackbar } = useSnackbar();
  const { socket, isReady } = useSocket();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expandedTicket, setExpandedTicket] = useState(null);

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  useEffect(() => {
    if (!socket || !isReady) {
      console.log('[TicketList] Socket not ready yet, skipping event listeners setup');
      return;
    }

    console.log('[TicketList] Setting up socket event listeners');

    socket.on('connect', () => {
      console.log('[TicketList] Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('[TicketList] Socket disconnected');
      joinedRoomsRef.current.clear();
    });

    const handleTicketUpdated = (payload) => {
      const updatedTicket = payload;
      const notificationText = payload.notificationText || `Ticket ${updatedTicket.title || 'untitled'} updated`;
      console.log('[TicketList] Received ticket:updated', updatedTicket);
      console.log('[TicketList] Notification text received:', notificationText);
      dispatch(updateTicketInList(updatedTicket));
      enqueueSnackbar(notificationText, {
        variant: 'info',
        action: (key) => (
          <Button 
            size="small" 
            onClick={() => {
              navigate(`/tickets/${updatedTicket._id}`);
            }}
            sx={{ color: 'white' }}
          >
            Voir
          </Button>
        ),
      });
      dispatch(addNotification({
        text: notificationText,
        ticketId: updatedTicket._id
      }));
    };

    const handleNewTicketCreated = (payload) => {
      const newTicket = payload;
      console.log('[TicketList] Received newTicketCreated', newTicket);
      
      // Check if this ticket is for the current user
      if (newTicket.client && newTicket.client._id === user?.id) {
        const notificationText = `Nouveau ticket créé: ${newTicket.title}`;
        
        // Add the new ticket to the list directly without refreshing
        dispatch(addNewTicketToList(newTicket));
        
        // Show notification
        enqueueSnackbar(notificationText, {
          variant: 'success',
          action: (key) => (
            <Button 
              size="small" 
              onClick={() => {
                navigate(`/tickets/${newTicket._id}`);
              }}
              sx={{ color: 'white' }}
            >
              Voir
            </Button>
          ),
        });
        
        // Add to notification store
        dispatch(addNotification({
          text: notificationText,
          ticketId: newTicket._id
        }));
      }
    };

    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('newTicketCreated', handleNewTicketCreated);

    console.log('[TicketList] Socket event listeners set up successfully');

    return () => {
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('newTicketCreated', handleNewTicketCreated);
      console.log('[TicketList] Socket event listeners cleaned up');
    };
  }, [dispatch, enqueueSnackbar, navigate, socket, isReady, user?.id]);

  useEffect(() => {
    if (!socket || !isReady) return;

    // Combine all visible ticket IDs
    const currentTicketIds = new Set([
      ...(myTickets || []).map(t => t._id),
      ...(companyTickets || []).map(t => t._id)
    ]);
    const previouslyJoined = joinedRoomsRef.current;

    // Leave rooms for tickets no longer visible
    previouslyJoined.forEach(ticketId => {
      if (!currentTicketIds.has(ticketId)) {
        socket.emit('leaveTicketRoom', ticketId);
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

    joinedRoomsRef.current = previouslyJoined;
  }, [myTickets, companyTickets, socket, isReady]);

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

  // Mobile ticket card component
  const renderMobileTicketCard = (ticket) => (
    <Card 
      key={ticket._id} 
      sx={{ 
        mb: 2, 
        boxShadow: 2,
        '&:hover': { boxShadow: 4 },
        borderLeft: `4px solid ${theme.palette[getPriorityColor(ticket.priority)].main}`,
        cursor: 'pointer'
      }}
      onClick={() => navigate(`/tickets/${ticket._id}`)}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'primary.main' }}>
              Ticket #{ticket._id.substring(0, 8).toUpperCase()}
            </Typography>
            <Chip 
              label={ticket.status} 
              color={getStatusColor(ticket.status)} 
              size="small"
              sx={{ mt: 1, fontWeight: 'bold' }}
            />
          </Box>
          <Chip 
            label={ticket.priority} 
            color={getPriorityColor(ticket.priority)} 
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, fontSize: '1rem' }}>
          {ticket.title}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Chip 
            label={ticket.category} 
            variant="outlined" 
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
          <Typography variant="caption" color="text.secondary">
            {new Date(ticket.createdAt).toLocaleDateString('en-US')}
          </Typography>
        </Box>
        
        {/* Progress for mobile */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
            Progress: {getActiveStepIndex(ticket) + 1}/{getCompletedSteps(ticket).length} steps
          </Typography>
          <Box sx={{ 
            height: 8, 
            backgroundColor: 'grey.300', 
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <Box sx={{ 
              height: '100%', 
              backgroundColor: ticket.status === 'closed' ? 'success.main' : 'primary.main',
              width: `${((getActiveStepIndex(ticket) + 1) / getCompletedSteps(ticket).length) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Current status: {getCompletedSteps(ticket)[getActiveStepIndex(ticket)]}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            variant="contained" 
            size="small"
            sx={{ minHeight: '36px', px: 3 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tickets/${ticket._id}`);
            }}
          >
            View Details
          </Button>
          <IconButton
            aria-label="toggle description"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedTicket(expandedTicket === ticket._id ? null : ticket._id);
            }}
            size="small"
            sx={{ 
              transform: expandedTicket === ticket._id ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
        
        <Collapse in={expandedTicket === ticket._id}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
            <strong>Description:</strong><br />
            {ticket.description}
          </Typography>
        </Collapse>
      </CardContent>
    </Card>
  );

  // Mobile company ticket card component
  const renderMobileCompanyTicketCard = (ticket) => (
    <Card 
      key={ticket._id} 
      sx={{ 
        mb: 2, 
        boxShadow: 2,
        '&:hover': { boxShadow: 4 },
        borderLeft: `4px solid ${theme.palette[getPriorityColor(ticket.priority)].main}`,
        cursor: 'pointer'
      }}
      onClick={() => navigate(`/tickets/${ticket._id}`)}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'primary.main' }}>
              Ticket #{ticket._id.substring(0, 8).toUpperCase()}
            </Typography>
            <Chip 
              label={ticket.status} 
              color={getStatusColor(ticket.status)} 
              size="small"
              sx={{ mt: 1, fontWeight: 'bold' }}
            />
          </Box>
          <Chip 
            label={ticket.priority} 
            color={getPriorityColor(ticket.priority)} 
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500, fontSize: '1rem' }}>
          {ticket.title}
        </Typography>
        
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', fontStyle: 'italic' }}>
          Created by: {ticket.client ? `${ticket.client.firstName} ${ticket.client.lastName}` : 'N/A'}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Chip 
            label={ticket.category} 
            variant="outlined" 
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
          <Typography variant="caption" color="text.secondary">
            {new Date(ticket.createdAt).toLocaleDateString('en-US')}
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          size="small"
          fullWidth
          sx={{ minHeight: '36px' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/tickets/${ticket._id}`);
          }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
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
        p: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', pl: { xs: 0, sm: 1 } }}>
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
            transition: 'all 0.2s ease',
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          New Ticket
        </Button>
      </Box>
      
      {/* Mobile View */}
      {isMobile ? (
        <Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : myTickets && myTickets.length > 0 ? (
            myTickets.map(renderMobileTicketCard)
          ) : (
            <Card sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="body1" color="text.secondary">
                You have no tickets.
              </Typography>
            </Card>
          )}
        </Box>
      ) : (
        /* Desktop Table View */
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
      )}

      {/* --- Company Tickets Section --- */}
      {companyTickets && companyTickets.length > 0 && (
        <Box sx={{ mt: 4 }}>
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
              Company Tickets
            </Typography>
          </Box>
          
          {/* Mobile View for Company Tickets */}
          {isMobile ? (
            <Box>
              {companyTickets.map(renderMobileCompanyTicketCard)}
            </Box>
          ) : (
            /* Desktop Table View for Company Tickets */
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
          )}
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>Error loading tickets: {error}</Typography>
      )}
    </Box>
  );
};

export default TicketList; 
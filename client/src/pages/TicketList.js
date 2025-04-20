import React, { useEffect } from 'react';
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
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UpdateIcon from '@mui/icons-material/Update';
import { fetchTickets } from '../store/slices/ticketSlice';

const TicketList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tickets, loading } = useSelector((state) => state.tickets);
  // eslint-disable-next-line no-unused-vars
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

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
        'rescheduled': 'Rescheduled',
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
                  <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '8%' }}>Creation Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '29%', minWidth: 260 }}>Progress</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '10%', textAlign: 'right' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : tickets && tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <TableRow 
                      key={ticket._id} 
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: theme.palette.action.hover 
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
                      <TableCell>
                        <Box sx={{ width: '100%', maxWidth: 250 }}>
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No tickets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TicketList; 
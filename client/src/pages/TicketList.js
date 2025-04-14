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
  StepLabel
} from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';
import { fetchTickets } from '../store/slices/ticketSlice';

const TicketList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tickets, loading } = useSelector((state) => state.tickets);
  // eslint-disable-next-line no-unused-vars
  const { user } = useSelector((state) => state.auth);

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
    <Box>
      <Typography variant="h4" gutterBottom>
        Vos tickets
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Titre</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Priorité</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Date de création</TableCell>
              <TableCell>Progression</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : tickets && tickets.length > 0 ? (
              tickets.map((ticket) => (
                <TableRow key={ticket._id}>
                  <TableCell>{ticket._id.substring(0, 8)}</TableCell>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status}
                      color={getStatusColor(ticket.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.priority}
                      color={getPriorityColor(ticket.priority)}
                      size="small"
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
                              borderColor: 'warning.main',
                              borderTopWidth: '2px'
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
                      onClick={() => navigate(`/tickets/${ticket._id}`)}
                    >
                      Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Aucun ticket trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box mt={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/tickets/new')}
        >
          New Ticket
        </Button>
      </Box>
    </Box>
  );
};

export default TicketList; 
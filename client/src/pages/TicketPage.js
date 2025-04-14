import React, { useEffect, useState } from 'react';
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
  TextField,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { fetchTickets, createTicket } from '../store/slices/ticketSlice';
import UpdateIcon from '@mui/icons-material/Update';

const TicketPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tickets, loading, error: ticketError } = useSelector((state) => state.tickets);
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketErrorState, setTicketErrorState] = useState(null);

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  const handleCreateTicket = async () => {
    if (!newTicketDescription.trim()) return;

    setIsSubmitting(true);
    setTicketErrorState(null);

    try {
      await dispatch(
        createTicket({ description: newTicketDescription, title: newTicketDescription.split('\n')[0] || 'New Ticket', category: 'other', priority: 'medium' })
      ).unwrap();
      setNewTicketDescription('');
      setTimeout(() => {
        dispatch(fetchTickets());
      }, 500);
    } catch (error) {
      setTicketErrorState(`Failed to create ticket: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'in-progress':
      case 'assigned':
      case 'diagnosing':
        return 'warning';
      case 'waiting-client':
        return 'info';
      case 'resolved':
      case 'closed':
        return 'success';
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

  const ongoingTickets = tickets.filter(ticket => ticket.status !== 'closed' && ticket.status !== 'resolved');

  // Fonction pour obtenir les étapes de progression terminées plus une étape "In Progress" si nécessaire
  const getCompletedSteps = (ticket) => {
    if (!ticket || !ticket.progress || !ticket.progress.length) {
      return ['Logged'];
    }
    
    // Récupérer les étapes complétées (en ordre d'ajout)
    const completedSteps = ticket.progress.map(p => {
      const statusMap = {
        'logged': 'Logged',
        'assigned': 'Assigned',
        'in-progress': 'In Progress',
        'waiting-client': 'Waiting Client',
        'diagnosing': 'Diagnosing',
        'quote-sent': 'Quote Sent',
        'hardware-ordered': 'Hardware Ordered',
        'scheduled': 'Scheduled', 
        'rescheduled': 'Rescheduled',
        'resolved': 'Resolved',
        'completed': 'Completed',
        'closed': 'Closed'
      };
      return statusMap[p.status] || p.status;
    });
    
    // Ne pas ajouter "In Progress" si le ticket est résolu ou fermé ou si la dernière étape est "Completed"
    const isCompleted = ticket.status === 'resolved' || 
                       ticket.status === 'closed' || 
                       (ticket.progress.length > 0 && ticket.progress[ticket.progress.length - 1].status === 'completed');
    
    // Ajouter "In Progress" uniquement si le ticket n'est pas complété
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

  // Fonction pour obtenir la dernière mise à jour du ticket
  const getLastProgressUpdate = (ticket) => {
    if (!ticket.progress || ticket.progress.length === 0) {
      return 'No updates yet';
    }
    
    const latestUpdate = ticket.progress[ticket.progress.length - 1];
    return `${new Date(latestUpdate.date).toLocaleString()} - ${latestUpdate.description}`;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1">
          Support Tickets
        </Typography>
      </Box>

      {/* Formulaire de création de ticket */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Create a New Ticket
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          What is your issue? How can we help you today?
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Describe your problem here..."
          value={newTicketDescription}
          onChange={(e) => setNewTicketDescription(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateTicket}
          disabled={isSubmitting || !newTicketDescription.trim()}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Submit Ticket'}
        </Button>
        {ticketErrorState && (
          <Typography color="error" sx={{ mt: 1 }}>Error creating ticket: {ticketErrorState}</Typography>
        )}
      </Paper>

      {/* Liste des tickets en cours */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Active Tickets
        </Typography>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : ongoingTickets.length > 0 ? (
                ongoingTickets.map((ticket) => (
                  <TableRow key={ticket._id}>
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
                      <Button
                        size="small"
                        onClick={() => navigate(`/tickets/${ticket._id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No active tickets found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

const getProgressPercentage = (ticket) => {
  const statusIndex = {
    'open': 0,
    'assigned': 25,
    'in-progress': 50,
    'waiting-client': 60,
    'diagnosing': 70,
    'resolved': 90,
    'closed': 100
  };
  
  if (ticket.progress && ticket.progress.length > 0) {
    const latestStatus = ticket.progress[ticket.progress.length - 1].status;
    return statusIndex[latestStatus] || statusIndex[ticket.status] || 0;
  }
  
  return statusIndex[ticket.status] || 0;
};

const getProgressStatusText = (ticket) => {
  const statusText = {
    'open': 'Ouvert',
    'assigned': 'Assigné',
    'in-progress': 'En cours',
    'waiting-client': 'En attente client',
    'diagnosing': 'Diagnostic en cours',
    'resolved': 'Résolu',
    'closed': 'Clôturé'
  };
  
  if (ticket.progress && ticket.progress.length > 0) {
    const latestStatus = ticket.progress[ticket.progress.length - 1].status;
    return statusText[latestStatus] || statusText[ticket.status] || 'Status inconnu';
  }
  
  return statusText[ticket.status] || 'Status inconnu';
};

export default TicketPage; 
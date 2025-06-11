import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Dialog
} from '@mui/material';
import axios from 'axios';
import API_URL from '../config/api';

const AdminBilling = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState('');
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    const fetchClosedTickets = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/admin/billing/closed-tickets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTickets(res.data);
      } catch (err) {
        setError('Erreur lors du chargement des tickets clôturés.');
      } finally {
        setLoading(false);
      }
    };
    fetchClosedTickets();
  }, []);

  const handleShowInvoice = async (ticketId) => {
    setLoadingInvoice(true);
    setShowInvoice(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/admin/invoice/preview/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoiceHtml(res.data.html || res.data); // selon la structure de la réponse
    } catch (err) {
      setInvoiceHtml('<div style="padding:40px;color:red;">Erreur lors du chargement de la facture.</div>');
    } finally {
      setLoadingInvoice(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Billing
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Closing Date</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket._id}>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>{ticket.client ? `${ticket.client.firstName} ${ticket.client.lastName}` : 'N/A'}</TableCell>
                  <TableCell>{ticket.client?.company || 'N/A'}</TableCell>
                  <TableCell>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleShowInvoice(ticket._id)}
                    >
                      Invoice
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog
        open={showInvoice}
        onClose={() => setShowInvoice(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          style: {
            background: '#e5e5e5',
            minHeight: '100vh',
            boxShadow: 'none'
          }
        }}
      >
        {loadingInvoice ? (
          <div style={{ padding: 40, textAlign: 'center' }}><CircularProgress /></div>
        ) : (
          <div
            style={{ minHeight: 600, background: 'none' }}
            dangerouslySetInnerHTML={{ __html: invoiceHtml }}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default AdminBilling; 
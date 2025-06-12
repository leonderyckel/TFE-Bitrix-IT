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
  const [invoiceData, setInvoiceData] = useState(null);

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
      if (res.data && typeof res.data === 'object' && res.data.html && res.data.data) {
        setInvoiceHtml(res.data.html);
        setInvoiceData(res.data.data);
      } else {
        setInvoiceHtml(res.data.html || res.data);
        setInvoiceData(null);
      }
    } catch (err) {
      setInvoiceHtml('<div style="padding:40px;color:red;">Erreur lors du chargement de la facture.</div>');
      setInvoiceData(null);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!invoiceData) {
      alert('Impossible de sauvegarder : données facture manquantes.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/admin/invoice`, invoiceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Facture enregistrée avec succès !');
    } catch (err) {
      alert('Erreur lors de l\'enregistrement de la facture.');
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
            width: '100vw',
            boxShadow: 'none',
            margin: 0,
            padding: 0
          }
        }}
      >
        {loadingInvoice ? (
          <div style={{ padding: 40, textAlign: 'center' }}><CircularProgress /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 600, background: 'none' }}>
            <div
              style={{ width: '100%' }}
              dangerouslySetInnerHTML={{ __html: invoiceHtml }}
            />
            <Button
              variant="contained"
              color="success"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleSaveInvoice}
            >
              Enregistrer
            </Button>
          </div>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminBilling; 
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
import html2pdf from 'html2pdf.js';

const AdminBillingHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState('');
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/admin/invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoices(res.data);
      } catch (err) {
        setError('Erreur lors du chargement des factures.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const handleShowInvoice = async (invoiceId) => {
    setLoadingInvoice(true);
    setShowInvoice(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/admin/invoice/html/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoiceHtml(res.data.html || res.data);
    } catch (err) {
      setInvoiceHtml('<div style="padding:40px;color:red;">Erreur lors du chargement de la facture.</div>');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/admin/invoice/html/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const html = res.data.html || res.data;
      const a4 = document.createElement('div');
      a4.innerHTML = html;
      // Attendre que le logo soit chargé
      const img = a4.querySelector('img.logo-img');
      if (img && !img.complete) {
        await new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }
      html2pdf().from(a4).set({
        margin: 0,
        filename: 'invoice.pdf',
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
    } catch (err) {
      alert('Erreur lors du chargement de la facture.');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Billing History
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
                <TableCell>Number</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.clientName || 'N/A'}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleShowInvoice(invoice._id)}
                      sx={{ mr: 1 }}
                    >
                      Voir
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={() => handleDownloadInvoice(invoice._id)}
                    >
                      Télécharger
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={showInvoice} onClose={() => setShowInvoice(false)} maxWidth="lg" fullWidth
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
          <div
            style={{ minHeight: 600, background: '#e5e5e5' }}
            dangerouslySetInnerHTML={{ __html: invoiceHtml }}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default AdminBillingHistory; 
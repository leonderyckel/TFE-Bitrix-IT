import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress } from '@mui/material';
import axios from 'axios';
import API_URL from '../config/api';
import html2pdf from 'html2pdf.js';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const ClientBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState('');
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [paidInput, setPaidInput] = useState('');
  const [paidError, setPaidError] = useState('');
  const [paidDialogOpen, setPaidDialogOpen] = useState(false);
  const [paidDialogInvoice, setPaidDialogInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/billing/invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoices(res.data);
      } catch (err) {
        setError('Error loading invoices.');
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
      const res = await axios.get(`${API_URL}/invoice/html/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoiceHtml(res.data.html || res.data);
    } catch (err) {
      setInvoiceHtml('<div style="padding:40px;color:red;">Error loading invoice.</div>');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const convertImageToBase64 = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/invoice/html/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const html = res.data.html || res.data;
      const a4 = document.createElement('div');
      a4.innerHTML = html;
      // Convertir l'image en base64 avant la génération du PDF
      const img = a4.querySelector('.logo-img');
      if (img) {
        const base64Image = await convertImageToBase64(img.src);
        img.src = base64Image;
      }
      html2pdf().from(a4).set({
        margin: 0,
        filename: 'invoice.pdf',
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
    } catch (err) {
      alert('Erreur lors de la génération du PDF.');
    }
  };

  const handlePaidClick = (invoiceId) => {
    const invoice = invoices.find(inv => inv._id === invoiceId);
    setPaidDialogInvoice(invoice);
    setPaidDialogOpen(true);
  };

  const handleMarkAsPaid = async () => {
    if (!paidDialogInvoice) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/invoice/mark-paid/${paidDialogInvoice._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaidDialogOpen(false);
      setInvoices(invoices.map(inv => inv._id === paidDialogInvoice._id ? { ...inv, paid: true } : inv));
    } catch (err) {
      alert('Error updating invoice status.');
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
      ) : invoices.length === 0 ? (
        <Typography>No invoices found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Number</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.totalDue || invoice.amount || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => { handleShowInvoice(invoice._id); setSelectedInvoiceId(invoice._id); }}
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={() => handleDownloadInvoice(invoice._id)}
                      sx={{ mr: 1 }}
                    >
                      Download
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      disabled={invoice.paid}
                      onClick={() => handlePaidClick(invoice._id)}
                    >
                      PAY
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
          <div style={{ minHeight: 600, background: '#e5e5e5' }}>
            <div dangerouslySetInnerHTML={{ __html: invoiceHtml }} />
            <Box sx={{ mt: 3, p: 2, background: '#fff', borderRadius: 2, boxShadow: 1 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Payment Information</Typography>
              <Typography variant="body2">Beneficiary: Bitrix IT</Typography>
              <Typography variant="body2">BANK: StandardBank Tyger Manor</Typography>
              <Typography variant="body2">BRANCH CODE: 050410</Typography>
              <Typography variant="body2">ACCOUNT NUMBER: 401823768</Typography>
              {!invoices.find(inv => inv._id === selectedInvoiceId)?.paid && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ mb: 1 }}>To mark the invoice as paid, type paid below:</Typography>
                  <TextField
                    value={paidInput}
                    onChange={e => { setPaidInput(e.target.value); setPaidError(''); }}
                    error={!!paidError}
                    helperText={paidError}
                    size="small"
                    label="Confirmation"
                  />
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ mt: 2, ml: 2 }}
                    onClick={handleMarkAsPaid}
                  >
                    Confirm
                  </Button>
                </Box>
              )}
              {invoices.find(inv => inv._id === selectedInvoiceId)?.paid && (
                <Typography color="success.main" sx={{ mt: 1 }}>Invoice marked as paid</Typography>
              )}
            </Box>
          </div>
        )}
      </Dialog>
      <Dialog open={paidDialogOpen} onClose={() => setPaidDialogOpen(false)} maxWidth="xs" fullWidth>
        <Box sx={{ p: 4, background: '#fff', borderRadius: 2, position: 'relative' }}>
          <IconButton
            aria-label="close"
            onClick={() => setPaidDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" sx={{ mb: 2 }}>Payment Information</Typography>
          <Typography variant="body2">Beneficiary: Bitrix IT</Typography>
          <Typography variant="body2">BANK: StandardBank Tyger Manor</Typography>
          <Typography variant="body2">BRANCH CODE: 050410</Typography>
          <Typography variant="body2">ACCOUNT NUMBER: 401823768</Typography>
          {paidDialogInvoice && (
            <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
              Amount to pay: {paidDialogInvoice.totalDue || paidDialogInvoice.amount || '-'}
            </Typography>
          )}
          {!paidDialogInvoice?.paid && (
            <Button
              variant="contained"
              color="success"
              sx={{ mt: 4, ml: 0 }}
              onClick={handleMarkAsPaid}
              fullWidth
            >
              Confirm
            </Button>
          )}
          {paidDialogInvoice?.paid && (
            <Typography color="success.main" sx={{ mt: 2 }}>Invoice marked as paid</Typography>
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

export default ClientBilling; 
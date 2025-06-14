import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress } from '@mui/material';
import axios from 'axios';
import API_URL from '../config/api';
import html2pdf from 'html2pdf.js';
import Dialog from '@mui/material/Dialog';

const ClientBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState('');
  const [loadingInvoice, setLoadingInvoice] = useState(false);

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
      setInvoiceHtml('<div style="padding:40px;color:red;">Erreur lors du chargement de la facture.</div>');
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

export default ClientBilling; 
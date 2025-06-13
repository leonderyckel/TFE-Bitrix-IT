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
  Dialog,
  TextField
} from '@mui/material';
import axios from 'axios';
import API_URL from '../config/api';
import html2pdf from 'html2pdf.js';
import CloseIcon from '@mui/icons-material/Close';

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

  const convertImageToBase64 = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
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

  const handleDownloadInvoice = async () => {
    try {
      let a4 = document.querySelector('#invoice-a4');
      let element;
      if (a4) {
        element = a4;
      } else {
        element = document.createElement('div');
        element.innerHTML = invoiceHtml;
      }

      // Convertir l'image en base64 avant la génération du PDF
      const img = element.querySelector('.logo-img');
      if (img) {
        const base64Image = await convertImageToBase64(img.src);
        img.src = base64Image;
      }

      html2pdf().from(element).set({
        margin: 0,
        filename: 'invoice.pdf',
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
    } catch (err) {
      console.error('Erreur lors de la génération du PDF:', err);
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
        maxWidth={false}
        fullWidth
        PaperProps={{
          style: {
            background: '#f5f5f5',
            minHeight: '100vh',
            height: '100vh',
            width: '100vw',
            maxWidth: '100vw',
            maxHeight: '100vh',
            boxShadow: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            borderRadius: 0,
            position: 'relative',
          }
        }}
      >
        {/* Bouton Close en haut à gauche */}
        <Button
          onClick={() => setShowInvoice(false)}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            minWidth: 0,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: 1,
            p: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': { background: '#f0f0f0' },
            mb: 3
          }}
        >
          <CloseIcon />
        </Button>
        {loadingInvoice ? (
          <div style={{ padding: 40, textAlign: 'center' }}><CircularProgress /></div>
        ) : invoiceData ? (
          <Box sx={{
            p: 0,
            background: '#f5f5f5',
            minHeight: '100vh',
            height: '100vh',
            width: '100vw',
            maxWidth: '100vw',
            maxHeight: '100vh',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            gap: 0,
            boxShadow: 'none',
            borderRadius: 0,
            m: 0
          }}>
            {/* Formulaire à gauche */}
            <Box sx={{
              width: { xs: '100%', md: '50%' },
              minWidth: 320,
              maxWidth: { md: '50%' },
              background: '#f7f7f7',
              p: 6,
              borderRight: { md: '1px solid #e0e0e0' },
              height: '100%',
              boxSizing: 'border-box',
              overflowY: 'auto',
              maxHeight: '100vh',
            }}>
              <form style={{ width: '100%' }} onSubmit={e => { e.preventDefault(); handleSaveInvoice(); }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', pt: 2 }}>Edit Invoice</Typography>
                <TextField fullWidth label="Client Name" value={invoiceData.clientName || ''} onChange={e => setInvoiceData({ ...invoiceData, clientName: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Client Address" value={invoiceData.clientAddress || ''} onChange={e => setInvoiceData({ ...invoiceData, clientAddress: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Customer VAT No" value={invoiceData.clientVAT || ''} onChange={e => setInvoiceData({ ...invoiceData, clientVAT: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Invoice Number" value={invoiceData.invoiceNumber || ''} onChange={e => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Date" value={invoiceData.date || ''} onChange={e => setInvoiceData({ ...invoiceData, date: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Due Date" value={invoiceData.dueDate || ''} onChange={e => setInvoiceData({ ...invoiceData, dueDate: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Reference" value={invoiceData.reference || ''} onChange={e => setInvoiceData({ ...invoiceData, reference: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Sales Rep" value={invoiceData.salesRep || ''} onChange={e => setInvoiceData({ ...invoiceData, salesRep: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Discount (%)" value={invoiceData.discount || ''} onChange={e => setInvoiceData({ ...invoiceData, discount: e.target.value })} sx={{ mb: 2 }} />
                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Items</Typography>
                {invoiceData.items && invoiceData.items.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <TextField label="Description" value={item.description || ''} onChange={e => { const items = [...invoiceData.items]; items[idx].description = e.target.value; setInvoiceData({ ...invoiceData, items }); }} sx={{ flex: 2 }} />
                    <TextField label="Sub Description" value={item.subDescription || ''} onChange={e => { const items = [...invoiceData.items]; items[idx].subDescription = e.target.value; setInvoiceData({ ...invoiceData, items }); }} sx={{ flex: 2 }} />
                    <TextField label="Quantity" type="number" value={item.quantity || ''} onChange={e => { const items = [...invoiceData.items]; items[idx].quantity = e.target.value; setInvoiceData({ ...invoiceData, items }); }} sx={{ width: 100 }} />
                    <TextField label="Unit Price" type="number" value={item.unitPrice || ''} onChange={e => { const items = [...invoiceData.items]; items[idx].unitPrice = e.target.value; setInvoiceData({ ...invoiceData, items }); }} sx={{ width: 120 }} />
                    <TextField label="Total" type="number" value={item.total || ''} onChange={e => { const items = [...invoiceData.items]; items[idx].total = e.target.value; setInvoiceData({ ...invoiceData, items }); }} sx={{ width: 120 }} />
                  </Box>
                ))}
                <TextField fullWidth label="Total Discount" value={invoiceData.totalDiscount || ''} onChange={e => setInvoiceData({ ...invoiceData, totalDiscount: e.target.value })} sx={{ mb: 2, mt: 2 }} />
                <TextField fullWidth label="Total Exclusive" value={invoiceData.totalExclusive || ''} onChange={e => setInvoiceData({ ...invoiceData, totalExclusive: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Total VAT" value={invoiceData.totalVAT || ''} onChange={e => setInvoiceData({ ...invoiceData, totalVAT: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Sub Total" value={invoiceData.subTotal || ''} onChange={e => setInvoiceData({ ...invoiceData, subTotal: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Total Due" value={invoiceData.totalDue || ''} onChange={e => setInvoiceData({ ...invoiceData, totalDue: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Notes" value={Array.isArray(invoiceData.notes) ? invoiceData.notes.join('\n') : invoiceData.notes || ''} multiline minRows={2} onChange={e => setInvoiceData({ ...invoiceData, notes: e.target.value.split('\n') })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Bank Details" value={invoiceData.bankDetails || ''} onChange={e => setInvoiceData({ ...invoiceData, bankDetails: e.target.value })} sx={{ mb: 2 }} />
                <Button variant="contained" color="success" sx={{ mt: 3, mb: 2, width: 160, fontWeight: 'bold', fontSize: 18 }} type="submit">Save</Button>
              </form>
            </Box>
            {/* Aperçu à droite */}
            <Box sx={{
              width: { xs: '100%', md: '50%' },
              minWidth: 320,
              maxWidth: { md: '50%' },
              p: 6,
              background: '#fff',
              overflowY: 'auto',
              maxHeight: '100vh',
              boxSizing: 'border-box',
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '900px',
                  minWidth: 320,
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                  borderRadius: 8,
                  padding: 0,
                  margin: '0 auto',
                  overflowX: 'auto',
                  display: 'block',
                }}
                dangerouslySetInnerHTML={{ __html: invoiceHtml }}
              />
            </Box>
          </Box>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>Erreur lors du chargement de la facture.</div>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminBilling; 
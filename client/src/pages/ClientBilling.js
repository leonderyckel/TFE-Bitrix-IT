import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress, Card, CardContent, Chip, Stack, useMediaQuery, useTheme, Tabs, Tab } from '@mui/material';
import axios from 'axios';
import API_URL from '../config/api';
import html2pdf from 'html2pdf.js';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const ClientBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [documentHtml, setDocumentHtml] = useState('');
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [paidInput, setPaidInput] = useState('');
  const [paidError, setPaidError] = useState('');
  const [paidDialogOpen, setPaidDialogOpen] = useState(false);
  const [paidDialogInvoice, setPaidDialogInvoice] = useState(null);
  const [paidDialogQuote, setPaidDialogQuote] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Récupérer les factures et les devis en parallèle
        const [invoicesRes, quotesRes] = await Promise.all([
          axios.get(`${API_URL}/billing/invoices`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/billing/quotes`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setInvoices(invoicesRes.data);
        setQuotes(quotesRes.data);
      } catch (err) {
        setError('Error loading billing data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleShowDocument = async (documentId, documentType) => {
    setLoadingDocument(true);
    setShowDocument(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = documentType === 'invoice' ? 
        `/invoice/html/${documentId}` : 
        `/quote/html/${documentId}`;
      
      const res = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocumentHtml(res.data.html || res.data);
    } catch (err) {
      setDocumentHtml(`<div style="padding:40px;color:red;">Error loading ${documentType}.</div>`);
    } finally {
      setLoadingDocument(false);
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

  const handleDownloadDocument = async (documentId, documentType) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = documentType === 'invoice' ? 
        `/invoice/html/${documentId}` : 
        `/quote/html/${documentId}`;
      
      const res = await axios.get(`${API_URL}${endpoint}`, {
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
      
      const filename = documentType === 'invoice' ? 'invoice.pdf' : 'quote.pdf';
      html2pdf().from(a4).set({
        margin: 0,
        filename: filename,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
    } catch (err) {
      console.error(`Erreur lors de la génération du PDF ${documentType}:`, err);
    }
  };

  const handlePaidClick = (invoiceId) => {
    const invoice = invoices.find(inv => inv._id === invoiceId);
    setPaidDialogInvoice(invoice);
    setPaidDialogQuote(null);
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
      console.error('Error updating invoice status:', err);
    }
  };

  const handleAcceptAndPayQuote = (quoteId) => {
    const quote = quotes.find(q => q._id === quoteId);
    setPaidDialogQuote(quote);
    setPaidDialogInvoice(null);
    setPaidDialogOpen(true);
  };

  const handleMarkQuoteAsPaid = async () => {
    if (!paidDialogQuote) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/quote/mark-accepted-paid/${paidDialogQuote._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaidDialogOpen(false);
      setQuotes(quotes.map(quote => quote._id === paidDialogQuote._id ? { ...quote, accepted: true, paid: true } : quote));
    } catch (err) {
      console.error('Error updating quote status:', err);
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/quote/mark-accepted/${quoteId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuotes(quotes.map(quote => quote._id === quoteId ? { ...quote, accepted: true } : quote));
    } catch (err) {
      console.error('Error updating quote status:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Mobile invoice card component
  const renderMobileCard = (document, documentType) => (
    <Card 
      key={document._id} 
      sx={{ 
        mb: 2, 
        boxShadow: 2,
        '&:hover': { boxShadow: 4 }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'primary.main' }}>
              {documentType === 'invoice' ? document.invoiceNumber : document.quoteNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {document.date}
            </Typography>
          </Box>
          {documentType === 'invoice' ? (
            document.paid ? (
              <Chip 
                label="PAID" 
                color="success" 
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            ) : document.accepted ? (
              <Chip 
                label="ACCEPTED" 
                color="info" 
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            ) : (
              <Chip 
                label="PENDING" 
                color="warning" 
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )
          ) : (
            document.paid ? (
              <Chip 
                label="PAID" 
                color="success" 
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            ) : document.accepted ? (
              <Chip 
                label="ACCEPTED" 
                color="info" 
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            ) : (
              <Chip 
                label="PENDING" 
                color="warning" 
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )
          )}
        </Box>
        
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Amount: R{document.totalDue || document.amount || '-'}
        </Typography>
        
        <Stack spacing={1}>
          <Button 
            variant="contained" 
            color="primary"
            size="small"
            fullWidth
            onClick={() => { 
              handleShowDocument(document._id, documentType); 
              setSelectedDocumentId(document._id); 
            }}
            sx={{ minHeight: '40px' }}
          >
            View {documentType === 'invoice' ? 'Invoice' : 'Quote'}
          </Button>
          <Button 
            variant="outlined" 
            color="secondary"
            size="small"
            fullWidth
            onClick={() => handleDownloadDocument(document._id, documentType)}
            sx={{ minHeight: '40px' }}
          >
            Download PDF
          </Button>
          {documentType === 'invoice' ? (
            !document.paid && (
              <Button 
                variant="contained" 
                color="success"
                size="small"
                fullWidth
                onClick={() => handlePaidClick(document._id)}
                sx={{ minHeight: '40px', fontWeight: 'bold' }}
              >
                PAY
              </Button>
            )
          ) : (
            !document.accepted && !document.paid && (
              <Button 
                variant="contained" 
                color="success"
                size="small"
                fullWidth
                onClick={() => handleAcceptAndPayQuote(document._id)}
                sx={{ minHeight: '40px', fontWeight: 'bold' }}
              >
                ACCEPT & PAY
              </Button>
            )
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderTable = (data, documentType) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Number</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((document) => (
            <TableRow key={document._id}>
              <TableCell>
                {documentType === 'invoice' ? document.invoiceNumber : document.quoteNumber}
              </TableCell>
              <TableCell>{document.date}</TableCell>
              <TableCell>R{document.totalDue || document.amount || '-'}</TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => { 
                    handleShowDocument(document._id, documentType); 
                    setSelectedDocumentId(document._id); 
                  }}
                  sx={{ mr: 1 }}
                >
                  View
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={() => handleDownloadDocument(document._id, documentType)}
                  sx={{ mr: 1 }}
                >
                  Download
                </Button>
                {documentType === 'invoice' ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    disabled={document.paid}
                    onClick={() => handlePaidClick(document._id)}
                  >
                    PAY
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    disabled={document.accepted || document.paid}
                    onClick={() => handleAcceptAndPayQuote(document._id)}
                  >
                    ACCEPT & PAY
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Billing
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : invoices.length === 0 && quotes.length === 0 ? (
        <Card sx={{ textAlign: 'center', p: 3 }}>
          <Typography>No invoices or quotes found.</Typography>
        </Card>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={currentTab} onChange={handleTabChange}>
              <Tab label={`Invoices (${invoices.length})`} />
              <Tab label={`Quotes (${quotes.length})`} />
            </Tabs>
          </Box>
          
          {/* Mobile View */}
          {isMobile ? (
            <Box>
              {currentTab === 0 && invoices.map(invoice => renderMobileCard(invoice, 'invoice'))}
              {currentTab === 1 && quotes.map(quote => renderMobileCard(quote, 'quote'))}
            </Box>
          ) : (
            /* Desktop Table View */
            <>
              {currentTab === 0 && renderTable(invoices, 'invoice')}
              {currentTab === 1 && renderTable(quotes, 'quote')}
            </>
          )}
        </>
      )}
      
      <Dialog open={showDocument} onClose={() => setShowDocument(false)} maxWidth="lg" fullWidth
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
        {loadingDocument ? (
          <div style={{ padding: 40, textAlign: 'center' }}><CircularProgress /></div>
        ) : (
          <div style={{ minHeight: 600, background: '#e5e5e5' }}>
            <div dangerouslySetInnerHTML={{ __html: documentHtml }} />
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
          {(paidDialogInvoice || paidDialogQuote) && (
            <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
              Amount to pay: R{(paidDialogInvoice?.totalDue || paidDialogInvoice?.amount || paidDialogQuote?.totalDue || paidDialogQuote?.amount) || '-'}
            </Typography>
          )}
          {paidDialogInvoice && !paidDialogInvoice?.paid && (
            <Button
              variant="contained"
              color="success"
              sx={{ mt: 4, ml: 0 }}
              onClick={handleMarkAsPaid}
              fullWidth
            >
              Confirm Payment
            </Button>
          )}
          {paidDialogQuote && !paidDialogQuote?.accepted && (
            <Button
              variant="contained"
              color="success"
              sx={{ mt: 4, ml: 0 }}
              onClick={handleMarkQuoteAsPaid}
              fullWidth
            >
              Confirm Payment & Accept Quote
            </Button>
          )}
          {paidDialogInvoice?.paid && (
            <Typography color="success.main" sx={{ mt: 2 }}>Invoice marked as paid</Typography>
          )}
          {paidDialogQuote?.accepted && (
            <Typography color="success.main" sx={{ mt: 2 }}>Quote accepted and marked as paid</Typography>
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

export default ClientBilling; 
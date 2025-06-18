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
  Tabs,
  Tab
} from '@mui/material';
import axios from 'axios';
import API_URL from '../config/api';
import html2pdf from 'html2pdf.js';

const AdminBillingHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDocument, setShowDocument] = useState(false);
  const [documentHtml, setDocumentHtml] = useState('');
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Récupérer les factures et les devis en parallèle
        const [invoicesRes, quotesRes] = await Promise.all([
          axios.get(`${API_URL}/admin/invoices`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/admin/quotes`, {
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
        `/admin/invoice/html/${documentId}` : 
        `/admin/quote/html/${documentId}`;
      
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

  const handleDownloadDocument = async (documentId, documentType) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = documentType === 'invoice' ? 
        `/admin/invoice/html/${documentId}` : 
        `/admin/quote/html/${documentId}`;
      
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

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const renderTable = (data, documentType) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Number</TableCell>
            <TableCell>Client</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>{documentType === 'invoice' ? 'Payment' : 'Status'}</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((document) => (
            <TableRow key={document._id}>
              <TableCell>
                {documentType === 'invoice' ? document.invoiceNumber : document.quoteNumber}
              </TableCell>
              <TableCell>{document.clientName || 'N/A'}</TableCell>
              <TableCell>{document.date}</TableCell>
              <TableCell>
                {documentType === 'invoice' ? (
                  document.paid ? (
                    <span style={{ color: 'green', fontWeight: 600 }}>Paid</span>
                  ) : (
                    <span style={{ color: 'red', fontWeight: 600 }}>Not paid</span>
                  )
                ) : (
                  document.accepted ? (
                    <span style={{ color: 'green', fontWeight: 600 }}>Accepted</span>
                  ) : (
                    <span style={{ color: 'orange', fontWeight: 600 }}>Pending</span>
                  )
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => handleShowDocument(document._id, documentType)}
                  sx={{ mr: 1 }}
                >
                  View
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={() => handleDownloadDocument(document._id, documentType)}
                >
                  Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

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
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={currentTab} onChange={handleTabChange}>
              <Tab label={`Invoices (${invoices.length})`} />
              <Tab label={`Quotes (${quotes.length})`} />
            </Tabs>
          </Box>
          
          {currentTab === 0 && renderTable(invoices, 'invoice')}
          {currentTab === 1 && renderTable(quotes, 'quote')}
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
          <div
            style={{ minHeight: 600, background: '#e5e5e5' }}
            dangerouslySetInnerHTML={{ __html: documentHtml }}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default AdminBillingHistory; 
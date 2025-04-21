import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Link as MuiLink, Button
} from '@mui/material';
import axios from 'axios';
import API_URL from '../config/api';
import { useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

function AdminClientList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/admin/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClients(response.data);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load client list. ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchClients();
    }
  }, [token]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Client List
          </Typography>
           <Button
            variant="outlined"
            onClick={() => navigate('/admin')} // Navigate back to dashboard
          >
            Back to Dashboard
          </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table sx={{ minWidth: 650 }} aria-label="client list table">
            <TableHead sx={{ backgroundColor: 'grey.200' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                {/* Add more columns if needed, e.g., Company */}
                {/* <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell> */}
                 <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell> {/* Optional Actions */}
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow
                    key={client._id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {client.firstName} {client.lastName}
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    {/* <TableCell>{client.company || 'N/A'}</TableCell> */}
                     <TableCell>
                       {/* Example Action: Link to client details (if such a page exists) */}
                       {/* <Button
                         size="small"
                         variant="outlined"
                         component={RouterLink}
                         to={`/admin/clients/${client._id}`} // Adjust path if needed
                       >
                         View Details
                       </Button> */}
                     </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center"> {/* Adjust colSpan if adding columns */}
                    No clients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default AdminClientList; 
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Divider,
    TextField,
    List,
    ListItem,
    ListItemText,
    IconButton,
    CircularProgress,
    // Alert, // Alert n'est plus utilisé directement, on utilise snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import axios from 'axios';
import { useSnackbar } from 'notistack';
import API_URL from '../config/api';

const AdminCompanyPasswords = () => {
    const { companyName } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const decodedCompanyName = decodeURIComponent(companyName || '');

    const [passwords, setPasswords] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPassword, setNewPassword] = useState({ title: '', username: '', password: '' });
    const [loading, setLoading] = useState(true);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [visiblePasswordId, setVisiblePasswordId] = useState(null);

    const getToken = () => localStorage.getItem('token');

    const fetchPasswords = useCallback(async () => {
        if (!decodedCompanyName) return;
        setLoading(true);
        try {
            const token = getToken();
            const { data } = await axios.get(`${API_URL}/admin/companies/${encodeURIComponent(decodedCompanyName)}/credentials`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPasswords(data || []);
            // enqueueSnackbar('Passwords loaded.', { variant: 'success' }); // Peut-être un peu verbeux pour un chargement initial réussi
        } catch (error) {
            console.error('Error fetching passwords:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to fetch passwords.', { variant: 'error' });
            setPasswords([]);
        } finally {
            setLoading(false);
        }
    }, [decodedCompanyName, enqueueSnackbar]);

    useEffect(() => {
        fetchPasswords();
    }, [fetchPasswords]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setNewPassword(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPassword = async () => {
        if (!newPassword.title || !newPassword.username || !newPassword.password) {
            enqueueSnackbar('Please fill in all fields: Title, Username, and Password.', { variant: 'warning' });
            return;
        }
        setFormSubmitting(true);
        try {
            const token = getToken();
            const payload = {
                service: newPassword.title, // 'title' du frontend correspond à 'service' du backend
                username: newPassword.username,
                password: newPassword.password,
            };
            const { data: addedCredential } = await axios.post(
                `${API_URL}/admin/companies/${encodeURIComponent(decodedCompanyName)}/credentials`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPasswords(prev => [...prev, addedCredential]);
            setNewPassword({ title: '', username: '', password: '' });
            setShowAddForm(false);
            enqueueSnackbar('Password added successfully!', { variant: 'success' });
        } catch (error) {
            console.error('Error adding password:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to add password.', { variant: 'error' });
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDeletePassword = async (credentialId) => {
        // Vous pourriez ajouter une confirmation ici (par exemple, avec un Dialog MUI)
        // const confirmDelete = window.confirm("Are you sure you want to delete this password?");
        // if (!confirmDelete) return;

        try {
            const token = getToken();
            await axios.delete(
                `${API_URL}/admin/companies/${encodeURIComponent(decodedCompanyName)}/credentials/${credentialId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPasswords(prev => prev.filter(p => p._id !== credentialId));
            enqueueSnackbar('Password deleted successfully.', { variant: 'success' });
        } catch (error) {
            console.error('Error deleting password:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to delete password.', { variant: 'error' });
        }
    };

    const togglePasswordVisibility = (id) => {
        setVisiblePasswordId(prev => (prev === id ? null : id));
    };

    const copyToClipboard = (text, type = "Password") => {
        if (!text) {
            enqueueSnackbar(`${type} is empty, nothing to copy.`, { variant: 'warning' });
            return;
        }
        navigator.clipboard.writeText(text)
            .then(() => enqueueSnackbar(`${type} copied to clipboard!`, { variant: 'info' }))
            .catch(err => {
                console.error(`Failed to copy ${type}: `, err);
                enqueueSnackbar(`Failed to copy ${type} to clipboard.`, { variant: 'error' });
            });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: { xs: 2, md: 0 }  }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/companies')}
                        sx={{ mr: 2 }}
                    >
                        Back to Company List
                    </Button>
                    <VpnKeyIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h4" component="h1">
                        Passwords: {decodedCompanyName}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => setShowAddForm(true)}
                    disabled={loading || formSubmitting}
                >
                    Add New Password
                </Button>
            </Box>

            {showAddForm && (
                <Paper elevation={3} sx={{ p: {xs: 2, sm: 3}, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Add New Password</Typography>
                    <TextField
                        label="Title (e.g., Router, Main Server)"
                        name="title"
                        value={newPassword.title}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        disabled={formSubmitting}
                    />
                    <TextField
                        label="Username"
                        name="username"
                        value={newPassword.username}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        disabled={formSubmitting}
                    />
                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        value={newPassword.password}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        disabled={formSubmitting}
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={() => setShowAddForm(false)} sx={{ mr: 1 }} disabled={formSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleAddPassword} disabled={formSubmitting}>
                            {formSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Password'}
                        </Button>
                    </Box>
                </Paper>
            )}

            <Paper elevation={3} sx={{ p: {xs: 1, sm: 2, md: 3} }}>
                <Typography variant="h6" gutterBottom sx={{px: {xs: 1, sm: 0}}}>
                    Stored Passwords ({passwords.length})
                </Typography>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : passwords.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 3, p: 2 }}>
                        No passwords stored yet for this company. Click "Add New Password" to get started.
                    </Typography>
                ) : (
                    <List disablePadding>
                        {passwords.map((p) => (
                            <React.Fragment key={p._id}>
                                <ListItem
                                    sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        flexWrap: 'wrap',
                                        py: 1.5,
                                        px: {xs: 1, sm: 2} 
                                    }}
                                >
                                    <ListItemText
                                        primary={p.service || "(No Title)"}
                                        secondary={
                                            <Box component="span" sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography component="span" variant="body2" sx={{ minWidth: '80px', fontWeight: 'medium', color: 'text.secondary' }}>
                                                        User:
                                                    </Typography>
                                                    <Typography component="span" variant="body2" sx={{ mr: 1, wordBreak: 'break-all' }}>
                                                        {p.username || "(empty)"}
                                                    </Typography>
                                                    <IconButton onClick={() => copyToClipboard(p.username, "Username")} size="small" aria-label="copy username" sx={{p:0.5}}>
                                                        <ContentCopyIcon fontSize="inherit" />
                                                    </IconButton>
                                                </Box>
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                                      <Typography component="span" variant="body2" sx={{ minWidth: '80px', fontWeight: 'medium', color: 'text.secondary' }}>
                                                        Pass:
                                                    </Typography>
                                                    <Typography component="span" variant="body2" sx={{ mr: 1, wordBreak: 'break-all' }}>
                                                        {visiblePasswordId === p._id ? (p.password || "(empty)") : '••••••••'}
                                                    </Typography>
                                                    <IconButton onClick={() => copyToClipboard(p.password, "Password")} size="small" aria-label="copy password" sx={{p:0.5}}>
                                                        <ContentCopyIcon fontSize="inherit" />
                                                    </IconButton>
                                                    <IconButton onClick={() => togglePasswordVisibility(p._id)} size="small" aria-label="toggle password visibility" sx={{p:0.5}}>
                                                        {visiblePasswordId === p._id ? <VisibilityOff fontSize="inherit" /> : <Visibility fontSize="inherit" />}
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        }
                                        sx={{ wordBreak: 'break-word', mr: 1, flexGrow: 1, mb: {xs: 1, sm: 0} }}
                                    />
                                     <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, mt: { xs: 1, md: 0 } }}>
                                        <IconButton 
                                            aria-label="delete" 
                                            onClick={() => handleDeletePassword(p._id)} 
                                            size="small" 
                                            color="error"
                                            sx={{p:0.5}}
                                        >
                                            <DeleteIcon fontSize="inherit" />
                                        </IconButton>
                                    </Box>
                                </ListItem>
                                <Divider component="li" />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>
        </Container>
    );
};

export default AdminCompanyPasswords; 
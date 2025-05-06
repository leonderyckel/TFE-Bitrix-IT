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
    Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import NotesIcon from '@mui/icons-material/Notes';

import axios from 'axios';
import { useSnackbar } from 'notistack';
import API_URL from '../config/api';

const AdminCompanyRemoteAccess = () => {
    const { companyName } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const decodedCompanyName = decodeURIComponent(companyName || '');

    const [remoteAccesses, setRemoteAccesses] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newRemoteAccess, setNewRemoteAccess] = useState({ title: '', identifier: '', password: '', notes: '' });
    const [loading, setLoading] = useState(true);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [visibleDetails, setVisibleDetails] = useState({}); // Store visibility state for id and password of each item

    const getToken = () => localStorage.getItem('token');

    const fetchRemoteAccesses = useCallback(async () => {
        if (!decodedCompanyName) return;
        setLoading(true);
        try {
            const token = getToken();
            const { data } = await axios.get(`${API_URL}/admin/companies/${encodeURIComponent(decodedCompanyName)}/remote-access`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRemoteAccesses(data || []);
        } catch (error) {
            console.error('Error fetching remote accesses:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to fetch remote access configurations.', { variant: 'error' });
            setRemoteAccesses([]);
        } finally {
            setLoading(false);
        }
    }, [decodedCompanyName, enqueueSnackbar]);

    useEffect(() => {
        fetchRemoteAccesses();
    }, [fetchRemoteAccesses]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setNewRemoteAccess(prev => ({ ...prev, [name]: value }));
    };

    const handleAddRemoteAccess = async () => {
        if (!newRemoteAccess.title || !newRemoteAccess.identifier) {
            enqueueSnackbar('Please fill in Title and Identifier.', { variant: 'warning' });
            return;
        }
        setFormSubmitting(true);
        try {
            const token = getToken();
            const payload = { ...newRemoteAccess };
            const { data: addedAccess } = await axios.post(
                `${API_URL}/admin/companies/${encodeURIComponent(decodedCompanyName)}/remote-access`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRemoteAccesses(prev => [...prev, addedAccess]);
            setNewRemoteAccess({ title: '', identifier: '', password: '', notes: '' });
            setShowAddForm(false);
            enqueueSnackbar('Remote access configuration added successfully!', { variant: 'success' });
        } catch (error) {
            console.error('Error adding remote access configuration:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to add remote access configuration.', { variant: 'error' });
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDeleteRemoteAccess = async (accessId) => {
        try {
            const token = getToken();
            await axios.delete(
                `${API_URL}/admin/companies/${encodeURIComponent(decodedCompanyName)}/remote-access/${accessId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRemoteAccesses(prev => prev.filter(ra => ra._id !== accessId));
            enqueueSnackbar('Remote access configuration deleted successfully.', { variant: 'success' });
        } catch (error) {
            console.error('Error deleting remote access configuration:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to delete remote access configuration.', { variant: 'error' });
        }
    };

    const toggleDetailVisibility = (id, field) => { // field can be 'identifier' or 'password'
        setVisibleDetails(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: !prev[id]?.[field] // Toggle specific field visibility
            }
        }));
    };

    const copyToClipboard = (text, type = "Text") => {
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
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: { xs: 2, md: 0 } }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/companies')} sx={{ mr: 2 }}>
                        Back to Company List
                    </Button>
                    <SettingsRemoteIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h4" component="h1">Remote Access: {decodedCompanyName}</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => setShowAddForm(true)} disabled={loading || formSubmitting}>
                    Add New Configuration
                </Button>
            </Box>

            {showAddForm && (
                <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Add New Remote Access</Typography>
                    <TextField label="Title (e.g., TeamViewer PC, VPN Office)" name="title" value={newRemoteAccess.title} onChange={handleInputChange} fullWidth margin="normal" disabled={formSubmitting} />
                    <TextField label="Identifier (e.g., ID, Username, IP)" name="identifier" value={newRemoteAccess.identifier} onChange={handleInputChange} fullWidth margin="normal" disabled={formSubmitting} />
                    <TextField label="Password (Optional)" name="password" type="password" value={newRemoteAccess.password} onChange={handleInputChange} fullWidth margin="normal" disabled={formSubmitting} />
                    <TextField label="Notes (Optional)" name="notes" value={newRemoteAccess.notes} onChange={handleInputChange} fullWidth margin="normal" multiline rows={3} disabled={formSubmitting} />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={() => setShowAddForm(false)} sx={{ mr: 1 }} disabled={formSubmitting}>Cancel</Button>
                        <Button variant="contained" onClick={handleAddRemoteAccess} disabled={formSubmitting}>
                            {formSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Configuration'}
                        </Button>
                    </Box>
                </Paper>
            )}

            <Paper elevation={3} sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ px: { xs: 1, sm: 0 } }}>Stored Configurations ({remoteAccesses.length})</Typography>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
                ) : remoteAccesses.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 3, p: 2 }}>No remote access configurations stored yet.</Typography>
                ) : (
                    <List disablePadding>
                        {remoteAccesses.map((ra) => (
                            <React.Fragment key={ra._id}>
                                <ListItem sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', py: 1.5, px: { xs: 1, sm: 2 } }}>
                                    <ListItemText
                                        primary={ra.title || "(No Title)"}
                                        secondaryTypographyProps={{ component: 'div' }} // Permet aux éléments de Box d'être rendus correctement
                                        secondary={
                                            <Box sx={{ mt: 0.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <Typography component="span" variant="body2" sx={{ minWidth: '80px', fontWeight: 'medium', color: 'text.secondary' }}>ID:</Typography>
                                                    <Typography component="span" variant="body2" sx={{ mr: 1, wordBreak: 'break-all' }}>
                                                        {visibleDetails[ra._id]?.identifier ? (ra.identifier || "(empty)") : '••••••••'}
                                                    </Typography>
                                                    <IconButton onClick={() => copyToClipboard(ra.identifier, "Identifier")} size="small" aria-label="copy identifier" sx={{ p: 0.5 }}><ContentCopyIcon fontSize="inherit" /></IconButton>
                                                    <IconButton onClick={() => toggleDetailVisibility(ra._id, 'identifier')} size="small" aria-label="toggle identifier visibility" sx={{ p: 0.5 }}>
                                                        {visibleDetails[ra._id]?.identifier ? <VisibilityOff fontSize="inherit" /> : <Visibility fontSize="inherit" />}
                                                    </IconButton>
                                                </Box>
                                                {ra.password && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: ra.notes ? 0.5 : 0 }}>
                                                        <Typography component="span" variant="body2" sx={{ minWidth: '80px', fontWeight: 'medium', color: 'text.secondary' }}>Pass:</Typography>
                                                        <Typography component="span" variant="body2" sx={{ mr: 1, wordBreak: 'break-all' }}>
                                                            {visibleDetails[ra._id]?.password ? (ra.password || "(empty)") : '••••••••'}
                                                        </Typography>
                                                        <IconButton onClick={() => copyToClipboard(ra.password, "Password")} size="small" aria-label="copy password" sx={{ p: 0.5 }}><ContentCopyIcon fontSize="inherit" /></IconButton>
                                                        <IconButton onClick={() => toggleDetailVisibility(ra._id, 'password')} size="small" aria-label="toggle password visibility" sx={{ p: 0.5 }}>
                                                            {visibleDetails[ra._id]?.password ? <VisibilityOff fontSize="inherit" /> : <Visibility fontSize="inherit" />}
                                                        </IconButton>
                                                    </Box>
                                                )}
                                                {ra.notes && (
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 0.5 }}>
                                                        <NotesIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.8, mt: '3px' }}/>
                                                        <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{ra.notes}</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        }
                                        sx={{ wordBreak: 'break-word', mr: 1, flexGrow: 1, mb: { xs: 1, sm: 0 } }}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, mt: { xs: 1, md: 0 } }}>
                                        <IconButton aria-label="delete" onClick={() => handleDeleteRemoteAccess(ra._id)} size="small" color="error" sx={{ p: 0.5 }}>
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

export default AdminCompanyRemoteAccess; 
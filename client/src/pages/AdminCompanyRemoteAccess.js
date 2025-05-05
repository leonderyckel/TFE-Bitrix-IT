import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    Box, 
    Paper, 
    Button 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote'; // Icône pour accès distant

// Page dédiée à l'accès distant
const AdminCompanyRemoteAccess = () => {
    const { companyName } = useParams(); 
    const navigate = useNavigate();
    const decodedCompanyName = decodeURIComponent(companyName || '');

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={() => navigate('/admin/companies')} 
                    sx={{ mr: 2 }}
                >
                    Back to Company List
                </Button>
                <SettingsRemoteIcon sx={{ mr: 1 }} /> {/* Ajoute l'icône au titre */} 
                <Typography variant="h4" component="h1">
                    Remote Access: {decodedCompanyName}
                </Typography>
            </Box>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Remote Access Configuration
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    (Details, links, configuration for remote access (VPN, RDP, etc.) will be here.)
                </Typography>
                {/* TODO: Implémenter la logique d'affichage et de gestion de l'accès distant */}
            </Paper>

        </Container>
    );
};

export default AdminCompanyRemoteAccess; 
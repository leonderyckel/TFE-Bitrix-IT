import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    Box, 
    Paper, 
    Button, 
    Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

const AdminCompanyPasswords = () => {
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
                <Typography variant="h4" component="h1">
                    Company Details: {decodedCompanyName}
                </Typography>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Stored Passwords
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    (Password management interface will be here.)
                </Typography>
            </Paper>

        </Container>
    );
};

export default AdminCompanyPasswords; 
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    Box, 
    Paper, 
    CircularProgress, 
    Alert, 
    Button 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// import axios from 'axios'; // Pas besoin pour l'instant
// import API_URL from '../config/api'; // Pas besoin pour l'instant

const AdminCompanyDetails = () => {
    const { companyName } = useParams(); // Récupère le nom depuis l'URL
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false); // Placeholder pour futur fetch
    const [error, setError] = useState(null); // Placeholder pour futur fetch
    const [companyData, setCompanyData] = useState(null); // Placeholder pour futur fetch

    const decodedCompanyName = decodeURIComponent(companyName || '');

    // TODO: Ajouter un useEffect pour fetch les données spécifiques à la compagnie plus tard
    // useEffect(() => {
    //    const fetchCompanyDetails = async () => {
    //        setLoading(true);
    //        setError(null);
    //        try {
    //            const token = localStorage.getItem('token');
    //            const { data } = await axios.get(`${API_URL}/admin/companies/${companyName}`, {
    //                headers: { Authorization: `Bearer ${token}` }
    //            });
    //            setCompanyData(data);
    //        } catch (err) {
    //            setError('Failed to load company details.');
    //        } finally {
    //            setLoading(false);
    //        }
    //    };
    //    fetchCompanyDetails();
    // }, [companyName]);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={() => navigate('/admin/companies')} 
                    sx={{ mr: 2 }}
                >
                    Back to List
                </Button>
                <Typography variant="h4" component="h1">
                    Company Details: {decodedCompanyName}
                </Typography>
            </Box>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        IT Map / Diagram
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        (Content for IT map and diagram will be displayed here in the future.)
                    </Typography>

                    <Typography variant="h6" gutterBottom>
                        Stored Passwords
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        (Password management interface will be here.)
                    </Typography>

                    <Typography variant="h6" gutterBottom>
                        Remote Access Link
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        (Remote access details and link will be here.)
                    </Typography>
                    
                    {/* On pourrait afficher les données sensibles brutes ici si nécessaire */}
                    {/* {companyData && companyData.sensitiveData && companyData.sensitiveData.length > 0 && (
                         <Box sx={{ mt: 4 }}>
                            <Typography variant="h6">Raw Sensitive Data</Typography>
                            <pre>{JSON.stringify(companyData.sensitiveData, null, 2)}</pre>
                         </Box>
                    )} */} 
                </Paper>
            )}
        </Container>
    );
};

export default AdminCompanyDetails; 
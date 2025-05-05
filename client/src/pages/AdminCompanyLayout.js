import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    Box, 
    CircularProgress, 
    Alert, 
    Button 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';
import API_URL from '../config/api';
import { 
    Tldraw, 
    useEditor, 
    loadSnapshot // Importe la nouvelle fonction
} from '@tldraw/tldraw'; // Import tldraw
import '@tldraw/tldraw/tldraw.css'; // Import styles tldraw
import { useSnackbar } from 'notistack';

// Composant interne pour gérer l'éditeur et le bouton Save
const TldrawEditor = ({ initialSnapshot, companyName }) => {
    const editorRef = useRef(null); // Pour stocker l'instance de l'éditeur
    const { enqueueSnackbar } = useSnackbar();
    const [isSaving, setIsSaving] = useState(false);

    // Fonction pour stocker l'instance de l'éditeur une fois montée
    const handleMount = (editor) => {
        editorRef.current = editor;
        // Charge le snapshot initial s'il existe
        if (initialSnapshot) {
            try {
                // Utilise la nouvelle fonction importée
                loadSnapshot(editor.store, initialSnapshot); 
                console.log('[tldraw] Initial snapshot loaded using loadSnapshot function.');
            } catch (error) {
                console.error('[tldraw] Error loading snapshot:', error);
                enqueueSnackbar('Error loading saved layout.', { variant: 'error' });
            }
        }
    };

    // Fonction pour sauvegarder le snapshot actuel
    const handleSaveLayout = async () => {
        if (!editorRef.current) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const currentSnapshot = editorRef.current.store.getSnapshot();
            
            await axios.put(`${API_URL}/admin/companies/${encodeURIComponent(companyName)}/layout`, currentSnapshot, {
                headers: { Authorization: `Bearer ${token}` },
            });
            enqueueSnackbar('Layout saved successfully!', { variant: 'success' });
        } catch (err) {
            console.error('Error saving layout:', err);
            enqueueSnackbar(`Error saving layout: ${err.response?.data?.message || err.message}`, { variant: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <> 
            {/* Bouton Save spécifique à tldraw */} 
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                 <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveLayout}
                    disabled={isSaving}
                >
                    {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Layout'}
                </Button>
            </Box>
            {/* Conteneur tldraw avec hauteur fixe */} 
            <Box style={{ position: 'relative', height: '75vh', border: '1px solid #eee' }}>
                <Tldraw 
                    persistenceKey={`tldraw_layout_${companyName}`} // Clé unique pour état local (optionnel)
                    onMount={handleMount} 
                    userInteractionPriority="high"
                />
            </Box>
        </>
    );
}

// Composant principal de la page Layout
const AdminCompanyLayout = () => {
    const { companyName } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [initialLayoutData, setInitialLayoutData] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    // Fetch initial tldraw snapshot
    useEffect(() => {
        const fetchLayout = async () => {
            if (!companyName) return;
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`${API_URL}/admin/companies/${encodeURIComponent(companyName)}/layout`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('[Layout Page] Initial tldraw snapshot received:', data);
                setInitialLayoutData(data); // Stocke le snapshot (peut être null)
            } catch (err) {
                console.error('Error fetching layout:', err);
                // Pas d'erreur bloquante si 404, tldraw démarre vide
                if (err.response?.status !== 404) {
                    const errorMsg = `Failed to load layout: ${err.response?.data?.message || err.message}`;
                    setError(errorMsg);
                    enqueueSnackbar(errorMsg, { variant: 'error' });
                } else {
                    console.log('[Layout Page] No saved layout found (404). Starting fresh.');
                     setInitialLayoutData(null); // Assure que c'est null pour un état frais
                }
            } finally {
                setLoading(false);
            }
        };
        fetchLayout();
    }, [companyName, enqueueSnackbar]);

    const decodedCompanyName = decodeURIComponent(companyName || '');

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={() => navigate('/admin/companies')} 
                    sx={{ mr: 2 }}
                >
                    Back to Company List
                </Button>
                <Typography variant="h4" component="h1">
                    Floor Plan / Layout: {decodedCompanyName}
                </Typography>
            </Box>

            {loading && ( <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box> )}
            {error && ( <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> )}
            
            {/* Affiche tldraw une fois le chargement terminé (même si data est null) */} 
            {!loading && (
                 <TldrawEditor 
                    initialSnapshot={initialLayoutData} 
                    companyName={companyName} 
                 />
            )}
        </Container>
    );
};

export default AdminCompanyLayout; 
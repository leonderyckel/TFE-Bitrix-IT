import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    Box, 
    CircularProgress, 
    Alert, 
    Button,
    Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import API_URL from '../config/api';
import { 
    Tldraw, 
    useEditor, 
    loadSnapshot,
    createShapeId,
    DefaultToolbar,
    DefaultToolbarContent,
    TLUiOverrides,
    TLComponents,
    TLUiAssetUrlOverrides,
    TldrawUiMenuItem,
    useTools,
    useIsToolSelected
} from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useSnackbar } from 'notistack';
import { PrinterTool } from '../components/tldrawTools/PrinterTool';
import { ServerTool } from '../components/tldrawTools/ServerTool';
import { ComputerTool } from '../components/tldrawTools/ComputerTool';
import { DesktopTool } from '../components/tldrawTools/DesktopTool';
import { PhoneTool } from '../components/tldrawTools/PhoneTool';
import { CableTool } from '../components/tldrawTools/CableTool';

// [1] Définition des overrides pour ajouter les outils au contexte
const uiOverrides = {
	tools(editor, tools) {
		tools.printer = {
			id: 'printer',
			icon: 'printer-tool-icon', // Référence à l'icône définie dans customAssetUrls
			label: 'Printer',
			kbd: 'p',
			onSelect: () => { editor.setCurrentTool('printer') },
		};
        tools.server = {
			id: 'server',
			icon: 'server-tool-icon',
			label: 'Server',
			kbd: 's', // Attention: peut entrer en conflit avec 'select'
			onSelect: () => { editor.setCurrentTool('server') },
		};
        tools.computer = {
			id: 'computer',
			icon: 'computer-tool-icon',
			label: 'Laptop',
			kbd: 'l', // Change kbd pour éviter conflit
			onSelect: () => { editor.setCurrentTool('computer') },
		};
        tools.desktop = {
			id: 'desktop',
			icon: 'desktop-tool-icon',
			label: 'Desktop',
			kbd: 'd',
			onSelect: () => { editor.setCurrentTool('desktop') },
		};
        tools.phone = {
			id: 'phone',
			icon: 'phone-tool-icon',
			label: 'Phone',
			kbd: 'h',
			onSelect: () => { editor.setCurrentTool('phone') },
		};
        tools.cable = {
			id: 'cable',
			icon: 'cable-tool-icon',
			label: 'Cable',
			kbd: 'e',
			onSelect: () => { editor.setCurrentTool('cable') },
		};
		return tools;
	},
};

// [2] Surcharge du composant Toolbar pour ajouter les boutons
const components = {
	Toolbar: (props) => {
		const tools = useTools();
        // Crée des états pour chaque outil
		const isPrinterSelected = useIsToolSelected(tools.printer);
        const isServerSelected = useIsToolSelected(tools.server);
        const isComputerSelected = useIsToolSelected(tools.computer);
        const isDesktopSelected = useIsToolSelected(tools.desktop);
        const isPhoneSelected = useIsToolSelected(tools.phone);
        const isCableSelected = useIsToolSelected(tools.cable);
		return (
			<DefaultToolbar {...props}>
                 {/* Contenu par défaut de la toolbar */}
				<DefaultToolbarContent />
                {/* Ajoute nos boutons personnalisés après le contenu par défaut */}
				<TldrawUiMenuItem {...tools.printer} isSelected={isPrinterSelected} />
                <TldrawUiMenuItem {...tools.server} isSelected={isServerSelected} />
                <TldrawUiMenuItem {...tools.computer} isSelected={isComputerSelected} />
                <TldrawUiMenuItem {...tools.desktop} isSelected={isDesktopSelected} />
                <TldrawUiMenuItem {...tools.phone} isSelected={isPhoneSelected} />
                <TldrawUiMenuItem {...tools.cable} isSelected={isCableSelected} />
			</DefaultToolbar>
		);
	},
    // On pourrait aussi surcharger KeyboardShortcutsDialog ici si besoin
};

// [3] URLs des icônes : Utilise des data URLs avec du SVG inline pour éviter les problèmes de CSP
const customAssetUrls = {
	icons: {
        // Icônes SVG simples en data URLs - correctement encodées
		'printer-tool-icon': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="6" y="4" width="12" height="6" rx="1"/%3E%3Crect x="6" y="14" width="12" height="6" rx="1"/%3E%3Cpath d="M6 14h12"/%3E%3Cpath d="M8 18h8"/%3E%3C/svg%3E',
        'server-tool-icon': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="2" y="3" width="20" height="4" rx="1"/%3E%3Crect x="2" y="9" width="20" height="4" rx="1"/%3E%3Crect x="2" y="15" width="20" height="4" rx="1"/%3E%3Ccircle cx="6" cy="5" r="1"/%3E%3Ccircle cx="6" cy="11" r="1"/%3E%3Ccircle cx="6" cy="17" r="1"/%3E%3C/svg%3E',
        'computer-tool-icon': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="2" y="3" width="20" height="14" rx="2"/%3E%3Cpath d="M8 21h8"/%3E%3Cpath d="M12 17v4"/%3E%3C/svg%3E',
        'desktop-tool-icon': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="2" y="3" width="20" height="14" rx="2"/%3E%3Cline x1="8" x2="16" y1="21" y2="21"/%3E%3Cline x1="12" x2="12" y1="17" y2="21"/%3E%3C/svg%3E',
        'phone-tool-icon': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="5" y="2" width="14" height="20" rx="2"/%3E%3Cpath d="M12 18h.01"/%3E%3C/svg%3E',
        'cable-tool-icon': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Cpath d="M12 2v4"/%3E%3Cpath d="M12 18v4"/%3E%3Cpath d="M4.93 4.93l2.83 2.83"/%3E%3Cpath d="M16.24 16.24l2.83 2.83"/%3E%3Cpath d="M2 12h4"/%3E%3Cpath d="M18 12h4"/%3E%3Cpath d="M4.93 19.07l2.83-2.83"/%3E%3Cpath d="M16.24 7.76l2.83-2.83"/%3E%3C/svg%3E',
	},
};

// [4] Tableau des classes d'outils personnalisés
const customTools = [PrinterTool, ServerTool, ComputerTool, DesktopTool, PhoneTool, CableTool];

// Composant interne TldrawEditor (simplifié, plus besoin de gérer onDrop/onDragOver)
const TldrawEditor = ({ initialSnapshot, companyName }) => {
    const editorRef = useRef(null);
    const { enqueueSnackbar } = useSnackbar();
    const [isSaving, setIsSaving] = useState(false);

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
        <Box sx={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
             <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
                 <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveLayout}
                    disabled={isSaving}
                >
                    {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Layout'}
                </Button>
             </Box>
             <Box style={{ position: 'relative', flexGrow: 1, border: '1px solid #eee' }}>
                <Tldraw 
                    persistenceKey={`tldraw_layout_${companyName}`}
                    onMount={handleMount} 
                    userInteractionPriority="high" 
                    tools={customTools}
                    overrides={uiOverrides}
                    components={components}
                    assetUrls={customAssetUrls}
                />
             </Box>
        </Box>
    );
}

// Composant principal de la page Layout (layout Grid retiré)
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
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px - 32px)' }}> 
            {/* Header de la page (Titre + Bouton Retour) */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexShrink: 0 }}>
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
            
            {/* Affiche directement TldrawEditor (plus de Grid ni Sidebar) */}
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
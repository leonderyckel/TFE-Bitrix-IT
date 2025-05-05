import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    Box, 
    Paper, 
    CircularProgress, 
    Alert, 
    Button,
    Divider,
    Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';
import API_URL from '../config/api';
import ReactFlow, {
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    useReactFlow,
    addEdge,
    Controls,
    Background,
    MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSnackbar } from 'notistack';

import PrinterNode from '../components/diagramNodes/PrinterNode';
import ServerNode from '../components/diagramNodes/ServerNode';
import ComputerNode from '../components/diagramNodes/ComputerNode';
import Sidebar from '../components/Sidebar';

const nodeTypes = {
    printer: PrinterNode,
    server: ServerNode,
    computer: ComputerNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

const DiagramEditor = ({ initialDiagramData, companyName }) => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialDiagramData?.nodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialDiagramData?.edges || []);
    const { project } = useReactFlow();
    const { fitView, getViewport, getNodes, getEdges } = useReactFlow();
    const { enqueueSnackbar } = useSnackbar();
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (nodes.length > 0) {
                fitView({ padding: 0.2 });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [fitView, initialDiagramData]);

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const handleSaveDiagram = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const currentFlow = {
                nodes: getNodes(),
                edges: getEdges(),
                viewport: getViewport(),
            };
            await axios.put(`${API_URL}/admin/companies/${encodeURIComponent(companyName)}/diagram`, currentFlow, {
                headers: { Authorization: `Bearer ${token}` },
            });
            enqueueSnackbar('Diagram saved successfully!', { variant: 'success' });
        } catch (err) {
            console.error('Error saving diagram:', err);
            enqueueSnackbar(`Error saving diagram: ${err.response?.data?.message || err.message}`, { variant: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const type = event.dataTransfer.getData('application/reactflow');

            if (typeof type === 'undefined' || !type || !nodeTypes[type]) {
                return;
            }

            const position = project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });
            
            const newNode = {
                id: getId(),
                type,
                position,
                data: { label: `${type} node` },
            };
            
            console.log('[Diagram] Dropped node:', newNode);
            setNodes((nds) => nds.concat(newNode));
        },
        [project, setNodes]
    );

    const decodedCompanyName = decodeURIComponent(companyName || '');

    return (
        <Grid container spacing={2} sx={{ height: '75vh' }}>
            <Grid item xs={3} md={2}>
                <Sidebar />
            </Grid>
            <Grid item xs={9} md={10} sx={{ height: '100%' }}>
                <Box ref={reactFlowWrapper} sx={{ height: '100%', border: '1px solid #eee' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px solid #eee' }}>
                        <Button 
                            size="small"
                            startIcon={<ArrowBackIcon />} 
                            onClick={() => navigate('/admin/companies')} 
                        >
                            Back to List
                        </Button>
                        <Typography variant="subtitle1">
                            IT Map / Diagram: {decodedCompanyName}
                        </Typography>
                        <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveDiagram}
                            disabled={isSaving}
                        >
                            {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
                        </Button>
                    </Box>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-gray-100"
                    >
                        <Controls />
                        <Background />
                        <MiniMap nodeStrokeWidth={3} zoomable pannable />
                    </ReactFlow>
                </Box>
            </Grid>
        </Grid>
    );
};

const AdminCompanyDetails = () => {
    const { companyName } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [initialDiagramData, setInitialDiagramData] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        const fetchDiagram = async () => {
            if (!companyName) return;
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                console.log(`Fetching diagram for ${decodeURIComponent(companyName)}...`);
                const { data } = await axios.get(`${API_URL}/admin/companies/${encodeURIComponent(companyName)}/diagram`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Diagram data received:', data);
                setInitialDiagramData(data);
            } catch (err) {
                console.error('Error fetching diagram:', err);
                const errorMsg = err.response?.status === 404 
                    ? 'No diagram saved yet for this company.' 
                    : `Failed to load diagram: ${err.response?.data?.message || err.message}`;
                setError(errorMsg);
                if(err.response?.status === 404) {
                    setInitialDiagramData({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
                }
                enqueueSnackbar(errorMsg, { variant: err.response?.status === 404 ? 'info' : 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchDiagram();
    }, [companyName, enqueueSnackbar]);

    const decodedCompanyName = decodeURIComponent(companyName || '');

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
             <Typography variant="h4" component="h1" gutterBottom>
                Company Details: {decodedCompanyName}
            </Typography>
            
            {loading && (
                 <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
            )}
            {error && error !== 'No diagram saved yet for this company.' && (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}
            
            {!loading && initialDiagramData && (
                <ReactFlowProvider>
                    <DiagramEditor 
                        initialDiagramData={initialDiagramData} 
                        companyName={companyName}
                    />
                </ReactFlowProvider>
            )}

            <Divider sx={{ my: 4 }} />

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Stored Passwords
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    (Password management interface will be here.)
                </Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Remote Access Link
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    (Remote access details and link will be here.)
                </Typography>
            </Paper>
        </Container>
    );
};

export default AdminCompanyDetails; 
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store';
import { loadUserData } from './store/slices/authSlice';

// Components
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/TicketList';
import TicketDetails from './pages/TicketDetails';
import NewTicket from './pages/NewTicket';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminTicketDetails from './pages/AdminTicketDetails';
import AdminTicketEdit from './pages/AdminTicketEdit';
import AdminSettings from './pages/AdminSettings';
import AdminLogin from './pages/AdminLogin';
import AdminCreateTicket from './pages/AdminCreateTicket';
import AdminCalendarView from './pages/AdminCalendarView';
import AdminClientList from './pages/AdminClientList';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#1976D2',
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#E91E63',
      light: '#F06292',
      dark: '#C2185B',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#C62828',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF'
    }
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500
    },
    h6: {
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 0
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '8px 16px'
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          }
        },
        containedSecondary: {
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
          borderRadius: 0
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500
        }
      }
    }
  }
});

// Inner App component to access Redux store
function AppContent() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    // If a token exists in the state (loaded from localStorage by the slice),
    // try to load the user data to restore the session.
    if (token) {
      console.log('Token found, attempting to load user data...');
      dispatch(loadUserData());
    }
  }, [dispatch, token]); // Depend on dispatch and token

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/tickets" replace />} />
        <Route 
          path="dashboard" 
          element={
            <PrivateRoute roles={['client']}>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="tickets" 
          element={
            <PrivateRoute>
              <TicketList />
            </PrivateRoute>
          } 
        />
        <Route 
          path="tickets/new" 
          element={
            <PrivateRoute roles={['client']}>
              <NewTicket />
            </PrivateRoute>
          } 
        />
        <Route 
          path="tickets/:id" 
          element={
            <PrivateRoute>
              <TicketDetails />
            </PrivateRoute>
          } 
        />
        <Route 
          path="admin" 
          element={
            <PrivateRoute roles={['admin', 'technician']}>
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="admin/tickets/:id" 
          element={
            <PrivateRoute roles={['admin', 'technician']}>
              <AdminTicketDetails />
            </PrivateRoute>
          } 
        />
        <Route 
          path="admin/tickets/:id/edit" 
          element={
            <PrivateRoute roles={['admin', 'technician']}>
              <AdminTicketEdit />
            </PrivateRoute>
          } 
        />
        <Route 
          path="admin/settings" 
          element={
            <PrivateRoute roles={['admin']}>
              <AdminSettings />
            </PrivateRoute>
          } 
        />
        <Route 
          path="admin/calendar"
          element={
            <PrivateRoute roles={['admin', 'technician']}>
              <AdminCalendarView />
            </PrivateRoute>
          } 
        />
        <Route 
          path="admin/create-ticket" 
          element={
            <PrivateRoute roles={['admin', 'technician']}>
              <AdminCreateTicket />
            </PrivateRoute>
          } 
        />
        <Route 
          path="admin/clients" 
          element={
            <PrivateRoute roles={['admin', 'technician']}>
              <AdminClientList />
            </PrivateRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;

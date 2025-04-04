import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import store from './store';

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

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
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
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;

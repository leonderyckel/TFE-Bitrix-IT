import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CircularProgress, Box } from '@mui/material';

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user, token, loading } = useSelector((state) => state.auth);
  
  // Si on a un token mais pas encore les données utilisateur (chargement en cours)
  const isLoadingAuth = token && (!user || loading);

  console.log(`[PrivateRoute] Path requires roles: ${roles}. User:`, user, `Token exists: ${!!token}, IsAuthenticated: ${isAuthenticated}, IsLoadingAuth: ${isLoadingAuth}, Loading: ${loading}`);

  if (isLoadingAuth) {
    console.log('[PrivateRoute] Auth state loading (token exists but user data not ready). Showing spinner.');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    console.log('[PrivateRoute] Not authenticated, redirecting to /login');
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user?.role)) {
    console.log(`[PrivateRoute] Role mismatch: User role '${user?.role}' not in required roles [${roles.join(', ')}].`);
    
    // Rediriger vers la page appropriée selon le rôle
    if (user?.role === 'admin' || user?.role === 'technician') {
      console.log('[PrivateRoute] Redirecting admin/technician to /admin');
      return <Navigate to="/admin" />;
    } else {
      console.log('[PrivateRoute] Redirecting client to /tickets');
      return <Navigate to="/tickets" />;
    }
  }

  console.log('[PrivateRoute] Access granted.');
  return children;
}

export default PrivateRoute; 
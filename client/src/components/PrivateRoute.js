import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CircularProgress, Box } from '@mui/material';

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  
  const isLoadingAuth = token && (!isAuthenticated || !user);

  console.log(`[PrivateRoute] Path requires roles: ${roles}. User:`, user, `Token exists: ${!!token}, IsAuthenticated: ${isAuthenticated}, IsLoadingAuth: ${isLoadingAuth}`);

  if (isLoadingAuth) {
    console.log('[PrivateRoute] Auth state loading (token exists but user/isAuthenticated not ready). Showing spinner.');
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
    console.log(`[PrivateRoute] Role mismatch: User role '${user?.role}' not in required roles [${roles.join(', ')}]. Redirecting to /dashboard.`);
    return <Navigate to="/dashboard" />;
  }

  console.log('[PrivateRoute] Access granted.');
  return children;
}

export default PrivateRoute; 
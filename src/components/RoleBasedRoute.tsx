import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Home from '../pages/Home';
import AdminHome from '../pages/AdminHome';

interface RoleBasedRouteProps {
  children?: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  // If user is admin, show admin home page
  if (user?.role === 'admin') {
    return <AdminHome />;
  }

  // Otherwise show regular home page or children
  return children ? <>{children}</> : <Home />;
};

export default RoleBasedRoute; 
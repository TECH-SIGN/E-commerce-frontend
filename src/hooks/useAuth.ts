import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const useAuth = () => {
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  return {
    user,
    isAuthenticated,
    token,
    isLoggedIn: !!token && !!user
  };
}; 
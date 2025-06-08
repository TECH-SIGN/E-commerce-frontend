import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/user/Profile';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Container>
    </>
  );
};

export default App; 
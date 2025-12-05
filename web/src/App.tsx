import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import tBankTheme from './theme';
import Header from './components/Layout/Header';
import Navigation from './components/Layout/Navigation';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import AuthPage from './pages/AuthPage';
import { authService } from './services/authService';

// Компонент защищенного маршрута
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

// Компонент главного лейаута с навигацией
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#000000',
      color: '#FFFFFF',
      pb: '70px' // Отступ для навигации
    }}>
      <Header />
      {children}
      <Navigation />
    </Box>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  // Настраиваем axios interceptors при загрузке
  useEffect(() => {
    authService.setupAxiosInterceptors();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider theme={tBankTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Маршрут авторизации */}
          <Route 
            path="/auth" 
            element={
              !isAuthenticated ? (
                <AuthPage onAuthSuccess={handleAuthSuccess} />
              ) : (
                <Navigate to="/profile" replace />
              )
            } 
          />
          
          {/* Защищенные маршруты */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Chat />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Редирект с корня */}
          <Route 
            path="/" 
            element={
              <Navigate to={isAuthenticated ? "/profile" : "/auth"} replace />
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import { authService } from '../services/authService';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Проверяем статус бекенда при загрузке
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      // Можно сделать простой запрос на health-check или любой публичный endpoint
      const response = await fetch('http://localhost:8080/docs');
      setBackendStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      {/* Заголовок */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
          <AccountBalanceWalletIcon sx={{ color: '#FFD600', fontSize: 48 }} />
          <Typography variant="h2" sx={{ 
            fontWeight: 800,
            background: 'linear-gradient(90deg, #FFD600 0%, #FFFFFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Т-Банк
          </Typography>
        </Box>
        
        <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1 }}>
          Рациональный помощник
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
          Контролируйте импульсивные покупки, планируйте бюджет и принимайте осознанные финансовые решения
        </Typography>

        {/* Статус бекенда */}
        <Paper sx={{ 
          p: 2, 
          backgroundColor: '#1A1A1A',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          mb: 2
        }}>
          <Box sx={{ 
            width: 10, 
            height: 10, 
            borderRadius: '50%', 
            backgroundColor: backendStatus === 'online' ? '#4CAF50' : 
                           backendStatus === 'offline' ? '#FF5252' : '#FFD600',
            animation: backendStatus === 'checking' ? 'pulse 1.5s infinite' : 'none'
          }} />
          <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
            {backendStatus === 'checking' && 'Проверка соединения...'}
            {backendStatus === 'online' && 'Backend: онлайн ✓'}
            {backendStatus === 'offline' && 'Backend: оффлайн ⚠️'}
          </Typography>
        </Paper>
      </Box>

      {/* Форма авторизации */}
      {isLogin ? (
        <LoginForm 
          onSuccess={onAuthSuccess} 
          onSwitchToRegister={() => setIsLogin(false)} 
        />
      ) : (
        <RegisterForm 
          onSuccess={onAuthSuccess} 
          onSwitchToLogin={() => setIsLogin(true)} 
        />
      )}

      {/* Информация о возможностях */}
      <Box sx={{ mt: 6, maxWidth: 800, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 3 }}>
          Что умеет рациональный помощник?
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
          {[
            { icon: '⏰', title: 'Период охлаждения', desc: 'Откладывайте покупки на 1-90 дней' },
            { icon: '🚫', title: 'Запрещённые категории', desc: 'Блокировка импульсивных трат' },
            { icon: '💰', title: 'Финансовый расчёт', desc: 'Когда покупка станет комфортной' },
            { icon: '🤖', title: 'ИИ-помощник', desc: 'Консультации по покупкам' },
            { icon: '📊', title: 'Аналитика', desc: 'Отслеживание ваших привычек' },
            { icon: '🔔', title: 'Умные уведомления', desc: 'Напоминания о целях' },
          ].map((feature, index) => (
            <Paper 
              key={index}
              sx={{ 
                p: 3, 
                backgroundColor: '#1A1A1A',
                flex: '1 0 200px',
                maxWidth: 250,
                border: '1px solid #333333',
                '&:hover': {
                  borderColor: '#FFD600',
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s',
                }
              }}
            >
              <Typography variant="h4" sx={{ mb: 1 }}>
                {feature.icon}
              </Typography>
              <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 1 }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.desc}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Container>
  );
};

export default AuthPage;
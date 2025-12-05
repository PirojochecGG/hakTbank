import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Person, Lock } from '@mui/icons-material';
import { authService, type RegisterData } from '../../services/authService';
import TButton from '../Common/TButton';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    nickname: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.nickname) {
      setError('Все поля обязательны для заполнения');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Введите корректный email');
      return false;
    }

    if (formData.password.length < 3) {
      setError('Пароль должен содержать минимум 3 символа');
      return false;
    }

    if (formData.password !== confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }

    if (formData.nickname.length < 2) {
      setError('Никнейм должен содержать минимум 2 символа');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await authService.register(formData);
      authService.setAuthData(response.access_token, response.user);
      setSuccess('Регистрация успешна! Добро пожаловать!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'Ошибка регистрации. Попробуйте снова.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof RegisterData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  return (
    <Paper sx={{ 
      p: 4, 
      backgroundColor: '#1A1A1A',
      maxWidth: 400,
      width: '100%',
      mx: 'auto'
    }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#FFD600', fontWeight: 700 }}>
          Т-Банк
        </Typography>
        <Typography variant="h6" sx={{ mt: 1, color: '#FFFFFF' }}>
          Создание аккаунта
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Рациональный помощник для ваших финансов
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          margin="normal"
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email sx={{ color: '#FFD600' }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Никнейм"
          value={formData.nickname}
          onChange={handleChange('nickname')}
          margin="normal"
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person sx={{ color: '#FFD600' }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Пароль"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange('password')}
          margin="normal"
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock sx={{ color: '#FFD600' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  sx={{ color: '#FFD600' }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Подтверждение пароля"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          margin="normal"
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock sx={{ color: '#FFD600' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                  sx={{ color: '#FFD600' }}
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TButton
          type="submit"
          fullWidth
          disabled={loading}
          sx={{ mt: 3, py: 1.5 }}
        >
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </TButton>
      </form>

      <Divider sx={{ my: 3, borderColor: '#333333' }}>
        <Typography variant="body2" color="text.secondary">
          или
        </Typography>
      </Divider>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Уже есть аккаунт?
        </Typography>
        <Button
          onClick={onSwitchToLogin}
          sx={{
            mt: 1,
            color: '#FFD600',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'rgba(255, 214, 0, 0.1)',
            },
          }}
        >
          Войти в существующий аккаунт
        </Button>
      </Box>
    </Paper>
  );
};

export default RegisterForm;
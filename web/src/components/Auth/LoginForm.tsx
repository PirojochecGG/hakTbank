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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import TButton from '../Common/TButton';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Введите email и пароль');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(formData);
      authService.setAuthData(response.access_token, response.user);

      if (rememberMe) {
        // Сохраняем в localStorage (уже сделано в setAuthData)
      }

      onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Неверный email или пароль'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof LoginData) => (
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
          Вход в аккаунт
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                sx={{
                  color: '#FFD600',
                  '&.Mui-checked': {
                    color: '#FFD600',
                  },
                }}
              />
            }
            label="Запомнить меня"
            sx={{ color: '#FFFFFF' }}
          />

          <Button
            type="button"
            sx={{
              color: '#FFD600',
              fontWeight: 500,
              fontSize: '0.875rem',
              '&:hover': {
                backgroundColor: 'rgba(255, 214, 0, 0.1)',
              },
            }}
          >
            Забыли пароль?
          </Button>
        </Box>

        <TButton
          type="submit"
          fullWidth
          disabled={loading}
          sx={{ mt: 3, py: 1.5 }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </TButton>
      </form>

      <Divider sx={{ my: 3, borderColor: '#333333' }}>
        <Typography variant="body2" color="text.secondary">
          или
        </Typography>
      </Divider>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Нет аккаунта?
        </Typography>
        <Button
          onClick={onSwitchToRegister}
          sx={{
            mt: 1,
            color: '#FFD600',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'rgba(255, 214, 0, 0.1)',
            },
          }}
        >
          Создать новый аккаунт
        </Button>
      </Box>
    </Paper>
  );
};

export default LoginForm;

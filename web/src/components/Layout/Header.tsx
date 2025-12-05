import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { authService } from '../../services/authService';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/auth');
    handleMenuClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };

  return (
    <AppBar position="static" elevation={0} sx={{ backgroundColor: '#000000', borderBottom: '1px solid #333333' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={() => navigate('/profile')}>
          <AccountBalanceWalletIcon sx={{ color: '#FFD600', fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(90deg, #FFD600 0%, #FFFFFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Т-Банк
            </Typography>
            <Typography variant="caption" sx={{ color: '#B0B0B0' }}>
              Рациональный ассистент
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Информация о пользователе */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                {user.nickname}
              </Typography>
              <Typography variant="caption" sx={{ color: '#B0B0B0' }}>
                {user.email}
              </Typography>
            </Box>
            
            <IconButton
              onClick={handleMenuOpen}
              sx={{
                backgroundColor: '#333333',
                '&:hover': { backgroundColor: '#444444' }
              }}
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#FFD600', color: '#000000' }}>
                {user.nickname.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  backgroundColor: '#1A1A1A',
                  color: '#FFFFFF',
                  mt: 1,
                  minWidth: 180,
                }
              }}
            >
              <MenuItem onClick={handleProfile} sx={{ '&:hover': { backgroundColor: '#333333' } }}>
                <PersonIcon sx={{ mr: 2, fontSize: 20, color: '#FFD600' }} />
                Профиль
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ '&:hover': { backgroundColor: '#333333' } }}>
                <LogoutIcon sx={{ mr: 2, fontSize: 20, color: '#FFD600' }} />
                Выйти
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
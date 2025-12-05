import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { styled } from '@mui/material/styles';

const StyledBottomNavigation = styled(BottomNavigation)({
  backgroundColor: '#000000',
  borderTop: '1px solid #333333',
  height: '70px',
});

const StyledNavigationAction = styled(BottomNavigationAction)({
  color: '#B0B0B0',
  '&.Mui-selected': {
    color: '#FFD600',
  },
  '& .MuiBottomNavigationAction-label': {
    fontSize: '12px',
    fontWeight: 500,
    marginTop: '4px',
  },
});

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = React.useState(
    location.pathname === '/profile' ? 0 : 1
  );

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        backgroundColor: '#000000',
        borderTop: '1px solid #333333',
        zIndex: 1000 
      }}
    >
      <StyledBottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
          navigate(newValue === 0 ? '/profile' : '/chat');
        }}
      >
        <StyledNavigationAction 
          label="Профиль" 
          icon={<PersonIcon />} 
        />
        <StyledNavigationAction 
          label="Чат-помощник" 
          icon={<ChatBubbleIcon />} 
        />
      </StyledBottomNavigation>
    </Paper>
  );
};

export default Navigation;
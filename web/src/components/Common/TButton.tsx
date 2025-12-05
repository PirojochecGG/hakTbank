import React from 'react';
import { Button, type ButtonProps } from '@mui/material';

interface TButtonProps extends ButtonProps {
  children: React.ReactNode;
}

const TButton: React.FC<TButtonProps> = ({ children, ...props }) => {
  return (
    <Button
      variant="contained"
      color="primary"
      sx={{
        backgroundColor: '#FFD600',
        color: '#000000',
        fontWeight: 700,
        borderRadius: '12px',
        padding: '12px 32px',
        '&:hover': {
          backgroundColor: '#FFE44D',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(255, 214, 0, 0.3)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default TButton;
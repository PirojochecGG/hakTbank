import { type ReactNode, useState } from 'react'
import {
  Avatar,
  Box,
  Drawer,
  List,
  Button,
  Divider,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  IconButton,
} from '@mui/material'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const drawerWidth = 260

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false)
  }

  const userInitial = user?.nickname?.[0] || user?.email?.[0] || '?'
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Основной контент */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: '100vh',
          pb: { xs: isAuthPage ? 0 : 0, md: 0 },
          p: { xs: 2, md: 3 },
          overflowY: 'auto',
        }}
      >
        {/* Мобильная кнопка меню */}
        {!isAuthPage && (
          <IconButton
            sx={{
              display: { xs: 'flex', md: 'none' },
              mb: 2,
              color: 'primary.main',
            }}
            onClick={() => setMobileMenuOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        )}
        {children}
      </Box>

      {/* Desktop Drawer (постоянный на больших экранах) */}
      {!isAuthPage && (
        <Drawer
          variant="permanent"
          anchor="right"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 2,
            },
          }}
        >
          <DrawerContent
            token={token}
            user={user}
            userInitial={userInitial}
            onLogout={handleLogout}
            onNavigate={() => {}}
          />
        </Drawer>
      )}

      {/* Mobile Drawer (модальный на мобильных) */}
      {!isAuthPage && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileMenuOpen}
          onClose={handleMobileMenuClose}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: '100%',
              maxWidth: 300,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 2,
            },
          }}
        >
          <Box>
            <IconButton
              sx={{
                alignSelf: 'flex-start',
                mb: 1,
                color: 'primary.main',
              }}
              onClick={handleMobileMenuClose}
            >
              <CloseIcon />
            </IconButton>
            <DrawerContent
              token={token}
              user={user}
              userInitial={userInitial}
              onLogout={handleLogout}
              onNavigate={handleMobileMenuClose}
            />
          </Box>
        </Drawer>
      )}
    </Box>
  )
}

// Компонент для содержимого drawer
interface DrawerContentProps {
  token: string | null
  user: { nickname?: string; email?: string } | null
  userInitial: string
  onLogout: () => void
  onNavigate: () => void
}

function DrawerContent({ token, user, userInitial, onLogout, onNavigate }: DrawerContentProps) {
  return (
    <>
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Охладитель
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Рациональный ассистент
          </Typography>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <List>
          <ListItemButton
            component={NavLink}
            to="/user/profile"
            onClick={onNavigate}
            sx={{
              borderRadius: 2,
              mb: 1,
              opacity: token ? 1 : 0.6,
              pointerEvents: token ? 'auto' : 'none',
              '&.active': {
                bgcolor: 'primary.main',
                color: '#000000',
                '& .MuiListItemIcon-root': {
                  color: '#000000',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: 'text.secondary' }}>
              <PersonOutlineIcon />
            </ListItemIcon>
            <ListItemText primary="Профиль" />
          </ListItemButton>

          <ListItemButton
            component={NavLink}
            to="/chat"
            onClick={onNavigate}
            sx={{
              borderRadius: 2,
              opacity: token ? 1 : 0.6,
              pointerEvents: token ? 'auto' : 'none',
              '&.active': {
                bgcolor: 'primary.main',
                color: '#000000',
                '& .MuiListItemIcon-root': {
                  color: '#000000',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: 'text.secondary' }}>
              <ChatBubbleOutlineIcon />
            </ListItemIcon>
            <ListItemText primary="Чат с моделью" />
          </ListItemButton>
          <ListItemButton
            component={NavLink}
            to="/tariffs"
            onClick={onNavigate}
            sx={{
              borderRadius: 2,
              opacity: token ? 1 : 0.6,
              pointerEvents: token ? 'auto' : 'none',
              '&.active': {
                bgcolor: 'primary.main',
                color: '#000000',
                '& .MuiListItemIcon-root': {
                  color: '#000000',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: 'text.secondary' }}>
              <PaidOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary="Тарифы" />
          </ListItemButton>
        </List>
      </Box>

      <Box>
        <Divider sx={{ mb: 2 }} />
        {token ? (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', color: 'black' }}>{userInitial}</Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {user?.nickname || 'Пользователь'}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="outlined"
              color="inherit"
              onClick={onLogout}
              startIcon={<LogoutIcon />}
              fullWidth
            >
              Выйти
            </Button>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Button component={NavLink} to="/login" variant="contained" fullWidth>
              Войти
            </Button>
            <Button component={NavLink} to="/register" variant="outlined" color="inherit" fullWidth>
              Регистрация
            </Button>
          </Stack>
        )}
        <Divider sx={{ mt: 2, mb: 1 }} />
        <Typography variant="caption" color="text.secondary">
          Сделано для хакатона Охладитель.
        </Typography>
      </Box>
    </>
  )
}

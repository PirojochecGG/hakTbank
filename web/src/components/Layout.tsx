import { type ReactNode } from "react";
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
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 260;

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const userInitial = user?.nickname?.[0] || user?.email?.[0] || "?";
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <Box
      sx={{
        display: "block",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Основной контент. Делаем отступ справа под фиксированный Drawer */}
      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          mr: { xs: 0, md: isAuthPage ? 0 : `${drawerWidth}px` },
          p: { xs: 2, md: 3 },
        }}
      >
        {children}
      </Box>

      {/* Фиксированное правое меню, без своего скролла */}
      {!isAuthPage && (
      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "background.paper",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            overflow: "hidden", // отключаем внутренний скролл
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: 2,
          },
        }}
      >
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              T-Bank
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Рациональный ассистент
            </Typography>
          </Box>

          <Divider sx={{ mb: 1 }} />

          <List>
            <ListItemButton
              component={NavLink}
              to="/profile"
              sx={{
                borderRadius: 2,
                mb: 1,
                opacity: token ? 1 : 0.6,
                pointerEvents: token ? "auto" : "none",
                "&.active": {
                  bgcolor: "primary.main",
                  color: "#000000",
                  "& .MuiListItemIcon-root": {
                    color: "#000000",
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: "text.secondary" }}>
                <PersonOutlineIcon />
              </ListItemIcon>
              <ListItemText primary="Профиль" />
            </ListItemButton>

            <ListItemButton
              component={NavLink}
              to="/chat"
              sx={{
                borderRadius: 2,
                opacity: token ? 1 : 0.6,
                pointerEvents: token ? "auto" : "none",
                "&.active": {
                  bgcolor: "primary.main",
                  color: "#000000",
                  "& .MuiListItemIcon-root": {
                    color: "#000000",
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: "text.secondary" }}>
                <ChatBubbleOutlineIcon />
              </ListItemIcon>
              <ListItemText primary="Чат с моделью" />
            </ListItemButton>
          </List>
        </Box>

        <Box>
          <Divider sx={{ mb: 2 }} />
          {token ? (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: "primary.main", color: "black" }}>
                  {userInitial}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">
                    {user?.nickname || "Пользователь"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="outlined"
                color="inherit"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
              >
                Выйти
              </Button>
            </Stack>
          ) : (
            <Stack spacing={1}>
              <Button component={NavLink} to="/login" variant="contained">
                Войти
              </Button>
              <Button
                component={NavLink}
                to="/register"
                variant="outlined"
                color="inherit"
              >
                Регистрация
              </Button>
            </Stack>
          )}
          <Divider sx={{ mt: 2, mb: 1 }} />{" "}
          <Typography variant="caption" color="text.secondary">
            Сделано для хакатона T-Bank.
          </Typography>
        </Box>
      </Drawer>
      )}
    </Box>
  );
}

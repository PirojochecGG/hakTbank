import { type ReactNode } from "react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { NavLink } from "react-router-dom";

const drawerWidth = 260;

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
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
          mr: { xs: 0, md: `${drawerWidth}px` },
          p: { xs: 2, md: 3 },
        }}
      >
        {children}
      </Box>

      {/* Фиксированное правое меню, без своего скролла */}
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
              component={NavLink as any}
              to="/profile"
              sx={{
                borderRadius: 2,
                mb: 1,
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
              component={NavLink as any}
              to="/chat"
              sx={{
                borderRadius: 2,
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
          <Divider sx={{ mb: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Сделано для хакатона T-Bank.
          </Typography>
        </Box>
      </Drawer>
    </Box>
  );
}

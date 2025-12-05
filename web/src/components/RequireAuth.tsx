import { Box, CircularProgress, Typography } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { JSX } from "react/jsx-runtime";

type RequireAuthProps = {
  children: JSX.Element;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const { token, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <Box display="flex" alignItems="center" gap={1} py={4}>
        <CircularProgress size={20} />
        <Typography variant="body2">Загружаем данные...</Typography>
      </Box>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

import { useEffect, useMemo } from 'react'
import { Box } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import LoginForm from '../components/Auth/LoginForm'
import { useAuth } from '../context/AuthContext'

type LocationState = { from?: { pathname: string } } | null

export function LoginPage() {
  const { token, isInitializing } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = useMemo(() => {
    const state = location.state as LocationState
    return state?.from?.pathname || '/profile'
  }, [location.state])

  useEffect(() => {
    if (!isInitializing && token) {
      navigate(redirectTo, { replace: true })
    }
  }, [isInitializing, navigate, redirectTo, token])

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', py: { xs: 2, md: 4 } }}>
      <LoginForm
        onSuccess={() => navigate(redirectTo, { replace: true })}
        onSwitchToRegister={() => navigate('/register', { replace: true })}
      />
    </Box>
  )
}

import { Box } from '@mui/material'
import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import RegisterForm from '../components/Auth/RegisterForm'
import { useAuth } from '../context/AuthContext'

type LocationState = { from?: { pathname: string } } | null

export function RegisterPage() {
  const { token, isInitializing } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = useMemo(() => {
    const state = location.state as LocationState
    return state?.from?.pathname || '/user/profile'
  }, [location.state])

  useEffect(() => {
    if (!isInitializing && token) {
      navigate(redirectTo, { replace: true })
    }
  }, [isInitializing, navigate, redirectTo, token])

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', py: { xs: 2, md: 4 } }}>
      <RegisterForm
        onSuccess={() => navigate(redirectTo, { replace: true })}
        onSwitchToLogin={() => navigate('/login', { replace: true })}
      />
    </Box>
  )
}

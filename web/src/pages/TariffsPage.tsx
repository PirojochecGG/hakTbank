import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout'
import LockClockIcon from '@mui/icons-material/LockClock'
import { apiFetch } from '../api/api'

type ApiLimitation =
  | string
  | number
  | {
      name?: string
      value?: string | number
      title?: string
      description?: string
    }

type ApiTariff = {
  id?: string | number
  code?: string
  name?: string
  title?: string
  description?: string
  price?: number
  amount?: number
  cost?: number
  currency?: string
  period?: string
  billing_period?: string
  limitations?: ApiLimitation[]
  limits?: ApiLimitation[]
  features?: ApiLimitation[]
  is_available?: boolean
  available?: boolean
}

type TariffsResponse = {
  tariffs?: ApiTariff[]
  items?: ApiTariff[]
  plans?: ApiTariff[]
  can_purchase?: boolean
  is_available?: boolean
  available?: boolean
  disabled_reason?: string
  reason?: string
}

type PaymentResponse = {
  confirmation_url?: string
  confirmation?: { confirmation_url?: string }
  url?: string
  payment_url?: string
}

type Tariff = {
  id: string
  title: string
  description?: string
  price: number
  currency: string
  period?: string
  limitations: string[]
  isAvailable: boolean
}

type FetchState = 'idle' | 'loading' | 'error'

const normalizeLimitation = (item: ApiLimitation): string => {
  if (typeof item === 'string' || typeof item === 'number') {
    return String(item)
  }

  const label = item.title ?? item.name ?? 'Ограничение'
  if (item.value !== undefined) {
    return `${label}: ${item.value}`
  }

  return item.description ?? label
}

const normalizeTariffs = (response: TariffsResponse): Tariff[] => {
  const rawTariffs = response.tariffs ?? response.items ?? response.plans ?? []

  return rawTariffs
    .map((tariff, index) => {
      const rawLimitations = tariff.limitations ?? tariff.limits ?? tariff.features ?? []

      return {
        id: String(tariff.id ?? tariff.code ?? `tariff-${index}`),
        title: tariff.title ?? tariff.name ?? 'Тариф',
        description: tariff.description,
        price: tariff.price ?? tariff.amount ?? tariff.cost ?? 0,
        currency: tariff.currency ?? 'RUB',
        period: tariff.period ?? tariff.billing_period ?? 'месяц',
        limitations: rawLimitations.map(normalizeLimitation),
        isAvailable: tariff.is_available ?? tariff.available ?? true,
      }
    })
    .filter((tariff) => tariff.id)
}

const formatPrice = (price: number, currency: string) => {
  if (Number.isNaN(price)) return '—'

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

const extractConfirmationUrl = (payment: PaymentResponse) =>
  payment.confirmation_url ??
  payment.confirmation?.confirmation_url ??
  payment.payment_url ??
  payment.url

export function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [fetchState, setFetchState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null)
  const [canPurchase, setCanPurchase] = useState(true)
  const [disabledReason, setDisabledReason] = useState<string | undefined>()

  useEffect(() => {
    const loadTariffs = async () => {
      setFetchState('loading')
      setError(null)
      try {
        const response = await apiFetch<TariffsResponse>('/payment/tariffs')
        setTariffs(normalizeTariffs(response))
        setCanPurchase(response.can_purchase ?? response.is_available ?? response.available ?? true)
        setDisabledReason(response.disabled_reason ?? response.reason)
        setFetchState('idle')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Не удалось загрузить тарифы. Попробуйте позже.'
        setError(message)
        setFetchState('error')
      }
    }

    void loadTariffs()
  }, [])

  const handlePurchase = async (tariff: Tariff) => {
    setPurchaseError(null)
    setIsPurchasing(tariff.id)
    try {
      const payment = await apiFetch<PaymentResponse>('/payment/yookassa/create', {
        method: 'POST',
        body: JSON.stringify({ tariff_id: tariff.id }),
      })

      const confirmationUrl = extractConfirmationUrl(payment)
      if (!confirmationUrl) {
        throw new Error('Не удалось получить ссылку на оплату')
      }

      const newWindow = window.open(confirmationUrl, '_blank')
      if (!newWindow) {
        window.location.href = confirmationUrl
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось создать платёж. Попробуйте еще раз.'
      setPurchaseError(message)
    } finally {
      setIsPurchasing(null)
    }
  }

  const isLoading = fetchState === 'loading'

  const purchaseWarning = useMemo(() => {
    if (canPurchase) return null
    return disabledReason ?? 'Покупка тарифов недоступна для вашего аккаунта.'
  }, [canPurchase, disabledReason])

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            Тарифы
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Выберите подходящий план и оформите подписку.
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ mt: 3 }}>
        {isLoading && (
          <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
            <CircularProgress color="inherit" />
            <Typography color="text.secondary">Загружаем тарифы…</Typography>
          </Stack>
        )}

        {!isLoading && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!isLoading && purchaseError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {purchaseError}
          </Alert>
        )}

        {purchaseWarning && (
          <Alert severity="info" icon={<LockClockIcon />} sx={{ mb: 2 }}>
            {purchaseWarning}
          </Alert>
        )}

        {!isLoading && !error && (
          <Grid container spacing={2}>
            {tariffs.map((tariff) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={tariff.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {tariff.title}
                      </Typography>
                      {!tariff.isAvailable && (
                        <Chip label="Недоступно" color="default" size="small" />
                      )}
                    </Stack>

                    {tariff.description && (
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {tariff.description}
                      </Typography>
                    )}

                    <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
                      {formatPrice(tariff.price, tariff.currency)}
                      {tariff.period ? (
                        <Typography
                          component="span"
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          за {tariff.period}
                        </Typography>
                      ) : null}
                    </Typography>

                    <Stack spacing={1}>
                      {tariff.limitations.length ? (
                        tariff.limitations.map((limitation, index) => (
                          <Stack key={index} direction="row" spacing={1}>
                            <Chip label={limitation} variant="outlined" size="small" />
                          </Stack>
                        ))
                      ) : (
                        <Typography color="text.secondary" variant="body2">
                          Нет ограничений
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      startIcon={<ShoppingCartCheckoutIcon />}
                      fullWidth
                      disabled={!canPurchase || !tariff.isAvailable || isPurchasing === tariff.id}
                      onClick={() => handlePurchase(tariff)}
                    >
                      {isPurchasing === tariff.id ? 'Создаём платёж…' : 'Купить'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}

            {!tariffs.length && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info">Тарифы временно недоступны.</Alert>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
    </Box>
  )
}

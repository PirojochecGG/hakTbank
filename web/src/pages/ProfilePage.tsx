import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  TextField,
  Paper,
  Button,
  Stack,
  IconButton,
  Chip,
  MenuItem,
  Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { apiFetch } from '../api/api'
import {
  type NotificationChannel,
  type NotificationFrequency,
  useAuth,
  type ProfileRule,
} from '../context/AuthContext'

type CoolingRange = {
  id: number
  minAmount: number
  maxAmount: number | null
  days: number
}

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [nickname, setNickname] = useState('')
  const [monthlySalary, setMonthlySalary] = useState('')
  const [monthlySavings, setMonthlySavings] = useState('')
  const [currentSavings, setCurrentSavings] = useState('')

  const [notifyChannel, setNotifyChannel] = useState<NotificationChannel>('none')
  const [notifyFrequency, setNotifyFrequency] = useState<NotificationFrequency>('weekly')

  const [coolingRanges, setCoolingRanges] = useState<CoolingRange[]>([
    { id: 1, minAmount: 0, maxAmount: 5000, days: 1 },
    { id: 2, minAmount: 5000, maxAmount: 20000, days: 3 },
    { id: 3, minAmount: 20000, maxAmount: null, days: 7 },
  ])

  const [blacklistInput, setBlacklistInput] = useState('')
  const [blacklist, setBlacklist] = useState<string[]>([])

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const defaultRanges: CoolingRange[] = useMemo(
    () => [
      { id: 1, minAmount: 0, maxAmount: 5000, days: 1 },
      { id: 2, minAmount: 5000, maxAmount: 20000, days: 3 },
      { id: 3, minAmount: 20000, maxAmount: null, days: 7 },
    ],
    [],
  )

  useEffect(() => {
    if (!profile) {
      void refreshProfile()
    }
  }, [profile, refreshProfile])

  useEffect(() => {
    if (!profile) return

    setNickname(profile.nickname ?? '')
    setMonthlySalary(profile.monthlySalary != null ? String(profile.monthlySalary) : '')
    setMonthlySavings(profile.monthlySavings != null ? String(profile.monthlySavings) : '')
    setCurrentSavings(profile.currentSavings != null ? String(profile.currentSavings) : '')
    setNotifyChannel(profile.notifyChannel)
    setNotifyFrequency(profile.notifyFrequency)

    const mappedRules: CoolingRange[] =
      profile.coolingRanges.length > 0
        ? profile.coolingRanges.map((rule: ProfileRule, idx) => ({
            id: idx + 1,
            minAmount: rule.min_amount,
            maxAmount: rule.max_amount,
            days: rule.days,
          }))
        : defaultRanges

    setCoolingRanges(mappedRules)
    setBlacklist(profile.blacklist)
  }, [defaultRanges, profile])

  const parseNumber = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return null
    const num = Number(trimmed)
    return Number.isNaN(num) ? null : num
  }

  // Фильтруем ввод: только целые неотрицательные числа (без точки, +, -)
  const filterNumberInput = (value: string): string => {
    if (value === '') return ''
    // Оставляем только цифры
    return value.replace(/[^\d]/g, '')
  }

  const handleAddRule = () => {
    setCoolingRanges((prev) => [
      ...prev,
      {
        id: Date.now(),
        minAmount: 0,
        maxAmount: null,
        days: 1,
      },
    ])
  }

  const handleRuleChange = (id: number, field: keyof Omit<CoolingRange, 'id'>, value: string) => {
    setCoolingRanges((prev) =>
      prev.map((rule) => {
        if (rule.id !== id) return rule
        if (field === 'maxAmount') {
          return {
            ...rule,
            maxAmount: value === '' ? null : Number(value),
          }
        }
        if (field === 'minAmount' || field === 'days') {
          return {
            ...rule,
            [field]: value === '' ? 0 : Number(value),
          }
        }
        return rule
      }),
    )
  }

  const handleRemoveRule = (id: number) => {
    setCoolingRanges((prev) => prev.filter((r) => r.id !== id))
  }

  const handleAddBlacklistItem = () => {
    const trimmed = blacklistInput.trim()
    if (!trimmed) return
    if (blacklist.includes(trimmed)) {
      setBlacklistInput('')
      return
    }
    setBlacklist((prev) => [...prev, trimmed])
    setBlacklistInput('')
  }

  const handleRemoveBlacklistItem = (item: string) => {
    setBlacklist((prev) => prev.filter((c) => c !== item))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaveMessage(null)

    if (!nickname.trim()) {
      setSaveMessage('Укажи никнейм.')
      return
    }

    const payload = {
      nickname: nickname.trim(),
      monthly_salary: parseNumber(monthlySalary),
      monthly_savings: parseNumber(monthlySavings),
      current_savings: parseNumber(currentSavings),
      notify_channel: notifyChannel,
      notify_frequency: notifyFrequency,
      cooling_ranges: coolingRanges.map((r) => ({
        min_amount: r.minAmount,
        max_amount: r.maxAmount,
        days: r.days,
      })),
      blacklist,
    }

    setIsSaving(true)
    try {
      await apiFetch('/v1/user/profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setSaveMessage('Профиль сохранён.')
      void refreshProfile()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Не удалось сохранить профиль.'
      const errorCode = (error as { code?: string }).code

      setSaveMessage(errorCode ? `${errorMessage} (код ошибки: ${errorCode})` : errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Профиль
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Здесь ты настраиваешь, как ассистент будет охлаждать покупки и считать комфортную дату.
          </Typography>
        </Box>

        {/* О тебе */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            О тебе
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 12 }}>
              <TextField
                fullWidth
                label="Никнейм"
                placeholder="Как к тебе обращаться"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Финансы */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Финансы
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Доход в месяц, ₽"
                type="text"
                inputMode="numeric"
                value={monthlySalary}
                onChange={(e) => {
                  const filtered = filterNumberInput(e.target.value)
                  setMonthlySalary(filtered)
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Сбережения в месяц, ₽"
                type="text"
                inputMode="numeric"
                value={monthlySavings}
                onChange={(e) => {
                  const filtered = filterNumberInput(e.target.value)
                  setMonthlySavings(filtered)
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Текущие накопления, ₽"
                type="text"
                inputMode="numeric"
                value={currentSavings}
                onChange={(e) => {
                  const filtered = filterNumberInput(e.target.value)
                  setCurrentSavings(filtered)
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Период охлаждения */}
        <Paper sx={{ p: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
            flexWrap="wrap"
          >
            <Typography variant="h6">Период охлаждения</Typography>
            <Button
              type="button"
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddRule}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Добавить
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" mt={1} mb={2}>
            Для каждого диапазона суммы укажи, сколько дней подождать перед покупкой.
          </Typography>

          <Stack spacing={1.5}>
            {coolingRanges.map((rule) => (
              <Grid key={rule.id} container spacing={1} alignItems="flex-start">
                <Grid size={{ xs: 12, md: 3 }} sx={{ order: { xs: 1, md: 1 } }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    От, ₽
                  </Typography>
                  <TextField
                    fullWidth
                    type="text"
                    inputMode="numeric"
                    size="small"
                    value={rule.minAmount}
                    onChange={(e) => {
                      const filtered = filterNumberInput(e.target.value)
                      handleRuleChange(rule.id, 'minAmount', filtered)
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }} sx={{ order: { xs: 2, md: 2 } }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    До, ₽
                  </Typography>
                  <TextField
                    fullWidth
                    type="text"
                    inputMode="numeric"
                    size="small"
                    placeholder="∞"
                    value={rule.maxAmount ?? ''}
                    onChange={(e) => {
                      const filtered = filterNumberInput(e.target.value)
                      handleRuleChange(rule.id, 'maxAmount', filtered)
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }} sx={{ order: { xs: 3, md: 3 } }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    Дней ожидания
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                      fullWidth
                      type="text"
                      inputMode="numeric"
                      size="small"
                      value={rule.days}
                      onChange={(e) => {
                        const filtered = filterNumberInput(e.target.value)
                        handleRuleChange(rule.id, 'days', filtered)
                      }}
                    />
                    <IconButton
                      color="inherit"
                      onClick={() => handleRemoveRule(rule.id)}
                      size="small"
                      sx={{ display: { xs: 'none', md: 'flex' } }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                </Grid>
                <Grid
                  size={{ xs: 12, md: 3 }}
                  sx={{
                    order: { xs: 4, md: 4 },
                    display: { xs: 'flex', md: 'none' },
                    alignItems: 'flex-start',
                    pt: 0.5,
                  }}
                >
                  <IconButton
                    color="inherit"
                    onClick={() => handleRemoveRule(rule.id)}
                    size="small"
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </Stack>
        </Paper>

        {/* Чёрный список и уведомления */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Чёрный список категорий
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                То, что ты точно не хочешь покупать. Например: «кейсы в играх», «доставка еды»,
                «бесполезные подписки».
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <TextField
                  placeholder="Категория"
                  size="small"
                  value={blacklistInput}
                  onChange={(e) => setBlacklistInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddBlacklistItem()
                    }
                  }}
                  sx={{ flex: 1, minWidth: '150px' }}
                />
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={handleAddBlacklistItem}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Добавить
                </Button>
              </Box>
              <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
                {blacklist.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Пока ничего нет.
                  </Typography>
                )}
                {blacklist.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    onClick={() => handleRemoveBlacklistItem(item)}
                    onDelete={() => handleRemoveBlacklistItem(item)}
                    variant="outlined"
                    sx={{
                      borderRadius: 999,
                      borderColor: 'rgba(255,255,255,0.12)',
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Уведомления
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Как часто ассистент будет напоминать про твои хотелки.
              </Typography>
              <Stack spacing={2}>
                <TextField
                  select
                  label="Канал"
                  value={notifyChannel}
                  onChange={(e) => setNotifyChannel(e.target.value as NotificationChannel)}
                  fullWidth
                >
                  <MenuItem value="none">Не напоминать</MenuItem>
                  <MenuItem value="email">E-mail</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Частота"
                  value={notifyFrequency}
                  onChange={(e) => setNotifyFrequency(e.target.value as NotificationFrequency)}
                  fullWidth
                >
                  <MenuItem value="daily">Каждый день</MenuItem>
                  <MenuItem value="weekly">Раз в неделю</MenuItem>
                  <MenuItem value="monthly">Раз в месяц</MenuItem>
                </TextField>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

        <Box display="flex" alignItems="center" gap={2}>
          <Button type="submit" variant="contained" color="primary" disabled={isSaving}>
            {isSaving ? 'Сохраняем...' : 'Сохранить профиль'}
          </Button>
          {saveMessage && (
            <Typography variant="body2" color="text.secondary">
              {saveMessage}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  )
}

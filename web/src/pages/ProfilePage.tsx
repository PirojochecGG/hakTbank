import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Paper,
  Button,
  Stack,
  IconButton,
  Chip,
  MenuItem,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { apiFetch } from "../api";
import { useAuth, type ProfileRule } from "../context/AuthContext";

type CoolingRange = {
  id: number;
  minAmount: number;
  maxAmount: number | null;
  days: number;
};

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [nickname, setNickname] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlySavings, setMonthlySavings] = useState("");
  const [currentSavings, setCurrentSavings] = useState("");
  const [useSavings, setUseSavings] = useState(true);

  const [notifyChannel, setNotifyChannel] = useState<"none" | "email">("none");
  const [notifyFrequency, setNotifyFrequency] = useState<
    "daily" | "weekly" | "monthly"
  >("weekly");

  const [coolingRanges, setCoolingRanges] = useState<CoolingRange[]>([
    { id: 1, minAmount: 0, maxAmount: 5000, days: 1 },
    { id: 2, minAmount: 5000, maxAmount: 20000, days: 3 },
    { id: 3, minAmount: 20000, maxAmount: null, days: 7 },
  ]);

  const [blacklistInput, setBlacklistInput] = useState("");
  const [blacklist, setBlacklist] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const defaultRanges: CoolingRange[] = useMemo(
    () => [
      { id: 1, minAmount: 0, maxAmount: 5000, days: 1 },
      { id: 2, minAmount: 5000, maxAmount: 20000, days: 3 },
      { id: 3, minAmount: 20000, maxAmount: null, days: 7 },
    ],
    []
  );

  useEffect(() => {
    if (!profile) {
      void refreshProfile();
    }
  }, [profile, refreshProfile]);

  useEffect(() => {
    if (!profile) return;

    setNickname(profile.nickname ?? "");
    setMonthlyIncome(
      profile.monthlyIncome != null ? String(profile.monthlyIncome) : ""
    );
    setMonthlySavings(
      profile.monthlySavings != null ? String(profile.monthlySavings) : ""
    );
    setCurrentSavings(
      profile.currentSavings != null ? String(profile.currentSavings) : ""
    );
    setUseSavings(profile.useSavings);
    setNotifyChannel(profile.notifyChannel);
    setNotifyFrequency(profile.notifyFrequency);

    const mappedRules: CoolingRange[] =
      profile.coolingRanges.length > 0
        ? profile.coolingRanges.map((rule: ProfileRule, idx) => ({
            id: idx + 1,
            minAmount: rule.min_amount,
            maxAmount: rule.max_amount,
            days: rule.days,
          }))
        : defaultRanges;

    setCoolingRanges(mappedRules);
    setBlacklist(profile.blacklist);
  }, [defaultRanges, profile]);

  const parseNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    return Number.isNaN(num) ? null : num;
  };

  const handleAddRule = () => {
    setCoolingRanges((prev) => [
      ...prev,
      {
        id: Date.now(),
        minAmount: 0,
        maxAmount: null,
        days: 1,
      },
    ]);
  };

  const handleRuleChange = (
    id: number,
    field: keyof Omit<CoolingRange, "id">,
    value: string
  ) => {
    setCoolingRanges((prev) =>
      prev.map((rule) => {
        if (rule.id !== id) return rule;
        if (field === "maxAmount") {
          return {
            ...rule,
            maxAmount: value === "" ? null : Number(value),
          };
        }
        if (field === "minAmount" || field === "days") {
          return {
            ...rule,
            [field]: value === "" ? 0 : Number(value),
          };
        }
        return rule;
      })
    );
  };

  const handleRemoveRule = (id: number) => {
    setCoolingRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddBlacklistItem = () => {
    const trimmed = blacklistInput.trim();
    if (!trimmed) return;
    if (blacklist.includes(trimmed)) {
      setBlacklistInput("");
      return;
    }
    setBlacklist((prev) => [...prev, trimmed]);
    setBlacklistInput("");
  };

  const handleRemoveBlacklistItem = (item: string) => {
    setBlacklist((prev) => prev.filter((c) => c !== item));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);

    if (!nickname.trim()) {
      setSaveMessage("Укажи никнейм.");
      return;
    }

    const payload = {
      nickname: nickname.trim(),
      monthly_income: parseNumber(monthlyIncome),
      monthly_savings: parseNumber(monthlySavings),
      current_savings: parseNumber(currentSavings),
      use_savings: useSavings,
      notify_channel: notifyChannel,
      notify_frequency: notifyFrequency,
      cooling_ranges: coolingRanges.map((r) => ({
        min_amount: r.minAmount,
        max_amount: r.maxAmount,
        days: r.days,
      })),
      blacklist_categories: blacklist,
    };

    setIsSaving(true);
    try {
      await apiFetch("/user/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSaveMessage("Профиль сохранён.");
      void refreshProfile();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось сохранить профиль.";
      const errorCode = (error as { code?: string }).code;

      setSaveMessage(
        errorCode ? `${errorMessage} (код ошибки: ${errorCode})` : errorMessage
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Профиль
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Здесь ты настраиваешь, как ассистент будет охлаждать покупки и
            считать комфортную дату.
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
                type="number"
                value={monthlyIncome}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number(val) >= 0) {
                    setMonthlyIncome(val);
                  }
                }}
                inputProps={{ min: "0" }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Сбережения в месяц, ₽"
                type="number"
                value={monthlySavings}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number(val) >= 0) {
                    setMonthlySavings(val);
                  }
                }}
                inputProps={{ min: "0" }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Текущие накопления, ₽"
                type="number"
                value={currentSavings}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number(val) >= 0) {
                    setCurrentSavings(val);
                  }
                }}
                inputProps={{ min: "0" }}
              />
            </Grid>
          </Grid>
          <Box mt={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={useSavings}
                  onChange={(e) => setUseSavings(e.target.checked)}
                  color="primary"
                />
              }
              label="Учитывать накопления при расчёте комфортной даты покупки"
            />
          </Box>
        </Paper>

        {/* Период охлаждения */}
        <Paper sx={{ p: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Период охлаждения</Typography>
            <Button
              type="button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddRule}
            >
              Добавить правило
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" mt={1} mb={2}>
            Для каждого диапазона суммы укажи, сколько дней подождать перед
            покупкой.
          </Typography>

          <Stack spacing={1.5}>
            <Grid container sx={{ fontSize: 12, color: "text.secondary" }}>
              <Grid size={{ xs: 12, md: 3 }}>От, ₽</Grid>
              <Grid size={{ xs: 12, md: 3 }}>До, ₽</Grid>
              <Grid size={{ xs: 12, md: 3 }}>Дней ожидания</Grid>
              <Grid size={{ xs: 12, md: 3 }} />
            </Grid>

            {coolingRanges.map((rule) => (
              <Grid key={rule.id} container spacing={1} alignItems="center">
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={rule.minAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || Number(val) >= 0) {
                        handleRuleChange(rule.id, "minAmount", val);
                      }
                    }}
                    inputProps={{ min: "0" }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    placeholder="∞"
                    value={rule.maxAmount ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || Number(val) >= 0) {
                        handleRuleChange(rule.id, "maxAmount", val);
                      }
                    }}
                    inputProps={{ min: "0" }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={rule.days}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || Number(val) >= 0) {
                        handleRuleChange(rule.id, "days", val);
                      }
                    }}
                    inputProps={{ min: "0" }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <IconButton
                    color="inherit"
                    onClick={() => handleRemoveRule(rule.id)}
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
            <Paper sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Чёрный список категорий
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                То, что ты точно не хочешь покупать. Например: «кейсы в играх»,
                «доставка еды», «бесполезные подписки».
              </Typography>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  label="Категория"
                  placeholder="Название категории"
                  value={blacklistInput}
                  onChange={(e) => setBlacklistInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddBlacklistItem();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  onClick={handleAddBlacklistItem}
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
                      borderColor: "rgba(255,255,255,0.12)",
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: "100%" }}>
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
                  onChange={(e) =>
                    setNotifyChannel(e.target.value as "none" | "email")
                  }
                  fullWidth
                >
                  <MenuItem value="none">Не напоминать</MenuItem>
                  <MenuItem value="email">E-mail</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Частота"
                  value={notifyFrequency}
                  onChange={(e) =>
                    setNotifyFrequency(
                      e.target.value as "daily" | "weekly" | "monthly"
                    )
                  }
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

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

        <Box display="flex" alignItems="center" gap={2}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSaving}
          >
            {isSaving ? "Сохраняем..." : "Сохранить профиль"}
          </Button>
          {saveMessage && (
            <Typography variant="body2" color="text.secondary">
              {saveMessage}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

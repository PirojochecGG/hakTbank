import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Box,
  Grid,
  Slider,
  FormControlLabel,
  Switch,
  Chip,
  Divider,
} from '@mui/material';
import TButton from '../components/Common/TButton';
import SettingsIcon from '@mui/icons-material/Settings';
import SavingsIcon from '@mui/icons-material/Savings';
import BlockIcon from '@mui/icons-material/Block';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonIcon from '@mui/icons-material/Person';

const Profile: React.FC = () => {
  const [salary, setSalary] = useState<number>(100000);
  const [monthlySavings, setMonthlySavings] = useState<number>(20000);
  const [currentSavings, setCurrentSavings] = useState<number>(50000);
  const [coolingDays, setCoolingDays] = useState<number[]>([1, 7, 30, 90]);
  const [bannedCategories, setBannedCategories] = useState<string[]>([
    'Видеоигры',
    'Азартные игры',
    'Дорогая техника',
    'Импульсивный шопинг'
  ]);
  const [notificationFrequency, setNotificationFrequency] = useState<string>('weekly');

  const coolingRanges = [
    { label: 'До 15 000₽', days: coolingDays[0] },
    { label: '15 000 - 50 000₽', days: coolingDays[1] },
    { label: '50 000 - 100 000₽', days: coolingDays[2] },
    { label: 'От 100 000₽', days: coolingDays[3] },
  ];

  return (
    <Container maxWidth="md" sx={{ pb: '80px', pt: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon sx={{ color: '#FFD600' }} />
          Финансовый профиль
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Настройте параметры для борьбы с импульсивными покупками
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Блок 1: Основные финансовые данные */}
        <Grid size={{ xs:12 }}>
          <Paper sx={{ p: 3, backgroundColor: '#1A1A1A' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
              <SavingsIcon sx={{ color: '#FFD600' }} />
              <Typography variant="h6">Финансовые показатели</Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid size={{ xs:12, md:4}}>
                <TextField
                  fullWidth
                  label="Зарплата в месяц"
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  InputProps={{
                    endAdornment: <Typography color="text.secondary">₽</Typography>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#000000',
                    }
                  }}
                />
              </Grid>
              
              <Grid size={{ xs:12, md:4}}>
                <TextField
                  fullWidth
                  label="Откладываю в месяц"
                  type="number"
                  value={monthlySavings}
                  onChange={(e) => setMonthlySavings(Number(e.target.value))}
                  InputProps={{
                    endAdornment: <Typography color="text.secondary">₽</Typography>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#000000',
                    }
                  }}
                />
              </Grid>
              
              <Grid size={{ xs:12, md:4}}>
                <TextField
                  fullWidth
                  label="Текущие накопления"
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(Number(e.target.value))}
                  InputProps={{
                    endAdornment: <Typography color="text.secondary">₽</Typography>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#000000',
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Блок 2: Настройки охлаждения */}
        <Grid size={{ xs:12}}>
          <Paper sx={{ p: 3, backgroundColor: '#1A1A1A' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
              <SettingsIcon sx={{ color: '#FFD600' }} />
              <Typography variant="h6">Периоды охлаждения</Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Установите сколько дней подождать перед покупкой в зависимости от суммы
            </Typography>
            
            <Grid container spacing={3}>
              {coolingRanges.map((range, index) => (
                <Grid size={{ xs:12, md:6}} key={index}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{range.label}</Typography>
                      <Typography variant="body2" color="#FFD600">
                        {coolingDays[index]} {coolingDays[index] === 1 ? 'день' : 'дней'}
                      </Typography>
                    </Box>
                    <Slider
                      value={coolingDays[index]}
                      onChange={(e, newValue) => {
                        const newDays = [...coolingDays];
                        newDays[index] = newValue as number;
                        setCoolingDays(newDays);
                      }}
                      min={1}
                      max={90}
                      step={1}
                      sx={{
                        color: '#FFD600',
                        '& .MuiSlider-thumb': {
                          backgroundColor: '#FFD600',
                        }
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Блок 3: Запрещённые категории */}
        <Grid size={{ xs:12, md:6}}>
          <Paper sx={{ p: 3, backgroundColor: '#1A1A1A', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
              <BlockIcon sx={{ color: '#FFD600' }} />
              <Typography variant="h6">Запрещённые категории</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {bannedCategories.map((category, index) => (
                <Chip
                  key={index}
                  label={category}
                  onDelete={() => {
                    setBannedCategories(bannedCategories.filter((_, i) => i !== index));
                  }}
                  sx={{
                    backgroundColor: '#333333',
                    color: '#FFFFFF',
                    '& .MuiChip-deleteIcon': {
                      color: '#FFD600',
                    }
                  }}
                />
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Добавить категорию"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#000000',
                  }
                }}
              />
              <TButton size="small">Добавить</TButton>
            </Box>
          </Paper>
        </Grid>

        {/* Блок 4: Уведомления */}
        <Grid size={{ xs:12, md:6}}>
          <Paper sx={{ p: 3, backgroundColor: '#1A1A1A', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
              <NotificationsActiveIcon sx={{ color: '#FFD600' }} />
              <Typography variant="h6">Уведомления</Typography>
            </Box>
            
            <FormControlLabel
              control={<Switch defaultChecked color="primary" />}
              label="Включить уведомления"
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Частота напоминаний о желаемых покупках
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['Ежедневно', 'Раз в неделю', 'Раз в месяц'].map((freq) => (
                <Chip
                  key={freq}
                  label={freq}
                  onClick={() => setNotificationFrequency(freq.toLowerCase())}
                  sx={{
                    backgroundColor: notificationFrequency === freq.toLowerCase() ? '#FFD600' : '#333333',
                    color: notificationFrequency === freq.toLowerCase() ? '#000000' : '#FFFFFF',
                    fontWeight: 600,
                  }}
                />
              ))}
            </Box>
            
            <Divider sx={{ my: 3, borderColor: '#333333' }} />
            
            <FormControlLabel
              control={<Switch color="primary" />}
              label="Учитывать накопления при расчётах"
            />
          </Paper>
        </Grid>

        {/* Кнопка сохранения */}
        <Grid size={{ xs:12}}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <TButton sx={{ minWidth: '200px' }}>
              Сохранить настройки
            </TButton>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
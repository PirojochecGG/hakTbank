import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Box,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Chip
} from '@mui/material';
import TButton from '../components/Common/TButton';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PsychologyIcon from '@mui/icons-material/Psychology';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Привет! Я ваш рациональный помощник от Т-Банка. Помогу вам принимать взвешенные финансовые решения. Чем могу помочь?',
      sender: 'assistant',
      timestamp: new Date(Date.now() - 3600000),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Имитация ответа от ИИ
    setTimeout(() => {
      const responses = [
        "Я понимаю ваше желание купить этот товар. Давайте проанализируем вместе. Какова цена покупки?",
        "Это интересный выбор. Перед покупкой рекомендую подождать несколько дней. Часто импульсивное желание проходит.",
        "Учитывая ваш финансовый профиль, эта покупка может быть комфортной через 2 недели накоплений.",
        "Эта категория товаров у вас в списке наблюдения. Давайте проверим, действительно ли это необходимо.",
        "Помните о вашей финансовой цели. Эта покупка может отдалить её достижение на месяц.",
        "Рекомендую добавить этот товар в список желаний и вернуться к нему через неделю.",
      ];

      const assistantMessage: Message = {
        id: messages.length + 2,
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "Стоит ли покупать iPhone за 100 000₽?",
    "Как накопить на отпуск?",
    "Нужна ли мне эта дорогая куртка?",
    "Рассчитать срок накопления на ноутбук",
  ];

  return (
    <Container maxWidth="md" sx={{ pb: '100px', pt: 2, height: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <PsychologyIcon sx={{ color: '#FFD600' }} />
          Чат-помощник
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Обсудите желаемую покупку с ИИ-ассистентом
        </Typography>
      </Box>

      {/* Быстрые вопросы */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#1A1A1A' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Быстрые вопросы:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {quickQuestions.map((question, index) => (
            <Chip
              key={index}
              label={question}
              onClick={() => setInputText(question)}
              sx={{
                backgroundColor: '#333333',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#444444',
                },
                cursor: 'pointer',
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* История сообщений */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          backgroundColor: '#1A1A1A',
          height: '60vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {messages.map((message) => (
            <React.Fragment key={message.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                  px: 1,
                }}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar
                    sx={{
                      bgcolor: message.sender === 'user' ? '#FFD600' : '#333333',
                      color: message.sender === 'user' ? '#000000' : '#FFD600',
                      width: 36,
                      height: 36,
                    }}
                  >
                    {message.sender === 'user' ? (
                      <PersonIcon fontSize="small" />
                    ) : (
                      <SmartToyIcon fontSize="small" />
                    )}
                  </Avatar>
                </ListItemAvatar>
                
                <Box
                  sx={{
                    maxWidth: '70%',
                    backgroundColor: message.sender === 'user' ? '#FFD600' : '#333333',
                    color: message.sender === 'user' ? '#000000' : '#FFFFFF',
                    borderRadius: '18px',
                    p: 2,
                    position: 'relative',
                  }}
                >
                  <ListItemText
                    primary={message.text}
                    secondary={
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          color: message.sender === 'user' ? '#666666' : '#B0B0B0',
                          display: 'block',
                          mt: 1,
                        }}
                      >
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>
              </ListItem>
              <Divider variant="inset" component="li" sx={{ borderColor: '#333333' }} />
            </React.Fragment>
          ))}
          
          {isLoading && (
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: '#333333' }}>
                  <SmartToyIcon />
                </Avatar>
              </ListItemAvatar>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} sx={{ color: '#FFD600' }} />
                <Typography color="text.secondary">
                  Ассистент думает...
                </Typography>
              </Box>
            </ListItem>
          )}
          
          <div ref={messagesEndRef} />
        </List>
      </Paper>

      {/* Поле ввода */}
      <Paper 
        sx={{ 
          p: 2, 
          backgroundColor: '#1A1A1A',
          position: 'fixed',
          bottom: 70,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, maxWidth: 'md', margin: '0 auto', px: 2 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Опишите желаемую покупку или задайте вопрос..."
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#000000',
                '& fieldset': {
                  borderColor: '#333333',
                },
                '&:hover fieldset': {
                  borderColor: '#FFD600',
                },
              },
            }}
          />
          
          <IconButton
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            sx={{
              backgroundColor: '#FFD600',
              color: '#000000',
              width: 56,
              height: 56,
              '&:hover': {
                backgroundColor: '#FFE44D',
              },
              '&:disabled': {
                backgroundColor: '#333333',
                color: '#666666',
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Container>
  );
};

export default Chat;
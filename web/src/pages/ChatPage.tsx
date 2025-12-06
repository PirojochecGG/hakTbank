import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { apiFetch } from '../api/api'
import { clearStoredChatId, getStoredChatId, setStoredChatId } from '../utils/chatStorage'

type ApiChatMessage = {
  id?: string | number
  role?: 'user' | 'assistant'
  text?: string
  content?: string
  message?: string
}

type ChatWithMessagesResponse = {
  id?: string
  chat_id?: string
  messages?: ApiChatMessage[]
}

type ChatRequest = {
  text: string
  chat_id: string
  model?: string
  stream?: boolean
}

type ChatResponse = {
  id?: string
  chat_id?: string
  messages?: ApiChatMessage[]
  message?: ApiChatMessage
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

type ChatListItem = {
  id?: string
  chat_id?: string
  updated_at?: string
}

type ChatListResponse = {
  items?: ChatListItem[]
  data?: ChatListItem[]
  page?: number
  per_page?: number
  page_size?: number
  total?: number
  count?: number
}

type NormalizedChatListItem = {
  id: string
  chat_id: string
  updated_at?: string
}

const defaultAssistantMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Привет. Я помогу тебе не делать импульсивные покупки. Напиши, что хочешь купить.',
}

const normalizeMessages = (apiMessages?: ApiChatMessage[]) => {
  if (!apiMessages?.length) return []

  return apiMessages.map((msg, index) => ({
    id: String(msg.id ?? `${Date.now()}-${index}`),
    role: msg.role ?? 'assistant',
    text: msg.text ?? msg.content ?? msg.message ?? '',
  }))
}

const normalizeChatList = (apiChats?: ChatListItem[]): NormalizedChatListItem[] => {
  if (!apiChats?.length) return []

  return apiChats.map((chat, index) => ({
    id: chat.id ?? chat.chat_id ?? `${index}`,
    chat_id: chat.chat_id ?? chat.id ?? `${index}`,
    updated_at: chat.updated_at,
  }))
}

export function ChatPage() {
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([defaultAssistantMessage])

  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [chatList, setChatList] = useState<NormalizedChatListItem[]>([])
  const [chatPage, setChatPage] = useState(1)
  const [hasMoreChats, setHasMoreChats] = useState(false)

  const PAGE_SIZE = 10

  const fetchChatList = useCallback(async (page = 1) => {
    const fetchWithQuery = async (query: URLSearchParams) => {
      const response = await apiFetch<ChatListResponse | ChatListItem[]>(
        `/chats?${query.toString()}`,
      )

      const items = Array.isArray(response) ? response : (response.items ?? response.data ?? [])
      const normalized = normalizeChatList(items)
      setChatList(normalized)

      const currentPage = (response as ChatListResponse | undefined)?.page ?? page ?? 1
      const limit =
        (response as ChatListResponse | undefined)?.per_page ??
        (response as ChatListResponse | undefined)?.page_size ??
        PAGE_SIZE
      const total =
        (response as ChatListResponse | undefined)?.total ??
        (response as ChatListResponse | undefined)?.count ??
        items.length

      setHasMoreChats(total > currentPage * limit || normalized.length === limit)
      setChatPage(currentPage)
      return normalized
    }

    setIsLoadingChats(true)
    try {
      const defaultQuery = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        sort: 'updated_at,desc',
      })

      return await fetchWithQuery(defaultQuery)
    } catch (error) {
      if ((error as { status?: number }).status === 422) {
        try {
          const fallbackQuery = new URLSearchParams({
            page: String(page),
            per_page: String(PAGE_SIZE),
          })

          return await fetchWithQuery(fallbackQuery)
        } catch (fallbackError) {
          console.error('Ошибка загрузки списка чатов (fallback)', fallbackError)
          return []
        }
      }

      console.error('Ошибка загрузки списка чатов', error)
      return []
    } finally {
      setIsLoadingChats(false)
    }
  }, [])

  const fetchMessages = useCallback(async (currentChatId: string) => {
    try {
      const chatWithMessages = await apiFetch<ChatWithMessagesResponse>(
        `/chats/${currentChatId}/messages`,
      )
      const normalized = normalizeMessages(chatWithMessages.messages)

      setMessages(normalized.length ? normalized : [defaultAssistantMessage])
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Не удалось загрузить историю сообщений.'
      const errorCode = (error as { code?: string }).code

      const feedbackMessage = errorCode
        ? `${errorMessage} (код ошибки: ${errorCode})`
        : errorMessage

      setMessages([
        {
          id: 'load-error',
          role: 'assistant',
          text: `${feedbackMessage}. Попробуй обновить страницу или спроси у тиммейта по бэкенду, жив ли API.`,
        },
      ])
    }
  }, [])

  const createAndSelectChat = useCallback(async () => {
    const chat = await apiFetch<ChatWithMessagesResponse>('/chats/new', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const newChatId = chat.chat_id ?? chat.id ?? null

    if (!newChatId) {
      setMessages([
        {
          id: 'create-error',
          role: 'assistant',
          text: 'Не удалось создать новый чат. Попробуй еще раз.',
        },
      ])
      return null
    }

    setChatId(newChatId)
    setStoredChatId(newChatId)
    await fetchMessages(newChatId)
    await fetchChatList(1)
    return newChatId
  }, [fetchChatList, fetchMessages])

  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true)
      try {
        const loadedChats = await fetchChatList(1)

        const storedChatId = getStoredChatId()

        if (storedChatId) {
          setChatId(storedChatId)
          await fetchMessages(storedChatId)
          return
        }

        const existingChatId = loadedChats[0]?.chat_id
        if (existingChatId) {
          setChatId(existingChatId)
          setStoredChatId(existingChatId)
          await fetchMessages(existingChatId)
          return
        }

        await createAndSelectChat()
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Не удалось инициализировать чат.'
        const errorCode = (error as { code?: string }).code

        const feedbackMessage = errorCode
          ? `${errorMessage} (код ошибки: ${errorCode})`
          : errorMessage

        setMessages([
          {
            id: 'init-error',
            role: 'assistant',
            text: `${feedbackMessage}. Спроси у тиммейта по бэкенду, жив ли API.`,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    void initializeChat()
  }, [createAndSelectChat, fetchChatList, fetchMessages])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isSending || !chatId) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsSending(true)

    try {
      const chatRequest: ChatRequest = { text: trimmed, chat_id: chatId }

      const response = await apiFetch<ChatResponse>('/message/new', {
        method: 'POST',
        body: JSON.stringify(chatRequest),
      })

      const responseMessages = normalizeMessages(
        response.messages ?? (response.message ? [response.message] : undefined),
      )

      if (responseMessages.length) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((message) => message.id))
          const uniqueNewMessages = responseMessages.filter(
            (message) => !existingIds.has(message.id),
          )
          return uniqueNewMessages.length ? [...prev, ...uniqueNewMessages] : prev
        })
      } else {
        await fetchMessages(chatId)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Не удалось связаться с сервером.'
      const errorCode = (error as { code?: string }).code

      const feedbackMessage = errorCode
        ? `${errorMessage} (код ошибки: ${errorCode})`
        : errorMessage

      const fallback: ChatMessage = {
        id: String(Date.now()),
        role: 'assistant',
        text: `${feedbackMessage}. Спроси у тиммейта по бэкенду, жив ли API.`,
      }
      setMessages((prev) => [...prev, fallback])
    } finally {
      setIsSending(false)
    }
  }

  const handleSelectChat = async (newChatId: string) => {
    if (isLoading || isSending || newChatId === chatId) return

    setChatId(newChatId)
    setStoredChatId(newChatId)
    setIsLoading(true)
    try {
      await fetchMessages(newChatId)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateChat = async () => {
    if (isLoading || isSending) return
    setIsLoading(true)
    try {
      await createAndSelectChat()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Не удалось создать новый чат.'
      setMessages([
        {
          id: 'create-error',
          role: 'assistant',
          text: `${errorMessage}. Попробуй позже или спроси у тиммейта по бэкенду, жив ли API.`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async () => {
    if (!chatId || isLoading || isSending) return

    setIsLoading(true)
    try {
      await apiFetch(`/chats/${chatId}`, {
        method: 'DELETE',
        skipJsonParsing: true,
      })
      clearStoredChatId()
      setChatId(null)
      setMessages([defaultAssistantMessage])
      const updatedChats = await fetchChatList(1)
      const fallbackChatId = updatedChats[0]?.chat_id

      if (fallbackChatId) {
        setChatId(fallbackChatId)
        setStoredChatId(fallbackChatId)
        await fetchMessages(fallbackChatId)
        return
      }
      await createAndSelectChat()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Не удалось удалить выбранный чат.'
      const errorCode = (error as { code?: string }).code

      const feedbackMessage = errorCode
        ? `${errorMessage} (код ошибки: ${errorCode})`
        : errorMessage

      setMessages([
        {
          id: 'delete-error',
          role: 'assistant',
          text: `${feedbackMessage}. Попробуй еще раз или спроси у тиммейта по бэкенду, жив ли API.`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const chatListTitle = useMemo(
    () =>
      chatList.map((chat) => ({
        ...chat,
        title: `Чат ${chat.chat_id.slice(0, 8)}`,
      })),
    [chatList],
  )

  return (
    <Box>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Охладить трахание
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Опиши покупку или ситуацию, а ассистент подскажет, стоит ли ждать и до какой даты
            покупка будет комфортной.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Paper
            sx={{
              p: 2,
              width: { xs: '100%', md: 300 },
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                Ваши чаты
              </Typography>
              <IconButton
                aria-label="Обновить"
                size="small"
                onClick={() => void fetchChatList(chatPage)}
                disabled={isLoadingChats}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                onClick={() => void handleCreateChat()}
                disabled={isLoading || isSending}
              >
                Новый чат
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => void handleDeleteChat()}
                disabled={!chatId || isLoading || isSending}
              >
                Удалить чат
              </Button>
            </Stack>

            <Divider />

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {isLoadingChats ? (
                <Stack alignItems="center" spacing={1}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary">
                    Загружаем чаты...
                  </Typography>
                </Stack>
              ) : (
                <List dense>
                  {chatListTitle.map((chat) => (
                    <ListItemButton
                      key={chat.id}
                      selected={chat.chat_id === chatId}
                      onClick={() => void handleSelectChat(chat.chat_id)}
                    >
                      <ListItemText
                        primary={chat.title}
                        secondary={
                          chat.updated_at ? new Date(chat.updated_at).toLocaleString() : undefined
                        }
                      />
                    </ListItemButton>
                  ))}
                  {!chatListTitle.length && (
                    <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                      Чатов пока нет. Создайте новый!
                    </Typography>
                  )}
                </List>
              )}
            </Box>

            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button
                variant="outlined"
                size="small"
                onClick={() => void fetchChatList(Math.max(1, chatPage - 1))}
                disabled={isLoadingChats || chatPage <= 1}
              >
                Назад
              </Button>
              <Typography variant="caption" color="text.secondary">
                Страница {chatPage}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => void fetchChatList(chatPage + 1)}
                disabled={isLoadingChats || !hasMoreChats}
              >
                Вперед
              </Button>
            </Stack>
          </Paper>

          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: { xs: '70vh', md: '70vh' },
              flex: 1,
            }}
          >
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              {messages.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '75%',
                      bgcolor: msg.role === 'user' ? 'primary.main' : 'background.default',
                      color: msg.role === 'user' ? '#000000' : 'text.primary',
                      borderRadius:
                        msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      p: 1.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mb: 0.5,
                        color: msg.role === 'user' ? 'rgba(0,0,0,0.6)' : 'text.secondary',
                      }}
                    >
                      {msg.role === 'user' ? '' : 'Ассистент'}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                placeholder="Опиши покупку или задай вопрос..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as unknown as FormEvent)
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSending || !input.trim() || isLoading || !chatId}
                sx={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}
              >
                {isSending ? 'Отправка...' : 'Отправить'}
              </Button>
            </Box>
          </Paper>
        </Stack>
      </Stack>
    </Box>
  )
}

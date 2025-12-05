import { type FormEvent, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import { apiFetch } from "../api";

type ApiChatMessage = {
  id?: string | number;
  role?: "user" | "assistant";
  text?: string;
  content?: string;
  message?: string;
};

type ChatWithMessagesResponse = {
  id?: string;
  chat_id?: string;
  messages?: ApiChatMessage[];
};

type ChatResponse = {
  id?: string;
  chat_id?: string;
  messages?: ApiChatMessage[];
  message?: ApiChatMessage;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const defaultAssistantMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Привет. Я помогу тебе не делать импульсивные покупки. Напиши, что хочешь купить.",
};
const normalizeMessages = (apiMessages?: ApiChatMessage[]) => {
  if (!apiMessages?.length) return [];

  return apiMessages.map((msg, index) => ({
    id: String(msg.id ?? `${Date.now()}-${index}`),
    role: msg.role ?? "assistant",
    text: msg.text ?? msg.content ?? msg.message ?? "",
  }));
};

export function ChatPage() {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    defaultAssistantMessage,
  ]);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = async (currentChatId: string) => {
    try {
      const chatWithMessages = await apiFetch<ChatWithMessagesResponse>(
        `/v1/chats/${currentChatId}/messages`
      );
      const normalized = normalizeMessages(chatWithMessages.messages);

      setMessages(normalized.length ? normalized : [defaultAssistantMessage]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось загрузить историю сообщений.";
      const errorCode = (error as { code?: string }).code;

      const feedbackMessage = errorCode
        ? `${errorMessage} (код ошибки: ${errorCode})`
        : errorMessage;

      setMessages([
        {
          id: "load-error",
          role: "assistant",
          text: `${feedbackMessage}. Попробуй обновить страницу или спроси у тиммейта по бэкенду, жив ли API.`,
        },
      ]);
    }
  };

  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      try {
        const chat = await apiFetch<ChatWithMessagesResponse>("/chats/new", {
          method: "POST",
        });

        const newChatId = chat.chat_id ?? chat.id ?? null;
        setChatId(newChatId);

        if (newChatId) {
          await fetchMessages(newChatId);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Не удалось инициализировать чат.";
        const errorCode = (error as { code?: string }).code;

        const feedbackMessage = errorCode
          ? `${errorMessage} (код ошибки: ${errorCode})`
          : errorMessage;

        setMessages([
          {
            id: "init-error",
            role: "assistant",
            text: `${feedbackMessage}. Спроси у тиммейта по бэкенду, жив ли API.`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeChat();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending || !chatId) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      await apiFetch<ChatResponse>(`/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ role: "user", text: trimmed }),
      });

      await fetchMessages(chatId);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось связаться с сервером.";
      const errorCode = (error as { code?: string }).code;

      const feedbackMessage = errorCode
        ? `${errorMessage} (код ошибки: ${errorCode})`
        : errorMessage;

      const fallback: ChatMessage = {
        id: String(Date.now()),
        role: "assistant",
        text: `${feedbackMessage}. Спроси у тиммейта по бэкенду, жив ли API.`,
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Чат с моделью
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Опиши покупку или ситуацию, а ассистент подскажет, стоит ли ждать и
            до какой даты покупка будет комфортной.
          </Typography>
        </Box>

        <Paper
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: { xs: "70vh", md: "60vh" },
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              mb: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  sx={{
                    maxWidth: "75%",
                    bgcolor:
                      msg.role === "user"
                        ? "primary.main"
                        : "background.default",
                    color: msg.role === "user" ? "#000000" : "text.primary",
                    borderRadius:
                      msg.role === "user"
                        ? "16px 4px 16px 16px"
                        : "4px 16px 16px 16px",
                    p: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mb: 0.5,
                      color:
                        msg.role === "user"
                          ? "rgba(0,0,0,0.6)"
                          : "text.secondary",
                    }}
                  >
                    {msg.role === "user" ? "Ты" : "Ассистент"}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {msg.text}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", gap: 1 }}
          >
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              placeholder="Опиши покупку или задай вопрос..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSending || !input.trim() || isLoading || !chatId}
              sx={{ alignSelf: "flex-end", whiteSpace: "nowrap" }}
            >
              {isSending ? "Отправка..." : "Отправить"}
            </Button>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}

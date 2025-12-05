import { type FormEvent, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import { apiFetch } from "../api";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Привет. Я помогу тебе не делать импульсивные покупки. Напиши, что хочешь купить.",
    },
  ]);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const data = await apiFetch<{ reply: string }>("/chat", {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      });

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
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
        id: Date.now() + 2,
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
              disabled={isSending || !input.trim()}
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

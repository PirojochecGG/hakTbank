const CHAT_ID_STORAGE_KEY = "chat_id";

const isBrowser = typeof window !== "undefined";

export const getStoredChatId = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem(CHAT_ID_STORAGE_KEY);
};

export const setStoredChatId = (chatId: string) => {
  if (!isBrowser) return;
  localStorage.setItem(CHAT_ID_STORAGE_KEY, chatId);
};

export const clearStoredChatId = () => {
  if (!isBrowser) return;
  localStorage.removeItem(CHAT_ID_STORAGE_KEY);
};

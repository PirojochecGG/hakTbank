export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ACCESS_TOKEN_KEY = "access_token";

const isBrowser = typeof window !== "undefined";

let inMemoryAccessToken: string | null = null;

export const getAccessToken = () => {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (!isBrowser) return null;
  const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
  inMemoryAccessToken = stored;
  return stored;
};

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
  if (!isBrowser) return;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

export const getAuthHeaders = (): Record<string, string> | undefined => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

export type ApiErrorResponse = {
  code?: string;
  message?: string;
};

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { skipJsonParsing?: boolean } = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...init.headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const canParseJson = contentType.includes("application/json");
  const data =
    !init.skipJsonParsing && canParseJson ? await response.json() : undefined;

  if (!response.ok) {
    const errorBody = data as ApiErrorResponse | undefined;
    const error = new Error(
      errorBody?.message || response.statusText || "Unknown error"
    );
    (error as Error & { code?: string }).code =
      errorBody?.code || `HTTP_${response.status}`;
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return data as T;
}

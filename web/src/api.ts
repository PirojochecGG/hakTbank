export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;

const isBrowser = typeof window !== "undefined";

export const getAccessToken = () =>
  isBrowser ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;

export const getAuthHeaders = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

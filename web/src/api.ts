const DEFAULT_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

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
    throw error;
  }

  return data as T;
}

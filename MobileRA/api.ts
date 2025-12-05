import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

let localConfig: any = {};
try {
  localConfig = require("./app.local.json").expo?.extra || {};
} catch (e) {
  // app.local.json not found, use defaults
}
const API_URL = localConfig.apiUrl || Constants.expoConfig?.extra?.apiUrl || "http://localhost:8000/v1";

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nickname: string;
  email: string;
  password: string;
}

export interface UserInfo {
  id: string;
  nickname: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  user: UserInfo;
}

// User Profile
export interface UserProfileResponse {
  nickname: string;
  email: string;
  monthly_savings: number;
  monthly_salary: number | null;
  current_savings: number;
  blacklist: string[];
  cooling_ranges: Record<string, number>;
  notify_frequency: string;
  notify_channel: string;
}

export interface UpdateProfileRequest {
  monthly_savings?: number | null;
  monthly_salary?: number | null;
  current_savings?: number | null;
  blacklist?: string[] | null;
  cooling_ranges?: Record<string, number> | null;
  notify_frequency?: "daily" | "weekly" | "monthly" | null;
  notify_channel?: "app" | "email" | "tg" | null;
}

// Chats
export interface ChatResponse {
  id: string;
  title: string;
  last_message_at: string | null;
  created_at: string;
  last_message?: {
    id: string;
    role: "assistant" | "system" | "user" | "tool";
    content: string;
    created_at: string;
  };
}

export interface PaginatedChatsResponse {
  items: ChatResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CreateChatRequest {
  title?: string;
}

export interface ChatWithMessagesResponse {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: "assistant" | "system" | "user" | "tool";
    content: string;
    created_at: string;
  }>;
  created_at: string;
}

// Purchases
export type PurchaseStatus = "pending" | "completed" | "cancelled";

export interface PurchaseResponse {
  id: string;
  name: string;
  price: number;
  category: string;
  picture: string | null;
  url: string | null;
  status: PurchaseStatus;
  cooling_days: number;
  available_date: string | null;
  notify_excluded: boolean;
  created_at: string;
}

export interface CreatePurchaseRequest {
  name: string;
  price: number;
  category: string;
  picture?: string | null;
  url?: string | null;
}

export interface UpdatePurchaseStatusRequest {
  status?: PurchaseStatus | null;
  notify_excluded?: boolean | null;
}

export interface AnalyzePurchaseRequest {
  price: number;
  category: string;
}

export interface AnalyzePurchaseResponse {
  is_blacklisted: boolean;
  cooling_days: number;
  savings_days: number;
  total_days: number;
  available_date: string | null;
  recommendation: string;
}

// Helper function to get auth header
async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Auth endpoints
export async function login(data: LoginRequest): Promise<AuthResponse> {
  console.log("[API] Login attempt:", { email: data.email, url: `${API_URL}/auth/login` });
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  console.log("[API] Login response status:", response.status);
  if (!response.ok) {
    const error = await response.text();
    console.log("[API] Login error:", error);
    throw new Error("Login failed");
  }
  const result = await response.json();
  console.log("[API] Login success, token saved");
  await AsyncStorage.setItem("access_token", result.access_token);
  return result;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  console.log("[API] Register attempt:", { email: data.email, nickname: data.nickname, url: `${API_URL}/auth/register` });
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  console.log("[API] Register response status:", response.status);
  if (!response.ok) {
    const error = await response.text();
    console.log("[API] Register error:", error);
    throw new Error("Registration failed");
  }
  const result = await response.json();
  console.log("[API] Register success, token saved");
  await AsyncStorage.setItem("access_token", result.access_token);
  return result;
}

// User Profile endpoints
export async function getProfile(): Promise<UserProfileResponse> {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/user/profile`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders } as Record<string, string>,
  });
  
  if (!response.ok) throw new Error("Failed to get profile");
  return response.json();
}

export async function updateProfile(data: UpdateProfileRequest): Promise<UserProfileResponse> {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/user/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders } as Record<string, string>,
    body: JSON.stringify(data),
  });
  
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
}

// Chat endpoints
export async function getChats(page: number = 1, size: number = 10, sort: string = "new"): Promise<PaginatedChatsResponse> {
  const authHeaders = await getAuthHeader();
  const params = new URLSearchParams({ page: String(page), size: String(size), sort });
  const response = await fetch(`${API_URL}/chats?${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders } as Record<string, string>,
  });
  
  if (!response.ok) throw new Error("Failed to get chats");
  return response.json();
}

export async function getChatById(chatId: string): Promise<ChatResponse> {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/chats/${chatId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders } as Record<string, string>,
  });
  
  if (!response.ok) throw new Error("Failed to get chat");
  return response.json();
}

export async function createChat(data: CreateChatRequest): Promise<ChatResponse> {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/chats/new`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders } as Record<string, string>,
    body: JSON.stringify(data),
  });
  
  if (!response.ok) throw new Error("Failed to create chat");
  return response.json();
}

export async function deleteChat(chatId: string): Promise<void> {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/chats/${chatId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders } as Record<string, string>,
  });
  
  if (!response.ok) throw new Error("Failed to delete chat");
}

export async function getChatMessages(chatId: string): Promise<ChatWithMessagesResponse> {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders } as Record<string, string>,
  });
  
  if (!response.ok) throw new Error("Failed to get messages");
  return response.json();
}

// Purchase endpoints
export async function createPurchase(chatId: string, data: CreatePurchaseRequest): Promise<PurchaseResponse> {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/purchases/chat/${chatId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders } as Record<string, string>,
    body: JSON.stringify(data),
  });
  
  if (!response.ok) throw new Error("Failed to create purchase");
  return response.json();
}

export async function getChatPurchases(chatId: string): Promise<PurchaseResponse[]> {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/purchases/chat/${chatId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders } as Record<string, string>,
  });
  
  if (!response.ok) throw new Error("Failed to get purchases");
  return response.json();
}

export async function updatePurchaseStatus(purchaseId: string, data: UpdatePurchaseStatusRequest): Promise<PurchaseResponse> {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/purchases/${purchaseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders } as Record<string, string>,
    body: JSON.stringify(data),
  });
  
  if (!response.ok) throw new Error("Failed to update purchase");
  return response.json();
}

export async function analyzePurchase(data: AnalyzePurchaseRequest): Promise<AnalyzePurchaseResponse> {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}/purchases/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders } as Record<string, string>,
    body: JSON.stringify(data),
  });
  
  if (!response.ok) throw new Error("Failed to analyze purchase");
  return response.json();
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem("access_token");
}

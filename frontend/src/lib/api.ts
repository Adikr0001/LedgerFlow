import type {
  ApiResponse,
  AuditEvent,
  AuthSession,
  Notification,
  Page,
  ReconciliationReport,
  Transaction,
  Wallet,
} from "../types/api";

const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
const TOKEN_KEY = "ledgerflow.session";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function saveSession(session: AuthSession) {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(session));
}

export function readSession(): AuthSession | null {
  const stored = sessionStorage.getItem(TOKEN_KEY);
  if (!stored) return null;
  try {
    const session: unknown = JSON.parse(stored);
    if (
      typeof session === "object" &&
      session !== null &&
      "token" in session &&
      "username" in session &&
      typeof session.token === "string" &&
      typeof session.username === "string"
    ) {
      return session as AuthSession;
    }
  } catch {
    sessionStorage.removeItem(TOKEN_KEY);
  }
  return null;
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = readSession();
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

  let response: Response;
  try {
    const url = path.startsWith("/actuator/") ? path : `${baseUrl}${path}`;
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new ApiError("Could not reach LedgerFlow. Check the API connection and retry.", 0);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : response.status === 401
          ? "Your session has expired. Please sign in again."
          : `Request failed (${response.status}). Please try again.`;
    if (response.status === 401) {
      clearSession();
      window.dispatchEvent(new Event("ledgerflow:unauthorized"));
    }
    throw new ApiError(message, response.status);
  }

  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new ApiError("The API returned an unexpected response.", response.status);
  }
  return (payload as ApiResponse<T>).data;
}

export const api = {
  login: (username: string, password: string) =>
    request<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  register: (username: string, email: string, password: string) =>
    request<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),
  wallets: () => request<Wallet[]>("/wallets"),
  createWallet: (currency: string) =>
    request<{ walletId: number; currency: string; balance: string }>("/wallets", {
      method: "POST",
      body: JSON.stringify({ currency }),
    }),
  balance: (walletId: number) => request<{ walletId: number; balance: string }>(`/wallets/${walletId}/balance`),
  deposit: (walletId: number, amount: string, currency: string, idempotencyKey: string) =>
    request<{ walletId: number; balance: string }>(`/wallets/${walletId}/deposits`, {
      method: "POST",
      body: JSON.stringify({ amount, currency, idempotencyKey }),
    }),
  transfer: (sourceWalletId: number, targetWalletId: number, amount: string, currency: string, idempotencyKey: string) =>
    request<{ transactionId: number; status: string; amount: string }>("/transfers", {
      method: "POST",
      body: JSON.stringify({ sourceWalletId, targetWalletId, amount, currency, idempotencyKey }),
    }),
  transactions: (page: number, size: number) => request<Page<Transaction>>(`/transactions?page=${page}&size=${size}&sort=createdAt,desc`),
  transaction: (id: number) => request<Transaction>(`/transactions/${id}`),
  reverse: (id: number, idempotencyKey: string) =>
    request<{ transactionId: number; status: string }>(`/transactions/${id}/reversals`, {
      method: "POST",
      body: JSON.stringify({ idempotencyKey }),
    }),
  notifications: () => request<Notification[]>("/notifications"),
  auditEvents: () => request<AuditEvent[]>("/admin/audit-events"),
  reconciliation: () => request<ReconciliationReport[]>("/admin/reconciliation"),
  health: async () => {
    let response: Response;
    try {
      const apiOrigin = new URL(baseUrl, window.location.origin).origin;
      response = await fetch(`${apiOrigin}/actuator/health`);
    } catch {
      throw new ApiError("Could not reach the health endpoint.", 0);
    }
    if (!response.ok) throw new ApiError(`Health check failed (${response.status}).`, response.status);
    return (await response.json()) as { status: string };
  },
};

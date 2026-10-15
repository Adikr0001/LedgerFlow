export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface AuthSession {
  userId: number;
  username: string;
  role: "USER" | "ADMIN" | string;
  token: string;
}

export interface Wallet {
  id: number;
  userId: number;
  currency: string;
  balance: string;
  status: "ACTIVE" | "FROZEN" | string;
  createdAt: string;
}

export interface Transaction {
  id: number;
  transactionRef: string;
  type: "DEPOSIT" | "TRANSFER" | "REVERSAL" | string;
  status: "PENDING" | "COMPLETED" | "REVERSED" | "FAILED" | string;
  amount: string;
  currency: string;
  sourceWalletId: number | null;
  targetWalletId: number | null;
  initiatorUserId: number;
  originalTransactionId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface AuditEvent {
  id: number;
  eventType: string;
  actorUserId: number | null;
  walletId: number | null;
  transactionId: number | null;
  payload: string | null;
  createdAt: string;
}

export interface ReconciliationReport {
  id: number;
  reportRef: string;
  discrepancies: string;
  status: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  message: string;
  readFlag: boolean;
  transactionId: number | null;
  createdAt: string;
}

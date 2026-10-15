import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { AuthPage } from "./pages/AuthPage";
import { AdminPage, OverviewPage, TransactionsPage, TransfersPage, WalletsPage } from "./pages/WorkspacePages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, refetchOnWindowFocus: false, retry: 1 },
    mutations: { retry: false },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppShell />}>
              <Route index element={<OverviewPage />} />
              <Route path="wallets" element={<WalletsPage />} />
              <Route path="transfers" element={<TransfersPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute admin />}>
            <Route path="/app/admin" element={<AppShell />}>
              <Route index element={<AdminPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}

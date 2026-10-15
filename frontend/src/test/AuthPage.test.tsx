import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth/AuthContext";
import { AuthPage } from "../pages/AuthPage";
import { ApiError, api } from "../lib/api";

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, api: { ...actual.api, login: vi.fn(), register: vi.fn() } };
});

function renderLogin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/app" element={<p>Dashboard is ready</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("authentication form", () => {
  beforeEach(() => vi.clearAllMocks());

  it("signs in and navigates to the dashboard", async () => {
    vi.mocked(api.login).mockResolvedValue({ userId: 7, username: "maya", role: "USER", token: "jwt" });
    renderLogin();
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "maya" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText("Dashboard is ready")).toBeInTheDocument();
    expect(api.login).toHaveBeenCalledWith("maya", "secret123");
    expect(sessionStorage.getItem("ledgerflow.session")).toContain("jwt");
  });

  it("shows API errors to the user", async () => {
    vi.mocked(api.login).mockRejectedValue(new ApiError("Invalid username or password", 401));
    renderLogin();
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "maya" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "incorrect" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Invalid username or password"));
  });
});

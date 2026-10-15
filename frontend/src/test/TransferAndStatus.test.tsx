import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StatusBadge } from "../components/ui/StatusBadge";
import { api } from "../lib/api";
import { money } from "../lib/utils";
import { TransfersPage } from "../pages/WorkspacePages";

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, api: { ...actual.api, wallets: vi.fn(), transfer: vi.fn() } };
});

function renderTransfers() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><TransfersPage /></QueryClientProvider>);
}

describe("transfers and transaction status", () => {
  it("submits the entered amount to the backend API", async () => {
    vi.mocked(api.wallets).mockResolvedValue([
      { id: 11, userId: 1, currency: "USD", balance: "100.00", status: "ACTIVE", createdAt: "2026-01-01T00:00:00Z" },
      { id: 22, userId: 2, currency: "USD", balance: "0.00", status: "ACTIVE", createdAt: "2026-01-01T00:00:00Z" },
    ]);
    vi.mocked(api.transfer).mockResolvedValue({ transactionId: 77, status: "COMPLETED", amount: "25.00" });
    renderTransfers();
    await screen.findByText(/Transfer details/);
    fireEvent.change(await screen.findByLabelText(/From wallet/), { target: { value: "11" } });
    fireEvent.change(await screen.findByLabelText(/To wallet/), { target: { value: "22" } });
    fireEvent.change(await screen.findByLabelText(/Amount/), { target: { value: "25.00" } });
    fireEvent.click(screen.getByRole("button", { name: /review and send/i }));
    await waitFor(() => expect(api.transfer).toHaveBeenCalledWith(11, 22, "25.00", "USD", expect.stringMatching(/^transfer-/)));
    expect(await screen.findByRole("status")).toHaveTextContent(/Transaction #77 is completed/);
  });

  it("shows transaction states clearly", () => {
    const { rerender } = render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
    rerender(<StatusBadge status="REVERSED" />);
    expect(screen.getByText("REVERSED")).toBeInTheDocument();
  });

  it("formats large monetary strings without floating-point rounding", () => {
    expect(money("90071992547409931234.56", "USD")).toContain("90,071,992,547,409,931,234.56");
  });
});
